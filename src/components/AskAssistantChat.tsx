import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { AlertTriangle, Bot, Check, ExternalLink, FileText, LoaderCircle, Mic, Send, ShieldCheck, Trash2, Volume2, X } from "lucide-react";
import ReadAloudButton from "./ReadAloudButton";
import "./AskAssistantChat.css";
import { getDocumentFile } from "../documentFiles";

type AskLanguage = "en" | "kn";
type ChatDocument = { id: string; name: string; fileStored?: boolean };
type Source = { title: string; url: string };
type Message = { id: string; role: "user" | "assistant"; text: string; sources?: Source[]; error?: boolean; pending?: boolean };
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

const CHAT_STORAGE_KEY = "carepath_ai_chat_v1";
const ASSISTANT_ENDPOINT = import.meta.env.VITE_CAREPATH_AI_ENDPOINT?.trim() ?? "";
const short = (text: string, limit: number) => text.length > limit ? `${text.slice(0, limit)}…` : text;
const newId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function restoreChat(): Message[] {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is Message => item && typeof item === "object" && (item.role === "user" || item.role === "assistant") && typeof item.text === "string")
      .slice(-20).map((item) => ({ id: typeof item.id === "string" ? item.id : newId(), role: item.role, text: short(item.text, 5000), sources: Array.isArray(item.sources) ? item.sources.filter((source) => source && typeof source.title === "string" && typeof source.url === "string" && /^https:\/\//i.test(source.url)).slice(0, 5) : [] }));
  } catch { return []; }
}

export default function AskAssistantChat({ language, onLanguageChange, documents, initialQuestion = "" }: { language: AskLanguage; onLanguageChange: (value: AskLanguage) => void; documents: ChatDocument[]; initialQuestion?: string }) {
  const [saveHistory, setSaveHistory] = useState(() => {
    try { return localStorage.getItem("carepath_ai_chat_save") === "true"; } catch { return false; }
  });
  const [messages, setMessages] = useState<Message[]>(() => {
    try { return localStorage.getItem("carepath_ai_chat_save") === "true" ? restoreChat() : []; } catch { return []; }
  });
  const [input, setInput] = useState(() => ASSISTANT_ENDPOINT ? initialQuestion : "");
  const [consent, setConsent] = useState(false);
  const [includeDocument, setIncludeDocument] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState("");
  const [retry, setRetry] = useState<{ question: string; excerpt: string } | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    if (!saveHistory) return;
    try { localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.filter((message) => !message.pending).slice(-20).map(({ id, role, text, sources }) => ({ id, role, text, sources })))); } catch { /* Keep the conversation in memory for this visit. */ }
  }, [messages, saveHistory]);

  useEffect(() => {
    const thread = threadRef.current;
    if (thread) thread.scrollTop = thread.scrollHeight;
  }, [messages]);

  useEffect(() => () => { recognitionRef.current?.stop(); }, []);

  useEffect(() => {
    if (ASSISTANT_ENDPOINT && initialQuestion) setInput(initialQuestion);
  }, [initialQuestion]);

  const copy = language === "en" ? {
    title: "Ask the CAREPATH assistant", subtitle: "A connected, in-app information chat. Answers can be wrong; check the cited sources.",
    ready: "AI endpoint configured", offline: "AI assistant is not connected on this deployment", notConfigured: "Live AI is not enabled here yet. The curated English/Kannada CAREPATH guides below still work. Connecting AI needs a server deployment and a private provider key; GitHub Pages alone cannot keep that key secret.",
    consentTitle: "Review before sending", consent: "When I send, my question and recent chat messages go to CAREPATH’s configured server and its AI provider. CAREPATH does not attach saved health records. If I select a document, its extracted text will also be sent for this request.",
    docToggle: "Ask about a saved document", selectDoc: "Choose a saved document", noDocs: "No saved documents with reviewed text are available.",
    save: "Save this chat on this device", saveHint: "Off by default. Saved chat stays in this browser; clear it any time.",
    placeholder: "Ask in English or Kannada…", send: "Send question", listen: "Speak your question", stopMic: "Stop voice input", listenHint: "Check the recognized words before sending. Browser speech recognition may use its own online service.",
    sourceLabel: "Web sources to review", noSources: "No web citations came back with this answer. Please verify it with a trusted health professional or official source.",
    intro: "Ask a general health or medicine-information question. You can also choose a saved document and explicitly share its extracted text for one question.",
    noDiagnosis: "General education only · no diagnosis, prescribing, or personal dose advice", urgent: "If this may be an emergency, contact your local emergency service now. Do not wait for an AI reply.",
    failure: "The assistant could not answer. Check your connection and try again.", retry: "Try again", clear: "Clear chat", clearLabel: "Clear this chat and any saved copy", sending: "Checking current information…", storageError: "This browser could not save the chat. It is still available until you leave this page.",
    consentNeeded: "Please review and agree before sending a question to the AI service.", docReadError: "I could not read that saved document. Open Scan & Understand and review the saved text first.", askHint: "For a medicine you take, follow your package or prescription and ask a pharmacist about personal safety. This assistant cannot identify a tablet or check interactions.",
  } : {
    title: "CAREPATH ಸಹಾಯಕನನ್ನು ಕೇಳಿ", subtitle: "ಆಪ್‌ನಲ್ಲೇ ಮಾಹಿತಿ ಚಾಟ್. ಉತ್ತರ ತಪ್ಪಿರಬಹುದು; ಮೂಲಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.",
    ready: "AI ಎಂಡ್‌ಪಾಯಿಂಟ್ ಹೊಂದಿಸಲಾಗಿದೆ", offline: "ಈ ಪ್ರಕಟಿತ ಆವೃತ್ತಿಯಲ್ಲಿ AI ಸಂಪರ್ಕವಿಲ್ಲ", notConfigured: "ಇಲ್ಲಿ ಲೈವ್ AI ಇನ್ನೂ ಸಕ್ರಿಯವಾಗಿಲ್ಲ. ಕೆಳಗಿನ CAREPATH ಕನ್ನಡ/English ಮಾರ್ಗದರ್ಶಿಗಳು ಕೆಲಸ ಮಾಡುತ್ತವೆ. AI ಗೆ ಸರ್ವರ್ ಮತ್ತು ಖಾಸಗಿ provider ಕೀ ಬೇಕು; GitHub Pages ಮಾತ್ರ ಆ ಕೀಲಿಯನ್ನು ರಹಸ್ಯವಾಗಿಡಲು ಸಾಧ್ಯವಿಲ್ಲ.",
    consentTitle: "ಕಳುಹಿಸುವ ಮೊದಲು ಓದಿ", consent: "ನಾನು ಕಳುಹಿಸಿದಾಗ ನನ್ನ ಪ್ರಶ್ನೆ ಮತ್ತು ಇತ್ತೀಚಿನ ಚಾಟ್ CAREPATH ಸರ್ವರ್ ಮತ್ತು ಅದರ AI ಸೇವೆಗೆ ಹೋಗುತ್ತದೆ. ಉಳಿಸಿದ ಆರೋಗ್ಯ ದಾಖಲೆಗಳನ್ನು CAREPATH ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಸೇರಿಸುವುದಿಲ್ಲ. ದಾಖಲೆಯನ್ನು ಆರಿಸಿದರೆ, ಅದರ ಹೊರತೆಗೆದ ಪಠ್ಯ ಈ ಪ್ರಶ್ನೆಗೆ ಮಾತ್ರ ಕಳುಹಿಸಲಾಗುತ್ತದೆ.",
    docToggle: "ಉಳಿಸಿದ ದಾಖಲೆಯ ಬಗ್ಗೆ ಕೇಳಿ", selectDoc: "ಉಳಿಸಿದ ದಾಖಲೆ ಆರಿಸಿ", noDocs: "ಪರಿಶೀಲಿಸಿದ ಪಠ್ಯವಿರುವ ಉಳಿಸಿದ ದಾಖಲೆ ಇಲ್ಲ.",
    save: "ಈ ಸಾಧನದಲ್ಲಿ ಚಾಟ್ ಉಳಿಸಿ", saveHint: "ಮೊದಲಿನಿಂದ ಆಫ್. ಚಾಟ್ ಈ ಬ್ರೌಸರ್‌ನಲ್ಲೇ ಉಳಿಯುತ್ತದೆ; ಯಾವಾಗ ಬೇಕಾದರೂ ಅಳಿಸಿ.",
    placeholder: "ಕನ್ನಡ ಅಥವಾ English ನಲ್ಲಿ ಕೇಳಿ…", send: "ಪ್ರಶ್ನೆ ಕಳುಹಿಸಿ", listen: "ಪ್ರಶ್ನೆ ಮಾತನಾಡಿ", stopMic: "ಧ್ವನಿ ಇನ್‌ಪುಟ್ ನಿಲ್ಲಿಸಿ", listenHint: "ಕಳುಹಿಸುವ ಮೊದಲು ಗುರುತಿಸಿದ ಪದಗಳನ್ನು ಪರಿಶೀಲಿಸಿ. ಬ್ರೌಸರ್ ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆ ತನ್ನ ಆನ್‌ಲೈನ್ ಸೇವೆಯನ್ನು ಬಳಸಬಹುದು.",
    sourceLabel: "ಪರಿಶೀಲಿಸಲು ವೆಬ್ ಮೂಲಗಳು", noSources: "ಈ ಉತ್ತರದ ಜೊತೆ ವೆಬ್ ಉಲ್ಲೇಖ ಬಂದಿಲ್ಲ. ಆರೋಗ್ಯ ವೃತ್ತಿಪರ ಅಥವಾ ಅಧಿಕೃತ ಮೂಲದೊಂದಿಗೆ ಪರಿಶೀಲಿಸಿ.",
    intro: "ಸಾಮಾನ್ಯ ಆರೋಗ್ಯ ಅಥವಾ ಔಷಧಿ ಮಾಹಿತಿ ಕೇಳಿ. ಉಳಿಸಿದ ದಾಖಲೆಯನ್ನು ಆಯ್ದು ಅದರ ಹೊರತೆಗೆದ ಪಠ್ಯವನ್ನು ಒಂದು ಪ್ರಶ್ನೆಗೆ ಹಂಚಬಹುದು.",
    noDiagnosis: "ಸಾಮಾನ್ಯ ಮಾಹಿತಿ ಮಾತ್ರ · ರೋಗನಿರ್ಣಯ, ಔಷಧಿ ಸೂಚನೆ ಅಥವಾ ವೈಯಕ್ತಿಕ ಡೋಸ್ ಸಲಹೆ ಇಲ್ಲ", urgent: "ಇದು ತುರ್ತು ಪರಿಸ್ಥಿತಿ ಆಗಿರಬಹುದು ಎಂದರೆ ಈಗಲೇ ಸ್ಥಳೀಯ ತುರ್ತು ಸೇವೆಯನ್ನು ಸಂಪರ್ಕಿಸಿ. AI ಉತ್ತರಕ್ಕಾಗಿ ಕಾಯಬೇಡಿ.",
    failure: "ಸಹಾಯಕ ಉತ್ತರಿಸಲಿಲ್ಲ. ಸಂಪರ್ಕ ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.", retry: "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ", clear: "ಚಾಟ್ ಅಳಿಸಿ", clearLabel: "ಚಾಟ್ ಮತ್ತು ಉಳಿಸಿದ ಪ್ರತಿಯನ್ನು ಅಳಿಸಿ", sending: "ಪ್ರಸ್ತುತ ಮಾಹಿತಿ ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ…", storageError: "ಈ ಬ್ರೌಸರ್ ಚಾಟ್ ಉಳಿಸಲಿಲ್ಲ. ಈ ಪುಟ ತೆರೆಯಿರುವವರೆಗೆ ಅದು ಲಭ್ಯ.",
    consentNeeded: "AI ಸೇವೆಗೆ ಪ್ರಶ್ನೆ ಕಳುಹಿಸುವ ಮೊದಲು ಓದಿ ಒಪ್ಪಿಕೊಳ್ಳಿ.", docReadError: "ಉಳಿಸಿದ ದಾಖಲೆಯನ್ನು ಓದಲು ಆಗಲಿಲ್ಲ. Scan & Understand ತೆರೆಯಿರಿ, ಪಠ್ಯ ಪರಿಶೀಲಿಸಿ.", askHint: "ನೀವು ತೆಗೆದುಕೊಳ್ಳುವ ಔಷಧಿಗೆ ಪ್ಯಾಕೆಟ್ ಅಥವಾ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಅನುಸರಿಸಿ; ವೈಯಕ್ತಿಕ ಸುರಕ್ಷತೆಗಾಗಿ ಫಾರ್ಮಸಿಸ್ಟ್ ಕೇಳಿ. ಈ ಸಹಾಯಕ ಮಾತ್ರೆ ಗುರುತಿಸುವುದಿಲ್ಲ ಅಥವಾ interactions ಪರಿಶೀಲಿಸುವುದಿಲ್ಲ.",
  };

  const clearChat = () => {
    setMessages([]); setInput(""); setStatus(""); setRetry(null);
    try { localStorage.removeItem(CHAT_STORAGE_KEY); } catch { /* The in-memory chat is still cleared. */ }
  };

  const sendQuestion = async (question: string, excerpt = "") => {
    if (!consent) { setStatus(copy.consentNeeded); return; }
    if (!ASSISTANT_ENDPOINT || busy) return;
    const prior = messages.filter((message) => !message.error && !message.pending).slice(-5).map(({ role, text }) => ({ role, text: short(text, 1000) }));
    const userMessage: Message = { id: newId(), role: "user", text: question };
    const responseMessage: Message = { id: newId(), role: "assistant", text: "", pending: true };
    setMessages((current) => [...current, userMessage, responseMessage]);
    setInput(""); setStatus(""); setRetry({ question, excerpt }); setBusy(true);
    try {
      const response = await fetch(ASSISTANT_ENDPOINT, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, messages: prior, language, documentExcerpt: excerpt }),
        signal: AbortSignal.timeout(35000),
      });
      const payload: unknown = await response.json().catch(() => null);
      const data = payload && typeof payload === "object" ? payload as { answer?: unknown; sources?: unknown; error?: unknown } : {};
      if (!response.ok || typeof data.answer !== "string") throw new Error(typeof data.error === "string" ? data.error : "request_failed");
      const sources = Array.isArray(data.sources) ? data.sources.filter((source): source is Source => source && typeof source === "object" && typeof (source as Source).title === "string" && typeof (source as Source).url === "string" && /^https:\/\//i.test((source as Source).url)).slice(0, 5) : [];
      setMessages((current) => current.map((message) => message.id === responseMessage.id ? { ...message, text: data.answer as string, sources, pending: false } : message));
      setRetry(null);
    } catch {
      setMessages((current) => current.map((message) => message.id === responseMessage.id ? { ...message, text: copy.failure, pending: false, error: true } : message));
    } finally { setBusy(false); }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const question = input.trim();
    if (!question || busy) return;
    let excerpt = "";
    if (includeDocument && selectedDocument) {
      try {
        const stored = await getDocumentFile(selectedDocument);
        if (!stored?.extractedText?.trim()) { setStatus(copy.docReadError); return; }
        excerpt = short(stored.extractedText.trim(), 6000);
      } catch { setStatus(copy.docReadError); return; }
    }
    await sendQuestion(question, excerpt);
  };

  const toggleVoice = () => {
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    try { if (localStorage.getItem("carepath_voice_support") === "false") { setStatus("Turn on Voice Assistance in CAREPATH settings first."); return; } } catch { /* Continue when storage is unavailable. */ }
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

  return <section className="cp-assistant-card" aria-labelledby="cp-assistant-title">
    <header className="cp-assistant-heading">
      <span className="cp-assistant-icon"><Bot size={22} /></span>
      <div><span className="cp-eyebrow">{language === "en" ? "IN-APP AI · OPTIONAL SERVER CONNECTION" : "ಆಪ್‌ನ AI · ಸರ್ವರ್ ಸಂಪರ್ಕ ಐಚ್ಛಿಕ"}</span><h2 id="cp-assistant-title">{copy.title}</h2><p>{copy.subtitle}</p></div>
      <span className={`cp-assistant-connection ${ASSISTANT_ENDPOINT ? "connected" : "offline"}`}><i />{ASSISTANT_ENDPOINT ? copy.ready : copy.offline}</span>
    </header>
    {!ASSISTANT_ENDPOINT && <div className="cp-assistant-not-configured" role="status"><AlertTriangle size={18} /><p>{copy.notConfigured}</p></div>}
    <div className="cp-assistant-chat" ref={threadRef} aria-live="polite" aria-label={language === "en" ? "Chat messages" : "ಚಾಟ್ ಸಂದೇಶಗಳು"}>
      {!messages.length && <div className="cp-assistant-empty"><span><Bot size={24} /></span><p>{copy.intro}</p></div>}
      {messages.map((message) => <article key={message.id} className={`cp-assistant-message ${message.role}`}>
        <div className="cp-assistant-bubble">
          <strong>{message.role === "user" ? (language === "en" ? "You" : "ನೀವು") : (language === "en" ? "CAREPATH assistant · AI generated" : "CAREPATH ಸಹಾಯಕ · AI ರಚಿಸಿದ ಉತ್ತರ")}</strong>
          {message.pending ? <span className="cp-assistant-thinking"><LoaderCircle size={15} />{copy.sending}</span> : <p>{message.text}</p>}
          {message.error && retry && messages.at(-1)?.id === message.id && <button type="button" className="cp-button quiet" onClick={() => void sendQuestion(retry.question, retry.excerpt)} disabled={busy}>{copy.retry}</button>}
          {message.role === "assistant" && !message.pending && !message.error && <ReadAloudButton text={message.text} label={language === "en" ? "Listen to this answer" : "ಈ ಉತ್ತರವನ್ನು ಕೇಳಿ"} language={language === "kn" ? "kn" : "en"} />}
          {message.role === "assistant" && !message.pending && !message.error && message.sources?.length ? <div className="cp-assistant-sources"><strong>{copy.sourceLabel}</strong>{message.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">{source.title}<ExternalLink size={13} /></a>)}</div> : null}
          {message.role === "assistant" && !message.pending && !message.error && !message.sources?.length ? <small className="cp-assistant-no-sources">{copy.noSources}</small> : null}
        </div>
      </article>)}
    </div>
    <div className="cp-assistant-safety"><ShieldCheck size={16} /><span>{copy.noDiagnosis}<br /><small>{copy.urgent}</small></span></div>
    {documents.some((document) => document.fileStored) && <div className="cp-assistant-document">
      <label className="cp-assistant-check"><input type="checkbox" checked={includeDocument} onChange={(event) => setIncludeDocument(event.target.checked)} /><FileText size={17} /><span>{copy.docToggle}</span></label>
      {includeDocument && <label className="cp-assistant-doc-select">{copy.selectDoc}<select value={selectedDocument} onChange={(event) => setSelectedDocument(event.target.value)}><option value="">—</option>{documents.filter((document) => document.fileStored).map((document) => <option key={document.id} value={document.id}>{document.name}</option>)}</select></label>}
    </div>}
    {!documents.some((document) => document.fileStored) && <p className="cp-assistant-document-hint">{copy.noDocs}</p>}
    <form className="cp-assistant-composer" onSubmit={(event) => void submit(event)}>
      <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder={copy.placeholder} rows={2} maxLength={1200} aria-label={copy.placeholder} disabled={!ASSISTANT_ENDPOINT || busy} />
      <button type="button" className={`cp-assistant-mic ${listening ? "listening" : ""}`} onClick={toggleVoice} aria-label={listening ? copy.stopMic : copy.listen} disabled={!ASSISTANT_ENDPOINT || busy}>{listening ? <X size={17} /> : <Mic size={17} />}</button>
      <button type="submit" aria-label={copy.send} disabled={!ASSISTANT_ENDPOINT || !consent || !input.trim() || busy}>{busy ? <LoaderCircle className="cp-spin" size={17} /> : <Send size={17} />}</button>
    </form>
    <p className="cp-assistant-voice-note"><Volume2 size={14} />{copy.listenHint}</p>
    <label className="cp-ai-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span><strong>{copy.consentTitle}</strong>{copy.consent}</span></label>
    <div className="cp-assistant-footer">
      <label className="cp-assistant-save"><input type="checkbox" checked={saveHistory} onChange={(event) => { const enabled = event.target.checked; setSaveHistory(enabled); try { localStorage.setItem("carepath_ai_chat_save", String(enabled)); if (!enabled) localStorage.removeItem(CHAT_STORAGE_KEY); } catch { setStatus(copy.storageError); } }} /><span><strong>{copy.save}</strong><small>{copy.saveHint}</small></span></label>
      <div className="cp-assistant-actions">
        <div className="cp-language-switch" role="group" aria-label="Assistant response language"><button type="button" className={language === "en" ? "selected" : ""} aria-pressed={language === "en"} onClick={() => onLanguageChange("en")}>English</button><button type="button" className={language === "kn" ? "selected" : ""} aria-pressed={language === "kn"} onClick={() => onLanguageChange("kn")}>ಕನ್ನಡ</button></div>
        <button type="button" className="cp-button quiet" onClick={clearChat} aria-label={copy.clearLabel}><Trash2 size={14} />{copy.clear}</button>
      </div>
    </div>
    {status && <p className="cp-ai-status" role="status"><Check size={15} />{status}</p>}
    <p className="cp-assistant-bottom-hint">{copy.askHint}</p>
  </section>;
}
