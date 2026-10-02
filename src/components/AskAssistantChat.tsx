import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { AlertTriangle, ArrowDown, Bot, Check, Copy, ExternalLink, FileText, LoaderCircle, Mic, Pencil, Plus, RotateCcw, Search, Send, ShieldCheck, Trash2, Volume2, X } from "lucide-react";
import ReadAloudButton from "./ReadAloudButton";
import "./AskAssistantChat.css";
import { getDocumentFile } from "../documentFiles";

type AskLanguage = "en" | "kn";
type ChatDocument = { id: string; name: string; fileStored?: boolean };
type Source = { title: string; url: string };
type OfflineResolution = { answer?: { text: string; sources?: Source[] }; correction?: { original: string; corrected: string } };
const QUICK_PROMPTS: Record<AskLanguage, string[]> = {
  en: ["I have a cough", "I have leg pain", "What is metformin used for?", "I missed a dose"],
  kn: ["ನನಗೆ ಕೆಮ್ಮು ಇದೆ", "ನನಗೆ ಕಾಲು ನೋವು ಇದೆ", "ಮೆಟ್‌ಫಾರ್ಮಿನ್ ಏಕೆ ಬಳಸುತ್ತಾರೆ?", "ನಾನು ಡೋಸ್ ಮರೆತಿದ್ದೇನೆ"],
};
type Message = { id: string; role: "user" | "assistant"; text: string; sources?: Source[]; error?: boolean; pending?: boolean };
type Conversation = { id: string; title: string; updatedAt: number; messages: Message[] };
type RetryRequest = { conversationId: string; question: string; excerpt: string; prior: Message[]; responseId: string };
type SpeechResult = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  onresult: ((event: SpeechResult) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechConstructor = new () => SpeechRecognitionLike;
type SpeechWindow = Window & { SpeechRecognition?: SpeechConstructor; webkitSpeechRecognition?: SpeechConstructor };

const SESSION_KEY = "carepath_ai_session_v2";
const SAVED_KEY = "carepath_ai_chats_v2";
const LEGACY_KEY = "carepath_ai_chat_v1";
const ASSISTANT_ENDPOINT = import.meta.env.VITE_CAREPATH_AI_ENDPOINT?.trim() ?? "";
const short = (text: string, limit: number) => text.length > limit ? `${text.slice(0, limit)}…` : text;
const newId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function cleanMessages(value: unknown): Message[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Message => Boolean(item && typeof item === "object") && ((item as Message).role === "user" || (item as Message).role === "assistant") && typeof (item as Message).text === "string")
    .slice(-24).map((item) => ({
      id: typeof item.id === "string" ? item.id : newId(),
      role: item.role,
      text: short(item.text, 5000),
      error: Boolean(item.error),
      sources: Array.isArray(item.sources) ? item.sources.filter((source): source is Source => Boolean(source && typeof source.title === "string" && typeof source.url === "string" && /^https:\/\//i.test(source.url))).slice(0, 5) : [],
    }));
}

function createConversation(): Conversation {
  return { id: newId(), title: "New conversation", updatedAt: Date.now(), messages: [] };
}

function localConversationReply(question: string, language: AskLanguage): string | null {
  const normalized = question.normalize("NFC").toLocaleLowerCase().replace(/[.!?,]+/gu, " ").replace(/\s+/gu, " ").trim();
  const kannada = /[\u0C80-\u0CFF]/u.test(question);
  const answerLanguage = kannada ? "kn" : language;
  const greeting = /^(?:(?:hi|hello|hey|namaste|ನಮಸ್ಕಾರ|ಹಾಯ್|ಹಲೋ)(?:\s+there)?\s*)?(?:how are you(?: doing)?|how is it going|what is up|what's up|are you there|ನೀವು ಹೇಗಿದ್ದೀರಿ|ಹೇಗಿದ್ದೀರಿ|ನೀವು ಚೆನ್ನಾಗಿದ್ದೀರಾ)?$/u.test(normalized)
    || /^(?:good morning|good afternoon|good evening)$/u.test(normalized);
  if (greeting) return answerLanguage === "kn"
    ? "ನಮಸ್ಕಾರ! ಕೇಳಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದ—ನಾನು ಸಹಾಯಕ್ಕೆ ಸಿದ್ಧವಾಗಿದ್ದೇನೆ. ಇಂದು ಏನು ಮಾತನಾಡಲು ಅಥವಾ ತಿಳಿಯಲು ಇಷ್ಟ? ಕನ್ನಡ ಅಥವಾ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಬರೆಯಬಹುದು. ಈ ತಾಣಕ್ಕೆ ಇನ್ನೂ ಲೈವ್ AI ಸಂಪರ್ಕವಿಲ್ಲ; ಸದ್ಯ ಪರಿಶೀಲಿತ ಮಾರ್ಗದರ್ಶಿಗಳಲ್ಲಿ ಸಹಾಯ ಮಾಡಬಹುದು."
    : "Hi! Thanks for asking—I’m here and ready to help. What would you like to talk about or learn today? You can write in English or Kannada. Live AI isn’t connected to this site yet, so for now I can help with the reviewed guides below.";

  const immediateRisk = /\b(?:kill myself|hurt myself|harm myself|suicid(?:e|al)|want to die|end my life|hurt someone|harm someone)\b|ಆತ್ಮಹತ್ಯೆ|ನನಗೆ ಬದುಕ(?:ಲು|ಬೇಕೆನಿಸುವುದಿಲ್ಲ)/iu.test(question);
  if (immediateRisk) return answerLanguage === "kn"
    ? "ನೀವು ಇದನ್ನು ಎದುರಿಸುತ್ತಿರುವುದಕ್ಕೆ ವಿಷಾದಿಸುತ್ತೇನೆ. ಈಗ ನಿಮಗೆ ಅಥವಾ ಇನ್ನೊಬ್ಬರಿಗೆ ತಕ್ಷಣದ ಅಪಾಯವಿದ್ದರೆ, ಸ್ಥಳೀಯ ತುರ್ತು ಸೇವೆಗೆ ಕರೆ ಮಾಡಿ ಅಥವಾ ಹತ್ತಿರದ ತುರ್ತು ಚಿಕಿತ್ಸಾ ವಿಭಾಗಕ್ಕೆ ಹೋಗಿ. ನಂಬಿಕೆಯ ವ್ಯಕ್ತಿಗೆ ಈಗಲೇ ತಿಳಿಸಿ, ನಿಮ್ಮ ಜೊತೆಯಲ್ಲಿರಲು ಕೇಳಿ. ನಾನು ಆಪ್‌ನಿಂದ ಕರೆ ಮಾಡಲು ಸಾಧ್ಯವಿಲ್ಲ—ಉತ್ತರಕ್ಕಾಗಿ ಕಾಯಬೇಡಿ."
    : "I’m sorry you’re facing this. If you or someone else may be in immediate danger, contact local emergency services or go to the nearest emergency department now. Tell someone you trust and ask them to stay with you. I can’t call for you—please don’t wait for an app reply.";

  const supportive = /\b(?:i(?:'m| am| feel| have been)|feeling)\s+(?:(?:really|very|so)\s+)?(?:worried|anxious|scared|sad|lonely|alone|overwhelmed|stressed|upset|afraid|nervous|down|not okay|not ok)\b|\bneed someone to talk\b|ನನಗೆ[^.!?]{0,36}(?:ಚಿಂತೆ|ಭಯ|ದುಃಖ|ಒತ್ತಡ|ಆತಂಕ|ಒಂಟಿತನ)|ನಾನು[^.!?]{0,24}(?:ಒಂಟಿ|ದುಃಖ|ಭಯ|ಚಿಂತಿತ)/iu.test(question);
  if (supportive) return answerLanguage === "kn"
    ? "ಇದು ನಿಮಗೆ ಕಷ್ಟವಾಗಿರಬಹುದು. ನಿಮ್ಮ ಮಾತು ಹಂಚಿಕೊಂಡಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದ—ನಿಮಗೆ ಬೇಕಾದಷ್ಟು ಮಾತ್ರ ಹೇಳಿ. ನಾನು ಆಪ್, ವ್ಯಕ್ತಿ ಅಥವಾ ವೈದ್ಯರ ಬದಲಿಯಲ್ಲ; ಆದರೆ ನಿಮ್ಮ ಆಲೋಚನೆಗಳನ್ನು ಸರಿಪಡಿಸಲು ಅಥವಾ ನಂಬಿಕೆಯ ವ್ಯಕ್ತಿಗೆ ಏನು ಹೇಳಬೇಕು ಎಂದು ಸಿದ್ಧಪಡಿಸಲು ಸಹಾಯ ಮಾಡಬಹುದು. ತಕ್ಷಣದ ಅಪಾಯವಿದ್ದರೆ ಅಥವಾ ನಿಮಗೆ/ಇನ್ನೊಬ್ಬರಿಗೆ ಹಾನಿ ಮಾಡುವ ಭಯವಿದ್ದರೆ, ಸ್ಥಳೀಯ ತುರ್ತು ಸೇವೆ ಮತ್ತು ನಂಬಿಕೆಯ ವ್ಯಕ್ತಿಯನ್ನು ಈಗಲೇ ಸಂಪರ್ಕಿಸಿ; ಆಪ್ ಉತ್ತರಕ್ಕಾಗಿ ಕಾಯಬೇಡಿ."
    : "That sounds difficult, and I’m glad you told me. Share only what you want. I’m an app, not a person or clinician, but I can help you sort through your thoughts or prepare what to say to someone you trust. If you’re in immediate danger or may hurt yourself or someone else, contact local emergency services and a trusted person now; don’t wait for an app reply.";

  if (/^(?:thanks|thank you|ಧನ್ಯವಾದ|ಧನ್ಯವಾದಗಳು)$/u.test(normalized)) return answerLanguage === "kn"
    ? "ಸ್ವಾಗತ. ಇನ್ನೇನಾದರೂ ಕೇಳಲು ಅಥವಾ ಹಂಚಿಕೊಳ್ಳಲು ಇಷ್ಟವಿದ್ದರೆ ಬರೆಯಿರಿ—ಕನ್ನಡ ಅಥವಾ ಇಂಗ್ಲಿಷ್ ಎರಡೂ ಸರಿ."
    : "You’re welcome. If there’s anything else you’d like to ask or share, go ahead—English or Kannada is fine.";
  return null;
}

function readConversations(storage: Storage, key: string): Conversation[] {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(key) || "null");
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is Conversation => Boolean(item && typeof item === "object" && typeof (item as Conversation).id === "string"))
        .slice(0, 12).map((item) => ({
          id: item.id,
          title: typeof item.title === "string" ? short(item.title, 70) : "New conversation",
          updatedAt: typeof item.updatedAt === "number" ? item.updatedAt : Date.now(),
          messages: cleanMessages(item.messages),
        }));
    }
  } catch { /* An unavailable or invalid local history starts a fresh session. */ }
  return [];
}

function restoreLegacyConversation(): Conversation[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(LEGACY_KEY) || "null");
    const messages = cleanMessages(parsed);
    if (!messages.length) return [];
    const firstQuestion = messages.find((message) => message.role === "user")?.text || "Saved conversation";
    return [{ id: newId(), title: short(firstQuestion, 42), updatedAt: Date.now(), messages }];
  } catch { return []; }
}

