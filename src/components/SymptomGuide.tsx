import { useState } from "react";
import {
  Activity,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  CircleAlert,
  Clock3,
  HeartHandshake,
  Mic,
  Pill,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Volume2,
} from "lucide-react";
import { getVoiceLanguage } from "../voice";
import { findMedicineInQuestion, findMedicineSpelling, findSymptomGuide, SYMPTOM_GUIDES, type GuideLanguage, type SymptomGuideTopic } from "../symptomGuideContent";
import MedlinePlusLookup from "./MedlinePlusLookup";
import ReadAloudButton from "./ReadAloudButton";

type SymptomEntry = {
  id: string;
  symptom: string;
  person: string;
  ageGroup: string;
  duration: string;
  measurement: string;
  measurementUnit: string;
  notes: string;
  date: string;
  time: string;
};

type SpeechResultEvent = Event & { results: ArrayLike<ArrayLike<{ transcript: string }>> };
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechConstructor = new () => SpeechRecognitionLike;
type SpeechWindow = Window & { SpeechRecognition?: SpeechConstructor; webkitSpeechRecognition?: SpeechConstructor };

const STORAGE_KEY = "carepath_symptom_notes";
const IMMEDIATE_HELP_WORDS = /\b(chest pain|can't breathe|cannot breathe|difficulty breathing|trouble breathing|shortness of breath|unconscious|passed out|fainted|seizure|blue lips|face droop|one[- ]sided weakness|vomit(?:ing)? blood|cough(?:ing)? up blood|swollen (?:face|tongue|throat))\b|ಉಸಿರಾಟದ ತೊಂದರೆ|ಎದೆನೋವು|ಮೂರ್ಛೆ|ಸೆಳೆತ/iu;

const copy = {
  en: {
    eyebrow: "PRACTICAL GUIDANCE · TRUSTED SOURCES",
    title: "What’s bothering you?",
    intro: "Write it the way you would tell a person. Choose a common topic or ask about a medicine. Simple spelling mistakes are okay.",
    searchPlaceholder: "For example: fever, leg pain, cough…",
    getGuide: "Show my guide",
    listen: "Speak",
    listening: "Listening…",
    voiceUnavailable: "Voice input is not available in this browser. Type your concern instead.",
    voiceReview: "Check the recognized words before continuing.",
    quick: "Popular questions",
    medicineLookup: "I know the medicine name",
    medicineHelp: "Look up a tablet or ingredient in this app using NIH MedlinePlus. Only the name is sent, and only after you agree.",
    matched: "We matched the spelling to",
    medicineCorrection: "This may be a medicine name. Check the package before searching:",
    useCorrection: "Search this spelling",
    differentName: "Search a different name",
    greeting: "Hi! I’m here to help you find reviewed health guides or general medicine information. Try a symptom such as cough, fever, or leg pain, or ask about a medicine name.",
    greetingAsk: "Ask a broader question",
    notFound: "We don’t have a reviewed guide for those words yet. We won’t guess a cause or tablet. Try a common topic, or send the question to Ask CARE CONNECTED.",
    askFollowUp: "Ask a follow-up",
    visit: "Prepare for a visit",
    overview: "A symptom can have more than one cause. This guide shares general information, not a diagnosis or personal treatment plan.",
    homeTitle: "What you can do now",
    medicineTitle: "Medicine information people often look for",
    medicineBoundary: "General ingredient information · not a recommendation to take it",
    medicineHow: "How to use medicine information safely",
    medicineHowText: "Follow the leaflet on your own product. Do not use a dose from this app. Strengths, labels, brands, and approvals vary by country. If unsure, show the package to a pharmacist.",
    lookUp: "Check full medicine information in this app",
    urgentTitle: "Get help now if…",
    followTitle: "Contact a healthcare professional",
    sourceTitle: "Sources used for this guide",
    sourceLanguage: "Some source pages are in English. Product labels and local advice may differ by country.",
    noteTitle: "Save a private note (optional)",
    noteIntro: "Keep your own words, date, and question on this device. Nothing is sent to a clinic.",
    person: "Who is this about?",
    me: "Me",
    someone: "Someone I help",
    age: "Age group (optional)",
    ageChoices: ["Choose if useful", "Under 5", "5–17", "18–64", "65 or older", "Prefer not to say"],
    duration: "When did it start? (optional)",
    durationChoices: ["Choose if known", "Today", "1–2 days ago", "3–7 days ago", "More than a week ago", "Not sure"],
    noteLabel: "What would you like to remember or ask?",
    notePlaceholder: "Write a few words…",
    save: "Save note on this device",
    saved: "Your note is saved in this browser.",
    noNotes: "Your saved notes will appear here.",
    recent: "Your recent notes",
    remove: "Remove",
    removeConfirm: "Remove this symptom note from this browser?",
    openEmergency: "Open Emergency Help",
    info: "Guide only · not diagnosis or a prescription",
  },
  kn: {
    eyebrow: "ಪ್ರಾಯೋಗಿಕ ಮಾಹಿತಿ · ವಿಶ್ವಾಸಾರ್ಹ ಮೂಲಗಳು",
    title: "ನಿಮಗೆ ಏನು ತೊಂದರೆ?",
    intro: "ಒಬ್ಬರಿಗೆ ಹೇಳುವಂತೆ ಬರೆಯಿರಿ. ಸಾಮಾನ್ಯ ವಿಷಯ ಆಯ್ಕೆಮಾಡಿ ಅಥವಾ ಔಷಧಿಯ ಬಗ್ಗೆ ಕೇಳಿ. ಸರಳ ಕಾಗುಣಿತ ತಪ್ಪುಗಳು ಪರವಾಗಿಲ್ಲ.",
    searchPlaceholder: "ಉದಾ: ಜ್ವರ, ಕಾಲು ನೋವು, ಕೆಮ್ಮು…",
    getGuide: "ಮಾರ್ಗದರ್ಶಿ ನೋಡಿ",
    listen: "ಹೇಳಿ",
    listening: "ಕೇಳುತ್ತಿದೆ…",
    voiceUnavailable: "ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಇನ್‌ಪುಟ್ ಲಭ್ಯವಿಲ್ಲ. ನಿಮ್ಮ ಸಮಸ್ಯೆಯನ್ನು ಬರೆಯಿರಿ.",
    voiceReview: "ಮುಂದುವರಿಸುವ ಮೊದಲು ಗುರುತಿಸಿದ ಪದಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.",
    quick: "ಜನಪ್ರಿಯ ಪ್ರಶ್ನೆಗಳು",
    medicineLookup: "ಔಷಧಿಯ ಹೆಸರು ಗೊತ್ತಿದೆ",
    medicineHelp: "NIH MedlinePlus ಬಳಸಿ ಈ ಆಪ್‌ನಲ್ಲೇ ಮಾತ್ರೆ ಅಥವಾ ಪದಾರ್ಥ ಹುಡುಕಿ. ನಿಮ್ಮ ಒಪ್ಪಿಗೆಯ ನಂತರ ಹೆಸರನ್ನು ಮಾತ್ರ ಕಳುಹಿಸಲಾಗುತ್ತದೆ.",
    matched: "ಕಾಗುಣಿತವನ್ನು ಇದಕ್ಕೆ ಹೊಂದಿಸಿದ್ದೇವೆ",
    medicineCorrection: "ಇದು ಔಷಧಿಯ ಹೆಸರು ಇರಬಹುದು. ಹುಡುಕುವ ಮೊದಲು ಪ್ಯಾಕೆಟ್ ಪರಿಶೀಲಿಸಿ:",
    useCorrection: "ಈ ಹೆಸರಿನಿಂದ ಹುಡುಕಿ",
    differentName: "ಬೇರೆ ಹೆಸರನ್ನು ಹುಡುಕಿ",
    greeting: "ನಮಸ್ಕಾರ! ಪರಿಶೀಲಿತ ಆರೋಗ್ಯ ಮಾರ್ಗದರ್ಶಿ ಅಥವಾ ಸಾಮಾನ್ಯ ಔಷಧಿ ಮಾಹಿತಿ ಹುಡುಕಲು ನಾನು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. ಕೆಮ್ಮು, ಜ್ವರ ಅಥವಾ ಕಾಲಿನ ನೋವಿನಂತಹ ಲಕ್ಷಣವನ್ನು ಬರೆಯಿರಿ ಅಥವಾ ಔಷಧಿಯ ಹೆಸರನ್ನು ಕೇಳಿ.",
    greetingAsk: "ಇನ್ನೊಂದು ಪ್ರಶ್ನೆ ಕೇಳಿ",
    notFound: "ಈ ಪದಗಳಿಗೆ ಪರಿಶೀಲಿತ ಮಾರ್ಗದರ್ಶಿ ಇಲ್ಲ. ನಾವು ಕಾರಣ ಅಥವಾ ಮಾತ್ರೆ ಊಹಿಸುವುದಿಲ್ಲ. ಸಾಮಾನ್ಯ ವಿಷಯ ಆಯ್ಕೆಮಾಡಿ ಅಥವಾ CARE CONNECTED ಗೆ ಪ್ರಶ್ನೆ ಕಳುಹಿಸಿ.",
    askFollowUp: "ಮುಂದಿನ ಪ್ರಶ್ನೆ ಕೇಳಿ",
    visit: "ವೈದ್ಯರನ್ನು ಭೇಟಿಯಾಗಲು ಸಿದ್ಧರಾಗಿ",
    overview: "ಒಂದು ಲಕ್ಷಣಕ್ಕೆ ಒಂದಕ್ಕಿಂತ ಹೆಚ್ಚು ಕಾರಣಗಳಿರಬಹುದು. ಇದು ಸಾಮಾನ್ಯ ಮಾಹಿತಿ ಮಾತ್ರ; ರೋಗನಿರ್ಣಯ ಅಥವಾ ವೈಯಕ್ತಿಕ ಚಿಕಿತ್ಸಾ ಯೋಜನೆ ಅಲ್ಲ.",
    homeTitle: "ಈಗ ನೀವು ಮಾಡಬಹುದಾದುದು",
    medicineTitle: "ಜನರು ಹುಡುಕುವ ಔಷಧಿ ಮಾಹಿತಿ",
    medicineBoundary: "ಸಾಮಾನ್ಯ ಪದಾರ್ಥದ ಮಾಹಿತಿ · ತೆಗೆದುಕೊಳ್ಳಲು ಶಿಫಾರಸು ಅಲ್ಲ",
    medicineHow: "ಔಷಧಿ ಮಾಹಿತಿಯನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಬಳಸಿ",
    medicineHowText: "ನಿಮ್ಮ ಉತ್ಪನ್ನದ ಲೀಫ್ಲೆಟ್ ಅನುಸರಿಸಿ. ಈ ಆಪ್‌ನ ಡೋಸ್ ಬಳಸಬೇಡಿ. ಶಕ್ತಿ, ಲೇಬಲ್, ಬ್ರ್ಯಾಂಡ್ ಮತ್ತು ಅನುಮೋದನೆ ದೇಶದಂತೆ ಬದಲಾಗುತ್ತದೆ. ಅನುಮಾನವಿದ್ದರೆ ಪ್ಯಾಕೆಟ್ ಅನ್ನು ಫಾರ್ಮಸಿಸ್ಟ್‌ಗೆ ತೋರಿಸಿ.",
    lookUp: "ಈ ಆಪ್‌ನಲ್ಲಿ ಸಂಪೂರ್ಣ ಔಷಧಿ ಮಾಹಿತಿ ನೋಡಿ",
    urgentTitle: "ಈಗಲೇ ಸಹಾಯ ಪಡೆಯಿರಿ…",
    followTitle: "ಆರೋಗ್ಯ ವೃತ್ತಿಪರರನ್ನು ಸಂಪರ್ಕಿಸಿ",
    sourceTitle: "ಈ ಮಾರ್ಗದರ್ಶಿಯ ಮೂಲಗಳು",
    sourceLanguage: "ಕೆಲವು ಮೂಲ ಪುಟಗಳು ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿವೆ. ಔಷಧಿ ಲೇಬಲ್ ಮತ್ತು ಸ್ಥಳೀಯ ಸಲಹೆ ದೇಶದಂತೆ ಬದಲಾಗಬಹುದು.",
    noteTitle: "ಖಾಸಗಿ ಟಿಪ್ಪಣಿ ಉಳಿಸಿ (ಐಚ್ಛಿಕ)",
    noteIntro: "ನಿಮ್ಮ ಮಾತು, ದಿನಾಂಕ ಮತ್ತು ಪ್ರಶ್ನೆಯನ್ನು ಈ ಸಾಧನದಲ್ಲಿ ಮಾತ್ರ ಉಳಿಸಿ. ಯಾವುದನ್ನೂ ಕ್ಲಿನಿಕ್‌ಗೆ ಕಳುಹಿಸುವುದಿಲ್ಲ.",
    person: "ಇದು ಯಾರ ಬಗ್ಗೆ?",
    me: "ನನ್ನ ಬಗ್ಗೆ",
    someone: "ನಾನು ಸಹಾಯ ಮಾಡುವ ವ್ಯಕ್ತಿ",
    age: "ವಯಸ್ಸಿನ ಗುಂಪು (ಐಚ್ಛಿಕ)",
    ageChoices: ["ಸಹಾಯಕವಾದರೆ ಆಯ್ಕೆಮಾಡಿ", "5 ವರ್ಷಕ್ಕಿಂತ ಕಡಿಮೆ", "5–17", "18–64", "65 ಅಥವಾ ಹೆಚ್ಚು", "ಹೇಳಲು ಇಷ್ಟವಿಲ್ಲ"],
    duration: "ಯಾವಾಗ ಆರಂಭವಾಯಿತು? (ಐಚ್ಛಿಕ)",
    durationChoices: ["ತಿಳಿದಿದ್ದರೆ ಆಯ್ಕೆಮಾಡಿ", "ಇಂದು", "1–2 ದಿನಗಳ ಹಿಂದೆ", "3–7 ದಿನಗಳ ಹಿಂದೆ", "ಒಂದು ವಾರಕ್ಕಿಂತ ಹೆಚ್ಚು", "ತಿಳಿದಿಲ್ಲ"],
    noteLabel: "ಏನು ನೆನಪಿಡಲು ಅಥವಾ ಕೇಳಲು ಬಯಸುತ್ತೀರಿ?",
    notePlaceholder: "ಕೆಲವು ಪದಗಳನ್ನು ಬರೆಯಿರಿ…",
    save: "ಈ ಸಾಧನದಲ್ಲಿ ಟಿಪ್ಪಣಿ ಉಳಿಸಿ",
    saved: "ನಿಮ್ಮ ಟಿಪ್ಪಣಿ ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ.",
    noNotes: "ಉಳಿಸಿದ ಟಿಪ್ಪಣಿಗಳು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ.",
    recent: "ಇತ್ತೀಚಿನ ಟಿಪ್ಪಣಿಗಳು",
    remove: "ತೆಗೆದುಹಾಕಿ",
    removeConfirm: "ಈ ಬ್ರೌಸರ್‌ನಿಂದ ಲಕ್ಷಣದ ಟಿಪ್ಪಣಿ ತೆಗೆದುಹಾಕಬೇಕೇ?",
    openEmergency: "ತುರ್ತು ಸಹಾಯ ತೆರೆಯಿರಿ",
    info: "ಮಾರ್ಗದರ್ಶಿ ಮಾತ್ರ · ರೋಗನಿರ್ಣಯ ಅಥವಾ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಅಲ್ಲ",
  },
} as const;

function readEntries(): SymptomEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed as SymptomEntry[] : [];
  } catch {
    return [];
  }
}