function initialWorkspace(saved: boolean): { conversations: Conversation[]; activeId: string } {
  let conversations: Conversation[] = [];
  try { conversations = readConversations(sessionStorage, SESSION_KEY); } catch { /* Continue without session storage if unavailable. */ }
  if (!conversations.length && saved) {
    try { conversations = readConversations(localStorage, SAVED_KEY); } catch { /* Persistent history is optional. */ }
  }
  if (!conversations.length && saved) conversations = restoreLegacyConversation();
  if (!conversations.length) conversations = [createConversation()];
  return { conversations, activeId: conversations[0].id };
}

export default function AskAssistantChat({ language, onLanguageChange, documents, initialQuestion = "", onTryOfflineGuide, onResolveOfflineQuestion }: { language: AskLanguage; onLanguageChange: (value: AskLanguage) => void; documents: ChatDocument[]; initialQuestion?: string; onTryOfflineGuide?: (question: string) => void; onResolveOfflineQuestion?: (question: string) => OfflineResolution | null }) {
  const [saveHistory, setSaveHistory] = useState(() => {
    try { return localStorage.getItem("carepath_ai_chat_save") === "true"; } catch { return false; }
  });
  const [workspace, setWorkspace] = useState(() => initialWorkspace(saveHistory));
  const [input, setInput] = useState(initialQuestion);
  const [historySearch, setHistorySearch] = useState("");
  const [consent, setConsent] = useState(false);
  const [includeDocument, setIncludeDocument] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState("");
  const [retry, setRetry] = useState<RetryRequest | null>(null);
  const [pendingCorrection, setPendingCorrection] = useState<{ question: string; original: string; corrected: string; excerpt: string } | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const conversations = workspace.conversations;
  const activeConversation = conversations.find((item) => item.id === workspace.activeId) ?? conversations[0];
  const messages = useMemo(() => activeConversation?.messages ?? [], [activeConversation]);

  useEffect(() => {
    try {
      const clean = conversations.slice(0, 12).map((conversation) => ({ ...conversation, messages: conversation.messages.filter((message) => !message.pending).slice(-24).map((message) => ({ ...message, text: short(message.text, 5000) })) }));
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(clean));
      if (saveHistory) localStorage.setItem(SAVED_KEY, JSON.stringify(clean));
      else { localStorage.removeItem(SAVED_KEY); localStorage.removeItem(LEGACY_KEY); }
    } catch { /* This tab remains usable even when browser storage is unavailable. */ }
  }, [conversations, saveHistory]);

  useEffect(() => {
    const thread = threadRef.current;
    if (thread) thread.scrollTop = thread.scrollHeight;
  }, [messages]);

  useEffect(() => () => { recognitionRef.current?.stop(); }, []);

  const copy = language === "en" ? {
    title: "Ask CARE CONNECTED", subtitle: "A calm place to ask, explore, and follow up. Check sources for current facts.",
    ready: "Secure AI server configured", offline: "Live AI is not connected", notConfigured: "Live AI is not connected to this GitHub Pages site. Your question stays on this device. You can still try the reviewed offline health and medicine guides below; a server and private provider key are required for open-ended AI answers.", offlineResponse: "I want to help, but live AI isn’t connected to this site yet. Your question was not sent, and I don’t want to guess at an answer. You can try a reviewed guide below; a site administrator must connect a secure AI server for open-ended answers.", offlineGuide: "Try a reviewed guide below", offlineGuideHint: "Your question stays on this device.",
    consentTitle: "Review before sending", consent: "Your question and recent messages will go to the configured server and its AI provider. Saved health records are not attached. If you select a document, its extracted text will also be sent for this request.",
    docToggle: "Ask about a saved document", selectDoc: "Choose a saved document", noDocs: "No saved documents with reviewed text are available.",
    save: "Save conversation history on this device", saveHint: "Off by default. Without this, chats stay in this browser tab only.",
    placeholder: "Ask anything in English or Kannada…", send: "Send question", listen: "Speak your question", stopMic: "Stop voice input", listenHint: "Review recognized words before sending. Browser voice recognition may use its own service.",
    sourceLabel: "Sources to review", noSources: "No web citations came back. Check current facts with a reliable source.", intro: "Ask an open question, attach a reviewed document excerpt, or continue a conversation. Start a new chat to keep topics separate.",
    noDiagnosis: "Health answers are educational · no diagnosis or personal medicine instructions", urgent: "If someone may be in immediate danger, contact local emergency services now. Do not wait for an AI reply.",
    failure: "The assistant could not answer. Check the connection and try again.", credentials: "The AI server is online, but its provider key is not configured yet. Ask the site administrator to finish server setup.", rateLimited: "The assistant is busy right now. Wait a little and retry.", retry: "Retry", clear: "Clear conversation", clearLabel: "Clear this conversation", sending: "Preparing an answer…", storageError: "This browser could not save the chat history.",
    consentNeeded: "Review and agree before sending your question to the AI service.", docReadError: "I could not read that saved document. Open Scan & Upload and review its extracted text first.", askHint: "AI answers can be wrong. For personal health decisions, follow your current care plan and ask a qualified professional.",
    newChat: "New chat", history: "Recent chats", searchHistory: "Search chats", emptyHistory: "Your conversations will appear here.", rename: "Rename", delete: "Delete", copyAnswer: "Copy answer", regenerate: "Regenerate answer", saved: "Saved on this device", temporary: "This tab only",
  } : {
    title: "CARE CONNECTED ಗೆ ಕೇಳಿ", subtitle: "ಪ್ರಶ್ನೆ, ಅನ್ವೇಷಣೆ ಮತ್ತು ಮುಂದಿನ ಪ್ರಶ್ನೆಗಳಿಗೆ ಶಾಂತ ಸ್ಥಳ. ಇತ್ತೀಚಿನ ಮಾಹಿತಿಗೆ ಮೂಲ ಪರಿಶೀಲಿಸಿ.",
    ready: "ಸುರಕ್ಷಿತ AI ಸರ್ವರ್ ಹೊಂದಿಸಲಾಗಿದೆ", offline: "ಲೈವ್ AI ಸಂಪರ್ಕವಿಲ್ಲ", notConfigured: "ಈ GitHub Pages ತಾಣಕ್ಕೆ ಲೈವ್ AI ಸಂಪರ್ಕವಿಲ್ಲ. ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಈ ಸಾಧನದಲ್ಲೇ ಇರುತ್ತದೆ. ಕೆಳಗಿನ ಪರಿಶೀಲಿತ ಆರೋಗ್ಯ ಮತ್ತು ಔಷಧಿ ಮಾರ್ಗದರ್ಶಿಗಳನ್ನು ಪ್ರಯತ್ನಿಸಬಹುದು; ಮುಕ್ತ AI ಉತ್ತರಗಳಿಗೆ ಸರ್ವರ್ ಮತ್ತು ಖಾಸಗಿ ಸೇವಾ ಕೀ ಅಗತ್ಯ.", offlineResponse: "ಸಹಾಯ ಮಾಡಲು ಬಯಸುತ್ತೇನೆ; ಆದರೆ ಈ ತಾಣಕ್ಕೆ ಇನ್ನೂ ಲೈವ್ AI ಸಂಪರ್ಕವಿಲ್ಲ. ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಕಳುಹಿಸಲಿಲ್ಲ ಮತ್ತು ಊಹಿಸಿ ಉತ್ತರಿಸುವುದಿಲ್ಲ. ಕೆಳಗಿನ ಪರಿಶೀಲಿತ ಮಾರ್ಗದರ್ಶಿ ಪ್ರಯತ್ನಿಸಿ; ಮುಕ್ತ ಪ್ರಶ್ನೆಗಳಿಗೆ ತಾಣದ ನಿರ್ವಾಹಕರು ಸುರಕ್ಷಿತ AI ಸರ್ವರ್ ಸಂಪರ್ಕಿಸಬೇಕು.", offlineGuide: "ಕೆಳಗಿನ ಪರಿಶೀಲಿತ ಮಾರ್ಗದರ್ಶಿ ನೋಡಿ", offlineGuideHint: "ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಈ ಸಾಧನದಲ್ಲೇ ಇರುತ್ತದೆ.",
    consentTitle: "ಕಳುಹಿಸುವ ಮೊದಲು ಪರಿಶೀಲಿಸಿ", consent: "ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಮತ್ತು ಇತ್ತೀಚಿನ ಸಂದೇಶಗಳು ಹೊಂದಿಸಿದ ಸರ್ವರ್ ಮತ್ತು AI ಸೇವೆಗೆ ಹೋಗುತ್ತವೆ. ಉಳಿಸಿದ ಆರೋಗ್ಯ ದಾಖಲೆಗಳನ್ನು ಸೇರಿಸುವುದಿಲ್ಲ. ದಾಖಲೆಯನ್ನು ಆರಿಸಿದರೆ ಅದರ ಹೊರತೆಗೆದ ಪಠ್ಯ ಈ ವಿನಂತಿಗೆ ಕಳುಹಿಸಲಾಗುತ್ತದೆ.",
    docToggle: "ಉಳಿಸಿದ ದಾಖಲೆಯ ಬಗ್ಗೆ ಕೇಳಿ", selectDoc: "ಉಳಿಸಿದ ದಾಖಲೆ ಆಯ್ಕೆಮಾಡಿ", noDocs: "ಪರಿಶೀಲಿಸಿದ ಪಠ್ಯವಿರುವ ಉಳಿಸಿದ ದಾಖಲೆಗಳಿಲ್ಲ.",
    save: "ಈ ಸಾಧನದಲ್ಲಿ ಚಾಟ್ ಇತಿಹಾಸ ಉಳಿಸಿ", saveHint: "ಮೊದಲಿನಿಂದ ಆಫ್. ಇಲ್ಲದಿದ್ದರೆ ಚಾಟ್ ಈ ಟ್ಯಾಬ್‌ನಲ್ಲಷ್ಟೇ ಇರುತ್ತದೆ.",
    placeholder: "English ಅಥವಾ ಕನ್ನಡದಲ್ಲಿ ಏನನ್ನಾದರೂ ಕೇಳಿ…", send: "ಪ್ರಶ್ನೆ ಕಳುಹಿಸಿ", listen: "ಪ್ರಶ್ನೆ ಮಾತನಾಡಿ", stopMic: "ಧ್ವನಿ ಇನ್‌ಪುಟ್ ನಿಲ್ಲಿಸಿ", listenHint: "ಕಳುಹಿಸುವ ಮೊದಲು ಗುರುತಿಸಿದ ಪದಗಳನ್ನು ಪರಿಶೀಲಿಸಿ. ಬ್ರೌಸರ್ ಧ್ವನಿ ಸೇವೆ ಬಳಸಬಹುದು.",
    sourceLabel: "ಪರಿಶೀಲಿಸಬೇಕಾದ ಮೂಲಗಳು", noSources: "ವೆಬ್ ಮೂಲಗಳು ಬಂದಿಲ್ಲ. ಇತ್ತೀಚಿನ ಮಾಹಿತಿಯನ್ನು ವಿಶ್ವಾಸಾರ್ಹ ಮೂಲದಿಂದ ಪರಿಶೀಲಿಸಿ.", intro: "ಮುಕ್ತ ಪ್ರಶ್ನೆ ಕೇಳಿ, ಪರಿಶೀಲಿಸಿದ ದಾಖಲೆಯ ಪಠ್ಯ ಸೇರಿಸಿ ಅಥವಾ ಚಾಟ್ ಮುಂದುವರಿಸಿ. ವಿಷಯಗಳನ್ನು ಪ್ರತ್ಯೇಕಿಸಲು ಹೊಸ ಚಾಟ್ ಪ್ರಾರಂಭಿಸಿ.",
    noDiagnosis: "ಆರೋಗ್ಯ ಉತ್ತರಗಳು ಮಾಹಿತಿ ಮಾತ್ರ · ರೋಗನಿರ್ಣಯ ಅಥವಾ ವೈಯಕ್ತಿಕ ಔಷಧಿ ಸೂಚನೆ ಇಲ್ಲ", urgent: "ಯಾರಿಗಾದರೂ ತಕ್ಷಣದ ಅಪಾಯವಿದ್ದರೆ ಸ್ಥಳೀಯ ತುರ್ತು ಸೇವೆಯನ್ನು ಸಂಪರ್ಕಿಸಿ. AI ಉತ್ತರಕ್ಕಾಗಿ ಕಾಯಬೇಡಿ.",
    failure: "ಸಹಾಯಕ ಉತ್ತರಿಸಲಿಲ್ಲ. ಸಂಪರ್ಕ ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.", credentials: "AI ಸರ್ವರ್ ಸಂಪರ್ಕದಲ್ಲಿದೆ, ಆದರೆ AI ಸೇವೆಯ ಖಾಸಗಿ ಕೀ ಹೊಂದಿಸಿಲ್ಲ. ಸೈಟ್ ನಿರ್ವಾಹಕರನ್ನು ಸಂಪರ್ಕಿಸಿ.", rateLimited: "ಸಹಾಯಕ ಈಗ ಬ್ಯುಸಿಯಾಗಿದೆ. ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.", retry: "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ", clear: "ಚಾಟ್ ಅಳಿಸಿ", clearLabel: "ಈ ಚಾಟ್ ಅಳಿಸಿ", sending: "ಉತ್ತರ ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ…", storageError: "ಈ ಬ್ರೌಸರ್ ಚಾಟ್ ಇತಿಹಾಸ ಉಳಿಸಲಿಲ್ಲ.",
    consentNeeded: "AI ಸೇವೆಗೆ ಪ್ರಶ್ನೆ ಕಳುಹಿಸುವ ಮೊದಲು ಪರಿಶೀಲಿಸಿ ಒಪ್ಪಿಗೆ ನೀಡಿ.", docReadError: "ಉಳಿಸಿದ ದಾಖಲೆಯನ್ನು ಓದಲು ಆಗಲಿಲ್ಲ. Scan & Upload ತೆರೆಯಿರಿ ಮತ್ತು ಹೊರತೆಗೆದ ಪಠ್ಯ ಪರಿಶೀಲಿಸಿ.", askHint: "AI ಉತ್ತರ ತಪ್ಪಿರಬಹುದು. ವೈಯಕ್ತಿಕ ಆರೋಗ್ಯ ನಿರ್ಧಾರಗಳಿಗೆ ಪ್ರಸ್ತುತ ಆರೈಕೆ ಯೋಜನೆ ಅನುಸರಿಸಿ ಮತ್ತು ಅರ್ಹ ವೃತ್ತಿಪರರನ್ನು ಕೇಳಿ.",
    newChat: "ಹೊಸ ಚಾಟ್", history: "ಇತ್ತೀಚಿನ ಚಾಟ್‌ಗಳು", searchHistory: "ಚಾಟ್ ಹುಡುಕಿ", emptyHistory: "ನಿಮ್ಮ ಚಾಟ್‌ಗಳು ಇಲ್ಲಿ ಕಾಣುತ್ತವೆ.", rename: "ಹೆಸರು ಬದಲಿಸಿ", delete: "ಅಳಿಸಿ", copyAnswer: "ಉತ್ತರ ನಕಲಿಸಿ", regenerate: "ಮತ್ತೆ ಉತ್ತರಿಸಿ", saved: "ಈ ಸಾಧನದಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ", temporary: "ಈ ಟ್ಯಾಬ್ ಮಾತ್ರ",
  };

  const filteredConversations = useMemo(() => conversations.filter((conversation) => `${conversation.title} ${conversation.messages.find((item) => item.role === "user")?.text ?? ""}`.toLowerCase().includes(historySearch.trim().toLowerCase())).sort((a, b) => b.updatedAt - a.updatedAt), [conversations, historySearch]);

  const patchConversation = (id: string, update: (current: Conversation) => Conversation) => {
    setWorkspace((current) => ({ ...current, conversations: current.conversations.map((conversation) => conversation.id === id ? update(conversation) : conversation) }));
  };

  const updateMessages = (id: string, update: (current: Message[]) => Message[]) => {
    patchConversation(id, (conversation) => ({ ...conversation, updatedAt: Date.now(), messages: update(conversation.messages) }));
  };

  const createNewChat = () => {
    const conversation = createConversation();
    setWorkspace((current) => ({ conversations: [conversation, ...current.conversations].slice(0, 40), activeId: conversation.id }));
    setInput(""); setStatus(""); setRetry(null); setHistorySearch(""); setPendingCorrection(null);
  };

  const clearConversation = () => {
    if (!activeConversation) return;
    updateMessages(activeConversation.id, () => []);
    setInput(""); setStatus(""); setRetry(null); setPendingCorrection(null);
  };

  const deleteConversation = (conversation: Conversation) => {
    if (!window.confirm(language === "en" ? `Delete “${conversation.title}” from this browser?` : `“${conversation.title}” ಚಾಟ್ ಅನ್ನು ಈ ಬ್ರೌಸರ್‌ನಿಂದ ಅಳಿಸಬೇಕೇ?`)) return;
    setWorkspace((current) => {
      const remaining = current.conversations.filter((item) => item.id !== conversation.id);
      const next = remaining.length ? remaining : [createConversation()];
      return { conversations: next, activeId: current.activeId === conversation.id ? next[0].id : current.activeId };
    });
    setRetry(null); setStatus("");
  };

  const renameConversation = (conversation: Conversation) => {
    const title = window.prompt(language === "en" ? "Conversation name" : "ಚಾಟ್ ಹೆಸರು", conversation.title);
    if (title?.trim()) patchConversation(conversation.id, (current) => ({ ...current, title: short(title.trim(), 70), updatedAt: Date.now() }));
  };

  const copyAnswer = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setStatus(language === "en" ? "Answer copied." : "ಉತ್ತರ ನಕಲಿಸಲಾಗಿದೆ."); }
    catch { setStatus(language === "en" ? "Copy is not available in this browser." : "ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ನಕಲು ಲಭ್ಯವಿಲ್ಲ."); }
  };

  const requestAnswer = async ({ conversationId, question, excerpt, prior, responseId }: RetryRequest) => {
    if (!ASSISTANT_ENDPOINT) return;
    setRetry({ conversationId, question, excerpt, prior, responseId }); setBusy(true); setStatus("");
    try {
      const response = await fetch(ASSISTANT_ENDPOINT, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, messages: prior.slice(-5).map(({ role, text }) => ({ role, text: short(text, 1000) })), language, documentExcerpt: excerpt }),
        signal: AbortSignal.timeout(35000),
      });
      const payload: unknown = await response.json().catch(() => null);
      const data = payload && typeof payload === "object" ? payload as { answer?: unknown; sources?: unknown; error?: unknown } : {};
      if (!response.ok || typeof data.answer !== "string") throw new Error(typeof data.error === "string" ? data.error : "request_failed");
      const sources = Array.isArray(data.sources) ? data.sources.filter((source): source is Source => Boolean(source && typeof source === "object" && typeof (source as Source).title === "string" && typeof (source as Source).url === "string" && /^https:\/\//i.test((source as Source).url))).slice(0, 5) : [];
      updateMessages(conversationId, (current) => current.map((message) => message.id === responseId ? { ...message, text: data.answer as string, sources, pending: false, error: false } : message));
      setRetry(null);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "";
      const failure = reason === "assistant_not_configured" ? copy.credentials : reason === "provider_rate_limited" ? copy.rateLimited : copy.failure;
      updateMessages(conversationId, (current) => current.map((message) => message.id === responseId ? { ...message, text: failure, pending: false, error: true } : message));
    } finally { setBusy(false); }
  };

  const sendQuestion = async (question: string, excerpt = "", allowCorrection = true) => {
    if (busy || !activeConversation) return;
    if (!ASSISTANT_ENDPOINT) {
      const offlineResolution = onResolveOfflineQuestion?.(question);
      if (allowCorrection && offlineResolution?.correction) {
        setPendingCorrection({ question, excerpt, ...offlineResolution.correction });
        setInput(question);
        setStatus("");
        return;
      }
      const userMessage: Message = { id: newId(), role: "user", text: question };
      const localReply = localConversationReply(question, language);
      const answer = localReply ? { text: localReply } : offlineResolution?.answer;
      const statusMessage: Message = { id: newId(), role: "assistant", text: answer?.text ?? copy.offlineResponse, sources: answer?.sources, error: !answer };
      const conversationId = activeConversation.id;
      updateMessages(conversationId, (current) => [...current, userMessage, statusMessage]);
      patchConversation(conversationId, (current) => ({ ...current, title: messages.some((message) => message.role === "user") ? current.title : short(question, 42) }));
      setInput(""); setRetry(null); setStatus(""); setPendingCorrection(null);
      return;
    }
    if (!consent) { setStatus(copy.consentNeeded); return; }
    const prior = messages.filter((message) => !message.error && !message.pending);
    const userMessage: Message = { id: newId(), role: "user", text: question };
    const responseMessage: Message = { id: newId(), role: "assistant", text: "", pending: true };
    const conversationId = activeConversation.id;
    updateMessages(conversationId, (current) => [...current, userMessage, responseMessage]);
    patchConversation(conversationId, (current) => ({ ...current, title: messages.some((message) => message.role === "user") ? current.title : short(question, 42) }));
    setInput(""); setRetry(null);
    await requestAnswer({ conversationId, question, excerpt, prior, responseId: responseMessage.id });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const question = input.trim();
    if (!question || busy) return;
    let excerpt = "";
    if (ASSISTANT_ENDPOINT && includeDocument && selectedDocument) {
      try {
        const stored = await getDocumentFile(selectedDocument);
        if (!stored?.extractedText?.trim()) { setStatus(copy.docReadError); return; }
        excerpt = short(stored.extractedText.trim(), 6000);
      } catch { setStatus(copy.docReadError); return; }
    }
    await sendQuestion(question, excerpt);
  };

  const acceptCorrection = (useSuggestedWording: boolean) => {
    if (!pendingCorrection) return;
    const { question, corrected, excerpt } = pendingCorrection;
    const nextQuestion = useSuggestedWording ? corrected : question;
    setPendingCorrection(null);
    setInput("");
    void sendQuestion(nextQuestion, excerpt, false);
  };

  const retryQuestion = (item: RetryRequest) => {
    updateMessages(item.conversationId, (current) => current.map((message) => message.id === item.responseId ? { ...message, text: "", pending: true, error: false } : message));
    void requestAnswer(item);
  };

  const regenerateLast = () => {
    if (!activeConversation || busy) return;
    let questionIndex = -1;
    for (let index = messages.length - 1; index >= 0; index -= 1) if (messages[index].role === "user") { questionIndex = index; break; }
    const question = messages[questionIndex];
    const answer = messages.slice(questionIndex + 1).find((message) => message.role === "assistant");
    if (!question || !answer) return;
    const prior = messages.slice(0, questionIndex).filter((message) => !message.error && !message.pending);
    const request = { conversationId: activeConversation.id, question: question.text, excerpt: retry?.conversationId === activeConversation.id ? retry.excerpt : "", prior, responseId: answer.id };
    updateMessages(activeConversation.id, (current) => current.map((message) => message.id === answer.id ? { ...message, text: "", sources: [], pending: true, error: false } : message));
    void requestAnswer(request);
  };

  const toggleVoice = () => {
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    try { if (localStorage.getItem("carepath_voice_support") === "false") { setStatus("Turn on Voice Assistance in Settings first."); return; } } catch { /* Continue when storage is unavailable. */ }
    const Speech = (window as SpeechWindow).SpeechRecognition || (window as SpeechWindow).webkitSpeechRecognition;
    if (!Speech) { setStatus("Voice input is not available in this browser. You can type instead."); return; }
    const recognition = new Speech();
    recognition.lang = language === "kn" ? "kn-IN" : "en-IN";
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const spoken = event.results[0]?.[0]?.transcript;
      if (spoken) setInput((current) => `${current}${current ? " " : ""}${spoken}`.slice(0, 1200));
    };
    recognition.onerror = () => { setStatus("Voice input stopped. You can type instead."); setListening(false); };
    recognition.onend = () => { setListening(false); recognitionRef.current = null; };
    recognitionRef.current = recognition;
    setStatus(copy.listenHint); setListening(true); recognition.start();
  };

  return <section className="cp-connected-chat" aria-label={copy.title}>
    <aside className="cp-chat-history" aria-label={copy.history}>
      <button type="button" className="cp-chat-new" onClick={createNewChat}><Plus size={16} />{copy.newChat}</button>
      <label className="cp-chat-history-search"><Search size={15} /><input value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} placeholder={copy.searchHistory} aria-label={copy.searchHistory} /></label>
      <div className="cp-chat-history-heading"><span>{copy.history}</span><small>{saveHistory ? copy.saved : copy.temporary}</small></div>
      <div className="cp-chat-history-list">
        {filteredConversations.map((conversation) => <div key={conversation.id} className={`cp-chat-history-item ${conversation.id === activeConversation?.id ? "active" : ""}`}>
          <button type="button" className="cp-chat-history-open" onClick={() => { setWorkspace((current) => ({ ...current, activeId: conversation.id })); setStatus(""); setRetry(null); setPendingCorrection(null); }}><span>{conversation.title}</span><small>{conversation.messages.find((message) => message.role === "user")?.text || (language === "en" ? "New conversation" : "ಹೊಸ ಚಾಟ್")}</small></button>
          <button type="button" className="cp-chat-history-action" aria-label={`${copy.rename}: ${conversation.title}`} title={copy.rename} onClick={() => renameConversation(conversation)}><Pencil size={13} /></button>
          <button type="button" className="cp-chat-history-action delete" aria-label={`${copy.delete}: ${conversation.title}`} title={copy.delete} onClick={() => deleteConversation(conversation)}><Trash2 size={13} /></button>
        </div>)}
        {!filteredConversations.length && <p className="cp-chat-history-empty">{copy.emptyHistory}</p>}
      </div>
    </aside>

    <div className="cp-assistant-card cp-chat-workspace">
      <header className="cp-assistant-heading">
        <span className="cp-assistant-icon"><Bot size={22} /></span>
        <div className="cp-assistant-title"><span className="cp-eyebrow">{language === "en" ? "YOUR PRIVATE CHAT WORKSPACE" : "ನಿಮ್ಮ ಚಾಟ್ ಕಾರ್ಯಸ್ಥಳ"}</span><h2>{activeConversation?.title || copy.title}</h2><p>{copy.subtitle}</p></div>
        <span className={`cp-assistant-connection ${ASSISTANT_ENDPOINT ? "connected" : "offline"}`}><i />{ASSISTANT_ENDPOINT ? copy.ready : copy.offline}</span>
      </header>

      {!ASSISTANT_ENDPOINT && <div className="cp-assistant-not-configured" role="status"><AlertTriangle size={18} /><p>{copy.notConfigured}</p></div>}
      <div className="cp-assistant-chat" ref={threadRef} aria-live="polite" aria-label={language === "en" ? "Chat messages" : "ಚಾಟ್ ಸಂದೇಶಗಳು"}>
        {!messages.length && <div className="cp-assistant-empty"><span><Bot size={24} /></span><p>{copy.intro}</p><strong>{language === "en" ? "Try a question" : "ಪ್ರಶ್ನೆ ಪ್ರಯತ್ನಿಸಿ"}</strong><div className="cp-assistant-quick-prompts">{QUICK_PROMPTS[language].map((prompt) => <button key={prompt} type="button" onClick={() => setInput(prompt)}>{prompt}<Send size={13} /></button>)}</div></div>}
        {messages.map((message, index) => <article key={message.id} className={`cp-assistant-message ${message.role}`}>
          <div className="cp-assistant-bubble">
            <strong>{message.role === "user" ? (language === "en" ? "You" : "ನೀವು") : message.error ? (language === "en" ? "CARE CONNECTED · connection status" : "CARE CONNECTED · ಸಂಪರ್ಕ ಸ್ಥಿತಿ") : !ASSISTANT_ENDPOINT && message.sources?.length ? (language === "en" ? "CARE CONNECTED · reviewed guide" : "CARE CONNECTED · ಪರಿಶೀಲಿತ ಮಾರ್ಗದರ್ಶಿ") : !ASSISTANT_ENDPOINT ? (language === "en" ? "CARE CONNECTED · offline reply" : "CARE CONNECTED · ಆಫ್‌ಲೈನ್ ಉತ್ತರ") : (language === "en" ? "CARE CONNECTED · AI answer" : "CARE CONNECTED · AI ಉತ್ತರ")}</strong>
            {message.pending ? <span className="cp-assistant-thinking"><LoaderCircle size={15} />{copy.sending}</span> : <p>{message.text}</p>}
            {message.error && retry?.responseId === message.id && <button type="button" className="cp-button quiet" onClick={() => retryQuestion(retry)} disabled={busy}><RotateCcw size={14} />{copy.retry}</button>}
            {message.role === "assistant" && message.error && !ASSISTANT_ENDPOINT && onTryOfflineGuide && <div className="cp-assistant-offline-actions"><button type="button" className="cp-button primary" onClick={() => { const question = messages.slice(0, index).reverse().find((item) => item.role === "user")?.text; if (question) onTryOfflineGuide(question); }}><ArrowDown size={15} />{copy.offlineGuide}</button><small>{copy.offlineGuideHint}</small></div>}
            {message.role === "assistant" && !message.pending && !message.error && <div className="cp-assistant-answer-tools"><ReadAloudButton text={message.text} label={language === "en" ? "Listen to this answer" : "ಈ ಉತ್ತರವನ್ನು ಕೇಳಿ"} language={language === "kn" ? "kn" : "en"} /><button type="button" className="cp-answer-tool" onClick={() => void copyAnswer(message.text)}><Copy size={14} />{copy.copyAnswer}</button>{index === messages.length - 1 && <button type="button" className="cp-answer-tool" onClick={regenerateLast} disabled={busy}><RotateCcw size={14} />{copy.regenerate}</button>}</div>}
            {message.role === "assistant" && !message.pending && !message.error && message.sources?.length ? <div className="cp-assistant-sources"><strong>{copy.sourceLabel}</strong>{message.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">{source.title}<ExternalLink size={13} /></a>)}</div> : null}
            {message.role === "assistant" && !message.pending && !message.error && ASSISTANT_ENDPOINT && !message.sources?.length ? <small className="cp-assistant-no-sources">{copy.noSources}</small> : null}
          </div>
        </article>)}
      </div>

      {pendingCorrection && <div className="cp-assistant-correction" role="group" aria-label={language === "en" ? "Check spelling suggestion" : "ಕಾಗುಣಿತ ಸೂಚನೆ ಪರಿಶೀಲಿಸಿ"}>
        <strong>{language === "en" ? `Did you mean: “${pendingCorrection.corrected}”?` : `ನೀವು “${pendingCorrection.corrected}” ಎಂದಿದ್ದೀರಾ?`}</strong>
        <p>{language === "en" ? `I may have read “${pendingCorrection.original}” as a typo. Please choose before I use this health or medicine guide.` : `“${pendingCorrection.original}” ತಪ್ಪಾಗಿ ಬರೆದಿರಬಹುದು. ಆರೋಗ್ಯ ಅಥವಾ ಔಷಧಿ ಮಾರ್ಗದರ್ಶಿ ತೋರಿಸುವ ಮೊದಲು ಆಯ್ಕೆಮಾಡಿ.`}</p>
        <div><button type="button" className="cp-button primary" onClick={() => acceptCorrection(true)}>{language === "en" ? "Use suggested wording" : "ಸೂಚಿಸಿದ ಪದ ಬಳಸಿ"}</button><button type="button" className="cp-button quiet" onClick={() => acceptCorrection(false)}>{language === "en" ? "Keep my wording" : "ನನ್ನ ಪದಗಳನ್ನೇ ಇಡಿ"}</button></div>
      </div>}

      <div className="cp-assistant-safety"><ShieldCheck size={16} /><span>{copy.noDiagnosis}<br /><small>{copy.urgent}</small></span></div>
      {documents.some((document) => document.fileStored) && <div className="cp-assistant-document">
        <label className="cp-assistant-check"><input type="checkbox" checked={includeDocument} onChange={(event) => setIncludeDocument(event.target.checked)} /><FileText size={17} /><span>{copy.docToggle}</span></label>
        {includeDocument && <label className="cp-assistant-doc-select">{copy.selectDoc}<select value={selectedDocument} onChange={(event) => setSelectedDocument(event.target.value)}><option value="">—</option>{documents.filter((document) => document.fileStored).map((document) => <option key={document.id} value={document.id}>{document.name}</option>)}</select></label>}
      </div>}
      {!documents.some((document) => document.fileStored) && <p className="cp-assistant-document-hint">{copy.noDocs}</p>}
      <form className="cp-assistant-composer" onSubmit={(event) => void submit(event)}>
        <textarea value={input} onChange={(event) => { setInput(event.target.value); setPendingCorrection(null); }} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder={copy.placeholder} rows={2} maxLength={1200} aria-label={copy.placeholder} disabled={busy} />
        <button type="button" className={`cp-assistant-mic ${listening ? "listening" : ""}`} onClick={toggleVoice} aria-label={listening ? copy.stopMic : copy.listen} disabled={busy}>{listening ? <X size={17} /> : <Mic size={17} />}</button>
        <button type="submit" aria-label={copy.send} disabled={(Boolean(ASSISTANT_ENDPOINT) && !consent) || !input.trim() || busy}>{busy ? <LoaderCircle className="cp-spin" size={17} /> : <Send size={17} />}</button>
      </form>
      <p className="cp-assistant-voice-note"><Volume2 size={14} />{copy.listenHint}</p>
      {ASSISTANT_ENDPOINT && <label className="cp-ai-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span><strong>{copy.consentTitle}</strong>{copy.consent}</span></label>}
      <div className="cp-assistant-footer">
        <label className="cp-assistant-save"><input type="checkbox" checked={saveHistory} onChange={(event) => { const enabled = event.target.checked; setSaveHistory(enabled); try { localStorage.setItem("carepath_ai_chat_save", String(enabled)); if (!enabled) { localStorage.removeItem(SAVED_KEY); localStorage.removeItem(LEGACY_KEY); } } catch { setStatus(copy.storageError); } }} /><span><strong>{copy.save}</strong><small>{copy.saveHint}</small></span></label>
        <div className="cp-assistant-actions"><div className="cp-language-switch" role="group" aria-label="Assistant response language"><button type="button" className={language === "en" ? "selected" : ""} aria-pressed={language === "en"} onClick={() => onLanguageChange("en")}>English</button><button type="button" className={language === "kn" ? "selected" : ""} aria-pressed={language === "kn"} onClick={() => onLanguageChange("kn")}>ಕನ್ನಡ</button></div><button type="button" className="cp-button quiet" onClick={clearConversation} aria-label={copy.clearLabel}><Trash2 size={14} />{copy.clear}</button></div>
      </div>
      {status && <p className="cp-ai-status" role="status"><Check size={15} />{status}</p>}
      <p className="cp-assistant-bottom-hint"><Volume2 size={13} />{copy.askHint}</p>
    </div>
  </section>;
}