function todayParts() {
  const now = new Date();
  return {
    date: now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0"),
    time: String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0"),
  };
}

function guideText(guide: SymptomGuideTopic, language: GuideLanguage) {
  return [guide.name[language], guide.intro[language], ...guide.selfCare[language], ...guide.medicines?.flatMap((medicine) => [medicine.name, medicine.helps[language], medicine.cautions[language]]) ?? [], ...guide.urgent[language], guide.followUp[language]].join(". ");
}

function isGreeting(value: string) {
  const normalized = value.normalize("NFC").toLocaleLowerCase().replace(/[.!?,]+/gu, " ").replace(/\s+/gu, " ").trim();
  return /^(?:(?:hi|hello|hey|namaste|ನಮಸ್ಕಾರ|ಹಾಯ್|ಹಲೋ)(?:\s+there)?\s*)?(?:how are you(?: doing)?|how is it going|what is up|what's up|are you there|ನೀವು ಹೇಗಿದ್ದೀರಿ|ಹೇಗಿದ್ದೀರಿ|ನೀವು ಚೆನ್ನಾಗಿದ್ದೀರಾ)?$/u.test(normalized)
    || /^(?:good morning|good afternoon|good evening)$/u.test(normalized);
}

function extractMedicineQuestionTerm(value: string) {
  const text = value.trim().replace(/[?.!]+$/g, "").trim();
  const patterns = [
    /^(?:what is|what's|tell me about|explain)\s+(.+?)\s+(?:used for|for|purpose|benefits?|side effects?)$/i,
    /^(?:what does)\s+(.+?)\s+do$/i,
    /^(?:what are|tell me)\s+(?:the\s+)?(?:side effects?|benefits?|uses?|purpose)\s+of\s+(.+)$/i,
    /^(?:purpose|use|uses|side effects?|benefits?)\s+of\s+(.+)$/i,
    /^(.+?)\s+(?:uses?|purpose|side effects?|benefits?)$/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const candidate = match?.[match.length - 1]?.trim().replace(/^(?:the\s+)?(?:medicine|tablet|drug|capsule|pill)\s+/i, "");
    if (!candidate || candidate.length > 70 || /^(?:this|my|the|a|any)\s*(?:medicine|tablet|drug|capsule|pill)?$/i.test(candidate)) continue;
    if (/\b(?:for|with|and|or)\s+(?:cough|fever|headache|leg pain|stomach pain|nausea|rash)\b/i.test(candidate)) continue;
    return candidate;
  }
  return null;
}

export default function SymptomGuide({ onNavigate, onAskQuestion }: { onNavigate: (section: string) => void; onAskQuestion: (question: string) => void }) {
  const [language, setLanguage] = useState<GuideLanguage>(() => getVoiceLanguage());
  const [query, setQuery] = useState("");
  const [selectedGuide, setSelectedGuide] = useState<SymptomGuideTopic | null>(null);
  const [matchedCorrection, setMatchedCorrection] = useState("");
  const [medicineCorrection, setMedicineCorrection] = useState<{ typed: string; corrected: string; medicine: string } | null>(null);
  const [greeting, setGreeting] = useState(false);
  const [noMatch, setNoMatch] = useState(false);
  const [emergencyPhrase, setEmergencyPhrase] = useState(false);
  const [showMedicineLookup, setShowMedicineLookup] = useState(false);
  const [medicineLookupTerm, setMedicineLookupTerm] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [person, setPerson] = useState("Me");
  const [ageGroup, setAgeGroup] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [entries, setEntries] = useState<SymptomEntry[]>(readEntries);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState("");
  const t = copy[language];

  const setConcern = (value: string) => {
    setQuery(value);
    setSelectedGuide(null);
    setNoMatch(false);
    setEmergencyPhrase(false);
    setMatchedCorrection("");
    setMedicineCorrection(null);
    setGreeting(false);
    setShowMedicineLookup(false);
    setMedicineLookupTerm("");
    setStatus("");
  };

  const submitSearch = () => {
    const value = query.trim();
    if (!value) return;
    setStatus("");
    setError("");
    setShowMedicineLookup(false);
    setSelectedGuide(null);
    setMatchedCorrection("");
    setMedicineCorrection(null);
    setNoMatch(false);
    const urgent = IMMEDIATE_HELP_WORDS.test(value);
    setEmergencyPhrase(urgent);
    setGreeting(false);
    if (urgent) return;
    if (isGreeting(value)) {
      setGreeting(true);
      return;
    }
    const result = findSymptomGuide(value);
    if (result) {
      setSelectedGuide(result.guide);
      setMatchedCorrection(result.correction ?? "");
      setNoMatch(false);
    } else {
      const medicineMatch = findMedicineSpelling(value);
      if (medicineMatch?.correction) {
        setMedicineCorrection({ typed: medicineMatch.typed, corrected: medicineMatch.correction, medicine: medicineMatch.medicine });
        setNoMatch(false);
        return;
      }
      const knownMedicine = findMedicineInQuestion(value);
      const questionTerm = extractMedicineQuestionTerm(value);
      if (knownMedicine || questionTerm) {
        setMedicineLookupTerm(knownMedicine ?? questionTerm ?? "");
        setShowMedicineLookup(true);
      } else {
        setNoMatch(true);
      }
    }
  };

  const chooseGuide = (guide: SymptomGuideTopic) => {
    setQuery(guide.name[language]);
    setSelectedGuide(guide);
    setMatchedCorrection("");
    setMedicineCorrection(null);
    setGreeting(false);
    setNoMatch(false);
    setEmergencyPhrase(false);
    setShowMedicineLookup(false);
    setStatus("");
    setError("");
  };

  const startVoice = () => {
    const Speech = (window as SpeechWindow).SpeechRecognition || (window as SpeechWindow).webkitSpeechRecognition;
    if (!Speech) { setVoiceNotice(t.voiceUnavailable); return; }
    try {
      const recognition = new Speech();
      recognition.lang = language === "kn" ? "kn-IN" : "en-IN";
      recognition.interimResults = false;
      recognition.onresult = (event) => {
        const recognized = event.results[0]?.[0]?.transcript || "";
        if (recognized) setConcern(recognized);
        setVoiceNotice(t.voiceReview);
        setListening(false);
      };
      recognition.onerror = () => { setListening(false); setVoiceNotice(language === "kn" ? "ಧ್ವನಿಯನ್ನು ಗುರುತಿಸಲಾಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ಬರೆಯಿರಿ." : "I could not recognize that clearly. Try again or type instead."); };
      recognition.onend = () => setListening(false);
      setListening(true);
      setVoiceNotice(language === "kn" ? "ನಿಧಾನವಾಗಿ ಮಾತನಾಡಿ." : "Speak clearly in a short phrase.");
      recognition.start();
    } catch { setListening(false); setVoiceNotice(t.voiceUnavailable); }
  };

  const saveEntry = () => {
    const now = todayParts();
    const entry: SymptomEntry = {
      id: "symptom-" + Date.now(),
      symptom: (selectedGuide?.name.en ?? query.trim()) || "Health note",
      person,
      ageGroup,
      duration,
      measurement: "",
      measurementUnit: "",
      notes: notes.trim(),
      date: now.date,
      time: now.time,
    };
    const next = [entry, ...entries];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      localStorage.setItem("carepath_last_local_save", new Date().toISOString());
      setEntries(next);
      setStatus(t.saved);
      setError("");
      setNotes("");
      window.dispatchEvent(new Event("carepath:refresh"));
    } catch {
      setError(language === "kn" ? "ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಉಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ." : "This browser could not save the note. Try again.");
    }
  };

  const removeEntry = (id: string) => {
    if (!window.confirm(t.removeConfirm)) return;
    const next = entries.filter((entry) => entry.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setEntries(next);
      window.dispatchEvent(new Event("carepath:refresh"));
    } catch {
      setError(language === "kn" ? "ಈ ಟಿಪ್ಪಣಿಯನ್ನು ತೆಗೆದುಹಾಕಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ." : "This note could not be removed.");
    }
  };

  const listenLabel = language === "kn" ? "ಮಾರ್ಗದರ್ಶಿ ಕೇಳಿ" : "Listen to this guide";

  return (
    <div className="cp-symptom-page cc-symptom-page">
      <header className="cp-page-header cc-symptom-header">
        <div className="cp-page-title-icon"><Activity size={24} /></div>
        <div className="cp-page-copy">
          <span className="cp-eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
        </div>
        <div className="cp-page-action cp-language-switch" role="group" aria-label={language === "kn" ? "ಭಾಷೆ" : "Interface language"}>
          <button type="button" className={language === "en" ? "selected" : ""} aria-pressed={language === "en"} onClick={() => setLanguage("en")}>English</button>
          <button type="button" className={language === "kn" ? "selected" : ""} aria-pressed={language === "kn"} onClick={() => setLanguage("kn")}>ಕನ್ನಡ</button>
        </div>
      </header>

      <section className="cc-symptom-search" aria-label={t.title}>
        <div className="cc-symptom-search-heading">
          <span><Sparkles size={17} /></span>
          <div><strong>{language === "kn" ? "ನಿಮ್ಮ ಮಾತಿನಲ್ಲಿ ಕೇಳಿ" : "Ask in your own words"}</strong><small>{language === "kn" ? "ಟೈಪ್ ಮಾಡಿ ಅಥವಾ ಮಾತನಾಡಿ — ಮೊದಲು ಫಾರ್ಮ್ ತುಂಬಬೇಕಿಲ್ಲ." : "Type or speak. No long form to fill in first."}</small></div>
        </div>
        <form className="cc-symptom-search-form" onSubmit={(event) => { event.preventDefault(); submitSearch(); }}>
          <Search size={19} aria-hidden="true" />
          <input value={query} onChange={(event) => setConcern(event.target.value)} placeholder={t.searchPlaceholder} aria-label={t.searchPlaceholder} maxLength={180} />
          <button type="button" className={`cc-symptom-mic ${listening ? "listening" : ""}`} onClick={startVoice} aria-label={listening ? t.listening : t.listen} disabled={listening}>{listening ? <Volume2 size={18} /> : <Mic size={18} />}<span>{listening ? t.listening : t.listen}</span></button>
          <button className="cc-symptom-submit" type="submit" disabled={!query.trim()}><span>{t.getGuide}</span><ArrowRight size={17} /></button>
        </form>
        {voiceNotice && <p className="cc-symptom-voice" role="status">{voiceNotice}</p>}
        <div className="cc-symptom-popular"><span>{t.quick}</span>{SYMPTOM_GUIDES.map((guide) => <button type="button" key={guide.id} onClick={() => chooseGuide(guide)}>{guide.name[language]}</button>)}</div>
        <button type="button" className="cc-symptom-drug-toggle" aria-expanded={showMedicineLookup && !selectedGuide} onClick={() => { setSelectedGuide(null); setShowMedicineLookup((current) => !current); setNoMatch(false); setMedicineLookupTerm(""); }}><Pill size={16} />{t.medicineLookup}<ArrowRight size={14} /></button>
        <small className="cc-symptom-drug-help">{t.medicineHelp}</small>
      </section>

      {emergencyPhrase && <section className="cc-symptom-emergency" role="alert">
        <CircleAlert size={22} />
        <div><strong>{language === "kn" ? "ತುರ್ತು ಲಕ್ಷಣ ಇರಬಹುದು" : "This may need emergency help"}</strong><p>{language === "kn" ? "ಈಗಲೇ ಸ್ಥಳೀಯ ತುರ್ತು ಸೇವೆಗೆ ಕರೆ ಮಾಡಿ ಅಥವಾ ಹತ್ತಿರದ ತುರ್ತು ಚಿಕಿತ್ಸಾ ಕೇಂದ್ರಕ್ಕೆ ಹೋಗಿ. ಆಪ್‌ನ ಉತ್ತರಕ್ಕಾಗಿ ಕಾಯಬೇಡಿ." : "Call your local emergency service now or go to the nearest emergency department. Do not wait for an app reply."}</p></div>
        <button type="button" onClick={() => onNavigate("Emergency Help")}>{t.openEmergency}<ArrowRight size={15} /></button>
      </section>}

      {greeting && <section className="cc-symptom-no-match cc-symptom-greeting" role="status"><span><HeartHandshake size={20} /></span><div><strong>{language === "kn" ? "ನಮಸ್ಕಾರ! ನಿಮಗೆ ಏನು ತಿಳಿಯಬೇಕು?" : "Hi! What would you like help with?"}<p>{t.greeting}</p></strong><button type="button" className="cp-button primary" onClick={() => onAskQuestion(query.trim())}>{t.greetingAsk}<ArrowRight size={15} /></button></div></section>}

      {matchedCorrection && selectedGuide && <div className="cc-symptom-match" role="status"><CheckCircle2 size={17} /><span>{t.matched} <strong>{selectedGuide.name[language]}</strong>. {language === "kn" ? "ತಪ್ಪಿದ್ದರೆ ಬೇರೆ ವಿಷಯ ಆಯ್ಕೆಮಾಡಿ." : "If that is not right, choose another topic."}</span></div>}

      {selectedGuide && <article className="cc-symptom-result" aria-live="polite">
        <header className="cc-symptom-result-heading">
          <span className={`cc-symptom-result-icon ${selectedGuide.id}`}><HeartHandshake size={21} /></span>
          <div><span className="cp-eyebrow">{language === "kn" ? "ಪರಿಶೀಲಿತ ಸಾಮಾನ್ಯ ಮಾಹಿತಿ" : "REVIEWED GENERAL INFORMATION"}</span><h2>{selectedGuide.name[language]}</h2></div>
          <ReadAloudButton text={() => guideText(selectedGuide, language)} label={listenLabel} language={language} className="cc-symptom-read" />
        </header>
        <div className="cc-symptom-result-summary"><ShieldCheck size={17} /><p>{selectedGuide.intro[language]} <strong>{t.overview}</strong></p></div>

        <div className="cc-symptom-info-grid">
          <section className="cc-symptom-info-card self-care">
            <h3><HeartHandshake size={18} />{t.homeTitle}</h3>
            <ul>{selectedGuide.selfCare[language].map((point) => <li key={point}>{point}</li>)}</ul>
          </section>

          <section className="cc-symptom-info-card urgent-care">
            <h3><CircleAlert size={18} />{t.urgentTitle}</h3>
            <ul>{selectedGuide.urgent[language].map((point) => <li key={point}>{point}</li>)}</ul>
            <button type="button" onClick={() => onNavigate("Emergency Help")}>{t.openEmergency}<ArrowRight size={14} /></button>
          </section>
        </div>

        <section className="cc-symptom-medicine-section">
          <div className="cc-symptom-section-title"><span><Pill size={18} /></span><div><h3>{t.medicineTitle}</h3><small>{t.medicineBoundary}</small></div></div>
          {selectedGuide.medicineNote && <p className="cc-symptom-medicine-note">{selectedGuide.medicineNote[language]}</p>}
          {selectedGuide.medicines?.length ? <div className="cc-symptom-medicine-grid">{selectedGuide.medicines.map((medicine) => <article className="cc-symptom-medicine-card" key={medicine.name}>
            <h4>{medicine.name}</h4>
            <div><strong>{language === "kn" ? "ಏನು ಸಹಾಯ ಮಾಡಬಹುದು" : "What it may help"}</strong><p>{medicine.helps[language]}</p></div>
            <div className="caution"><strong>{language === "kn" ? "ಅಡ್ಡಪರಿಣಾಮಗಳು ಮತ್ತು ಎಚ್ಚರಿಕೆ" : "Side effects and cautions"}</strong><p>{medicine.cautions[language]}</p></div>
            <a href={medicine.source.url} target="_blank" rel="noopener noreferrer">{medicine.source.label}<ArrowRight size={13} /></a>
            <button type="button" className="cc-symptom-lookup-button" onClick={() => { setMedicineLookupTerm(medicine.name.split(" (")[0]); setShowMedicineLookup(true); }}>{t.lookUp}<ArrowRight size={14} /></button>
          </article>)}</div> : <div className="cc-symptom-no-medicine"><BookOpenCheck size={18} /><p>{language === "kn" ? "ಈ ಲಕ್ಷಣಕ್ಕೆ ಸುರಕ್ಷಿತವಾದ ಒಂದೇ ಮಾತ್ರೆಯನ್ನು ಆಯ್ಕೆಮಾಡಲು ಸಾಧ್ಯವಿಲ್ಲ. ಕಾರಣ ಮತ್ತು ಇತರ ಔಷಧಿಗಳನ್ನು ಪರಿಶೀಲಿಸಲು ಫಾರ್ಮಸಿಸ್ಟ್ ಅಥವಾ ವೈದ್ಯರನ್ನು ಕೇಳಿ." : "There is no safe one-size-fits-all tablet for this symptom. Ask a pharmacist or clinician to check possible causes and your other medicines."}</p></div>}
          <div className="cc-symptom-label-reminder"><ShieldCheck size={17} /><p><strong>{t.medicineHow}</strong><br />{t.medicineHowText}</p></div>
        </section>

        <section className="cc-symptom-follow-up"><Clock3 size={18} /><div><strong>{t.followTitle}</strong><p>{selectedGuide.followUp[language]}</p></div><button type="button" onClick={() => onNavigate("Visit Prep")}>{t.visit}<ArrowRight size={14} /></button></section>

        <div className="cc-symptom-result-actions">
          <button type="button" className="cp-button primary" onClick={() => onAskQuestion(query.trim())}>{t.askFollowUp}<ArrowRight size={15} /></button>
          <button type="button" className="cp-button quiet" onClick={() => { setShowNote((current) => !current); setStatus(""); }}>{showNote ? (language === "kn" ? "ಟಿಪ್ಪಣಿ ಮುಚ್ಚಿ" : "Close note") : t.noteTitle}</button>
        </div>

        {selectedGuide.sources.length > 0 && <footer className="cc-symptom-sources"><strong>{t.sourceTitle}</strong><div>{selectedGuide.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">{source.label}<ArrowRight size={13} /></a>)}</div><small>{t.sourceLanguage}</small></footer>}
      </article>}

      {medicineCorrection && <section className="cc-symptom-match cc-medicine-correction" role="status"><CheckCircle2 size={17} /><div><span>{t.medicineCorrection} <strong>{medicineCorrection.typed}</strong> → <strong>{medicineCorrection.medicine}</strong></span><p>{language === "kn" ? "ಔಷಧಿಯ ಹೆಸರು ಅಥವಾ ಸಂಖ್ಯೆಯಲ್ಲಿ ತಪ್ಪಿದ್ದರೆ ಪ್ಯಾಕೆಟ್ ನೋಡಿ; ಖಚಿತವಾಗಿಲ್ಲದಿದ್ದರೆ ಹುಡುಕಬೇಡಿ." : "If a medicine name or strength may be wrong, check the package. Do not continue if you are unsure."}</p><button type="button" className="cp-button primary" onClick={() => { setMedicineLookupTerm(medicineCorrection.corrected); setShowMedicineLookup(true); setMedicineCorrection(null); }}>{t.useCorrection}<ArrowRight size={14} /></button><button type="button" className="cp-button quiet" onClick={() => { setMedicineLookupTerm(""); setShowMedicineLookup(true); setMedicineCorrection(null); }}>{t.differentName}</button></div></section>}

      {showMedicineLookup && <section className="cc-symptom-lookup-panel" aria-label={t.medicineLookup}>
        <button type="button" className="cc-symptom-lookup-close" onClick={() => setShowMedicineLookup(false)}>{language === "kn" ? "ಮುಚ್ಚಿ" : "Close"}</button>
        <MedlinePlusLookup key={medicineLookupTerm || "medicine-search"} question="" initialTerm={medicineLookupTerm} language={language} />
      </section>}

      {noMatch && <section className="cc-symptom-no-match" role="status"><span><Search size={20} /></span><div><strong>{language === "kn" ? "ಈ ಪ್ರಶ್ನೆಗೆ ಹೊಂದುವ ಮಾರ್ಗದರ್ಶಿ ಸಿಗಲಿಲ್ಲ" : "Let’s find the right place for that question"}<p>{t.notFound}</p></strong><button type="button" className="cp-button primary" onClick={() => onAskQuestion(query.trim())}>{language === "kn" ? "CARE CONNECTED ಅನ್ನು ಕೇಳಿ" : "Ask CARE CONNECTED"}<ArrowRight size={15} /></button></div></section>}

      <section className={`cc-symptom-note-panel ${showNote ? "open" : ""}`}>
        <button type="button" className="cc-symptom-note-toggle" aria-expanded={showNote} onClick={() => { setShowNote((current) => !current); setStatus(""); }}><span><BookOpenCheck size={18} /></span><strong>{t.noteTitle}</strong><span className="cc-symptom-note-chevron">{showNote ? "−" : "+"}</span></button>
        {showNote && <div className="cc-symptom-note-content">
          <p>{t.noteIntro}</p>
          <div className="cc-symptom-note-grid">
            <label>{t.person}<select value={person} onChange={(event) => setPerson(event.target.value)}><option value="Me">{t.me}</option><option value="Someone I help">{language === "kn" ? "ನಾನು ಸಹಾಯ ಮಾಡುವ ವ್ಯಕ್ತಿ" : "Someone I help"}</option></select></label>
            <label>{t.age}<select value={ageGroup} onChange={(event) => setAgeGroup(event.target.value)}>{t.ageChoices.map((option, index) => <option key={option} value={index === 0 ? "" : option}>{option}</option>)}</select></label>
            <label>{t.duration}<select value={duration} onChange={(event) => setDuration(event.target.value)}>{t.durationChoices.map((option, index) => <option key={option} value={index === 0 ? "" : option}>{option}</option>)}</select></label>
          </div>
          <label className="cc-symptom-note-label">{t.noteLabel}<textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={t.notePlaceholder} rows={3} maxLength={600} /></label>
          <button type="button" className="cp-button quiet" onClick={startVoice} disabled={listening}><Mic size={15} />{listening ? t.listening : t.listen}</button>
          {voiceNotice && <p className="cc-symptom-voice" role="status">{voiceNotice}</p>}
          {error && <p className="cp-symptom-error" role="alert">{error}</p>}
          <div className="cc-symptom-note-save-row"><button type="button" className="cp-button primary" onClick={saveEntry}><CheckCircle2 size={16} />{t.save}</button>{status && <span role="status"><CheckCircle2 size={15} />{status}</span>}</div>
        </div>}
      </section>

      <section className="cp-panel cp-symptom-history cc-symptom-history">
        <div className="cp-panel-heading"><div><span className="cp-eyebrow">{entries.length} SAVED ON THIS DEVICE</span><h2>{t.recent}</h2></div></div>
        {entries.length ? <div className="cp-symptom-entry-list">{entries.map((entry) => (
          <article className="cp-symptom-entry" key={entry.id}>
            <span className="cp-symptom-entry-icon"><Clock3 size={17} /></span>
            <div><strong>{entry.symptom === "Fever" ? (language === "kn" ? "ಜ್ವರ" : "Fever") : entry.symptom}</strong><small>{entry.date} · {entry.time} · {entry.person}{entry.ageGroup ? " · " + entry.ageGroup : ""}</small><p>{[entry.duration, entry.notes].filter(Boolean).join(" · ") || (language === "kn" ? "ಟಿಪ್ಪಣಿ ಸೇರಿಸಿಲ್ಲ" : "No extra note")}</p></div>
            <button type="button" className="cp-symptom-remove" aria-label={t.remove + " " + entry.symptom} onClick={() => removeEntry(entry.id)}><Trash2 size={16} /><span>{t.remove}</span></button>
          </article>
        ))}</div> : <div className="cp-symptom-empty"><Activity size={23} /><p>{t.noNotes}</p></div>}
      </section>

      <p className="cc-symptom-boundary"><ShieldCheck size={16} />{t.info}. {language === "kn" ? "ವೈಯಕ್ತಿಕ ವೈದ್ಯಕೀಯ ನಿರ್ಧಾರಗಳಿಗೆ ಅರ್ಹ ಆರೋಗ್ಯ ವೃತ್ತಿಪರರನ್ನು ಸಂಪರ್ಕಿಸಿ." : "For personal medical decisions, consult a qualified healthcare professional."}</p>
    </div>
  );
}

