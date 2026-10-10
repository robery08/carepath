import { useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Mic,
  ShieldAlert,
  Trash2,
  Volume2,
} from "lucide-react";

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
const symptoms = ["Fever", "Headache", "Cough or breathing concern", "Stomach pain", "Nausea", "Skin concern", "Pain or discomfort", "Something else"];

const copy = {
  en: {
    eyebrow: "A SIMPLE WAY TO PREPARE",
    title: "Symptom Guide",
    intro: "Describe what you have noticed. CAREPATH will help organize your notes for you or your care team, not assess or diagnose the symptom.",
    urgent: "Could someone be in immediate danger? Contact local emergency services now. Do not wait for this form.",
    emergency: "Open Emergency Help",
    step: "Step",
    of: "of",
    question: "What is bothering you?",
    choose: "Choose the closest description. You can add your own words later.",
    who: "Who is this note about?",
    me: "Me",
    someone: "Someone I help",
    prefer: "Prefer not to say",
    age: "Age group (optional)",
    ageOptions: ["Choose if helpful", "Under 5", "5–17", "18–64", "65 or older", "Prefer not to say"],
    when: "When did it start?",
    whenOptions: ["Choose if known", "Today", "1–2 days ago", "3–7 days ago", "More than a week ago", "Not sure"],
    measure: "Optional reading",
    measureHelp: "Copy a value from your own device or report. CAREPATH will not interpret it.",
    value: "Value",
    units: "Units",
    notesTitle: "What else would you like to remember?",
    notesHelp: "Add your own words, what changed, or a question for your clinician. This is optional.",
    notesPlaceholder: "Type a note…",
    speak: "Speak a note",
    listening: "Listening…",
    voiceUnavailable: "Voice input is not available in this browser. You can type instead.",
    voiceReview: "Review and edit the words that were recognized before saving.",
    read: "Read this page to me",
    next: "Next",
    back: "Back",
    review: "Review my note",
    save: "Save this note",
    reviewTitle: "Check your note",
    reviewHelp: "Make sure this says what you want to remember. Nothing is sent to a clinic.",
    recorded: "Your symptom note is saved in this browser.",
    notSent: "Saved only on this device. CAREPATH does not diagnose, rate urgency, or recommend treatment.",
    recent: "My recent notes",
    empty: "Your saved symptom notes will appear here.",
    remove: "Remove",
    removeConfirm: "Remove this symptom note from this browser?",
    newNote: "Start another note",
    visit: "Prepare for a care conversation",
    date: "Recorded",
    unknown: "Not recorded",
    languages: "Interface language",
  },
  kn: {
    eyebrow: "ಸರಳವಾಗಿ ತಯಾರಾಗಿರಿ",
    title: "ಲಕ್ಷಣಗಳ ಮಾರ್ಗದರ್ಶಿ",
    intro: "ನೀವು ಗಮನಿಸಿದುದನ್ನು ಬರೆಯಿರಿ. CAREPATH ನಿಮ್ಮ ಅಥವಾ ಆರೈಕೆ ತಂಡದೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳಲು ಟಿಪ್ಪಣಿಗಳನ್ನು ಸಂಘಟಿಸುತ್ತದೆ; ಲಕ್ಷಣವನ್ನು ನಿರ್ಣಯಿಸುವುದಿಲ್ಲ.",
    urgent: "ಯಾರಿಗಾದರೂ ತಕ್ಷಣದ ಅಪಾಯವಿದೆಯೇ? ಈಗಲೇ ಸ್ಥಳೀಯ ತುರ್ತು ಸೇವೆಗಳನ್ನು ಸಂಪರ್ಕಿಸಿ. ಈ ಫಾರ್ಮ್‌ಗಾಗಿ ಕಾಯಬೇಡಿ.",
    emergency: "ತುರ್ತು ಸಹಾಯ ತೆರೆಯಿರಿ",
    step: "ಹಂತ",
    of: "ರಲ್ಲಿ",
    question: "ನಿಮಗೆ ಏನು ತೊಂದರೆ?",
    choose: "ಹತ್ತಿರದ ವಿವರಣೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ. ನಂತರ ನಿಮ್ಮದೇ ಮಾತುಗಳನ್ನು ಸೇರಿಸಬಹುದು.",
    who: "ಈ ಟಿಪ್ಪಣಿ ಯಾರ ಬಗ್ಗೆ?",
    me: "ನನ್ನ ಬಗ್ಗೆ",
    someone: "ನಾನು ಸಹಾಯ ಮಾಡುವ ವ್ಯಕ್ತಿ",
    prefer: "ಹೇಳಲು ಇಷ್ಟವಿಲ್ಲ",
    age: "ವಯಸ್ಸಿನ ಗುಂಪು (ಐಚ್ಛಿಕ)",
    ageOptions: ["ಅಗತ್ಯವಿದ್ದರೆ ಆಯ್ಕೆಮಾಡಿ", "5 ವರ್ಷಕ್ಕಿಂತ ಕಡಿಮೆ", "5–17", "18–64", "65 ಅಥವಾ ಹೆಚ್ಚು", "ಹೇಳಲು ಇಷ್ಟವಿಲ್ಲ"],
    when: "ಇದು ಯಾವಾಗ ಪ್ರಾರಂಭವಾಯಿತು?",
    whenOptions: ["ತಿಳಿದಿದ್ದರೆ ಆಯ್ಕೆಮಾಡಿ", "ಇಂದು", "1–2 ದಿನಗಳ ಹಿಂದೆ", "3–7 ದಿನಗಳ ಹಿಂದೆ", "ಒಂದು ವಾರಕ್ಕಿಂತ ಹೆಚ್ಚು", "ತಿಳಿದಿಲ್ಲ"],
    measure: "ಐಚ್ಛಿಕ ಅಳತೆ",
    measureHelp: "ನಿಮ್ಮ ಸಾಧನ ಅಥವಾ ವರದಿಯಲ್ಲಿರುವ ಮೌಲ್ಯವನ್ನು ನಕಲಿಸಿ. CAREPATH ಅದನ್ನು ಅರ್ಥೈಸುವುದಿಲ್ಲ.",
    value: "ಮೌಲ್ಯ",
    units: "ಘಟಕ",
    notesTitle: "ಇನ್ನೇನು ನೆನಪಿಡಲು ಬಯಸುತ್ತೀರಿ?",
    notesHelp: "ನಿಮ್ಮ ಮಾತುಗಳಲ್ಲಿ ಟಿಪ್ಪಣಿ ಅಥವಾ ವೈದ್ಯರಿಗೆ ಕೇಳುವ ಪ್ರಶ್ನೆ ಸೇರಿಸಿ. ಇದು ಐಚ್ಛಿಕ.",
    notesPlaceholder: "ಟಿಪ್ಪಣಿ ಬರೆಯಿರಿ…",
    speak: "ಟಿಪ್ಪಣಿ ಹೇಳಿ",
    listening: "ಕೇಳುತ್ತಿದೆ…",
    voiceUnavailable: "ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಇನ್‌ಪುಟ್ ಲಭ್ಯವಿಲ್ಲ. ಬದಲಿಗೆ ಟೈಪ್ ಮಾಡಿ.",
    voiceReview: "ಉಳಿಸುವ ಮೊದಲು ಗುರುತಿಸಿದ ಪದಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ತಿದ್ದುಪಡಿ ಮಾಡಿ.",
    read: "ಈ ಪುಟವನ್ನು ಓದಿ",
    next: "ಮುಂದೆ",
    back: "ಹಿಂದೆ",
    review: "ನನ್ನ ಟಿಪ್ಪಣಿಯನ್ನು ಪರಿಶೀಲಿಸಿ",
    save: "ಈ ಟಿಪ್ಪಣಿಯನ್ನು ಉಳಿಸಿ",
    reviewTitle: "ನಿಮ್ಮ ಟಿಪ್ಪಣಿಯನ್ನು ಪರಿಶೀಲಿಸಿ",
    reviewHelp: "ನೀವು ನೆನಪಿಡಲು ಬಯಸಿದುದನ್ನೇ ಇದು ಹೇಳುತ್ತದೆಯೇ ನೋಡಿ. ಯಾವುದನ್ನೂ ಕ್ಲಿನಿಕ್‌ಗೆ ಕಳುಹಿಸುವುದಿಲ್ಲ.",
    recorded: "ನಿಮ್ಮ ಲಕ್ಷಣದ ಟಿಪ್ಪಣಿ ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ.",
    notSent: "ಈ ಸಾಧನದಲ್ಲೇ ಉಳಿಸಲಾಗಿದೆ. CAREPATH ನಿರ್ಣಯಿಸುವುದಿಲ್ಲ, ತುರ್ತು ಮಟ್ಟ ಅಳೆಯುವುದಿಲ್ಲ ಅಥವಾ ಚಿಕಿತ್ಸೆಯನ್ನು ಶಿಫಾರಸು ಮಾಡುವುದಿಲ್ಲ.",
    recent: "ನನ್ನ ಇತ್ತೀಚಿನ ಟಿಪ್ಪಣಿಗಳು",
    empty: "ಉಳಿಸಿದ ಲಕ್ಷಣದ ಟಿಪ್ಪಣಿಗಳು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ.",
    remove: "ತೆಗೆದುಹಾಕಿ",
    removeConfirm: "ಈ ಬ್ರೌಸರ್‌ನಿಂದ ಈ ಲಕ್ಷಣದ ಟಿಪ್ಪಣಿಯನ್ನು ತೆಗೆದುಹಾಕಬೇಕೇ?",
    newNote: "ಮತ್ತೊಂದು ಟಿಪ್ಪಣಿ ಪ್ರಾರಂಭಿಸಿ",
    visit: "ಆರೈಕೆ ತಂಡದೊಂದಿಗೆ ಮಾತುಕತೆಗೆ ತಯಾರಾಗಿ",
    date: "ದಾಖಲಿಸಿದ ದಿನ",
    unknown: "ದಾಖಲಿಸಿಲ್ಲ",
    languages: "ಇಂಟರ್ಫೇಸ್ ಭಾಷೆ",
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

export default function SymptomGuide({ onNavigate }: { onNavigate: (section: string) => void }) {
  const [language, setLanguage] = useState<"en" | "kn">("en");
  const [step, setStep] = useState(0);
  const [symptom, setSymptom] = useState("");
  const [person, setPerson] = useState("Me");
  const [ageGroup, setAgeGroup] = useState("");
  const [duration, setDuration] = useState("");
  const [measurement, setMeasurement] = useState("");
  const [measurementUnit, setMeasurementUnit] = useState("");
  const [notes, setNotes] = useState("");
  const [entries, setEntries] = useState<SymptomEntry[]>(readEntries);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState("");
  const t = copy[language];

  const speak = (text: string) => {
    if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      setVoiceNotice(language === "kn" ? "ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಓದುವ ಸೌಲಭ್ಯ ಲಭ್ಯವಿಲ್ಲ." : "Read-aloud is not available in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === "kn" ? "kn-IN" : "en-IN";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
    setVoiceNotice("");
  };

  const startVoice = () => {
    const Speech = (window as SpeechWindow).SpeechRecognition || (window as SpeechWindow).webkitSpeechRecognition;
    if (!Speech) {
      setVoiceNotice(t.voiceUnavailable);
      return;
    }
    try {
      const recognition = new Speech();
      recognition.lang = language === "kn" ? "kn-IN" : "en-IN";
      recognition.interimResults = false;
      recognition.onresult = (event) => {
        const recognized = event.results[0]?.[0]?.transcript || "";
        if (recognized) setNotes((current) => current ? current + " " + recognized : recognized);
        setVoiceNotice(t.voiceReview);
        setListening(false);
      };
      recognition.onerror = () => {
        setListening(false);
        setVoiceNotice(language === "kn" ? "ಧ್ವನಿಯನ್ನು ಗುರುತಿಸಲಾಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ." : "I could not recognize that clearly. Try again or type your note.");
      };
      recognition.onend = () => setListening(false);
      setListening(true);
      setVoiceNotice(language === "kn" ? "ನಿಧಾನವಾಗಿ ಮಾತನಾಡಿ." : "Speak your note clearly.");
      recognition.start();
    } catch {
      setListening(false);
      setVoiceNotice(t.voiceUnavailable);
    }
  };

  const resetForm = () => {
    setStep(0);
    setSymptom("");
    setPerson("Me");
    setAgeGroup("");
    setDuration("");
    setMeasurement("");
    setMeasurementUnit("");
    setNotes("");
    setStatus("");
    setError("");
    setVoiceNotice("");
  };

  const saveEntry = () => {
    if (!symptom) {
      setStep(0);
      setError(language === "kn" ? "ಮುಂದುವರಿಯಲು ಒಂದು ಆಯ್ಕೆಯನ್ನು ಆರಿಸಿ." : "Choose a description before saving.");
      return;
    }
    const now = todayParts();
    const entry: SymptomEntry = {
      id: "symptom-" + Date.now(),
      symptom,
      person,
      ageGroup,
      duration,
      measurement: measurement.trim(),
      measurementUnit: measurementUnit.trim(),
      notes: notes.trim(),
      date: now.date,
      time: now.time,
    };
    const next = [entry, ...entries];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      localStorage.setItem("carepath_last_local_save", new Date().toISOString());
      setEntries(next);
      setStatus(t.recorded);
      setError("");
      window.dispatchEvent(new Event("carepath:refresh"));
    } catch {
      setError(language === "kn" ? "ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಉಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ಜಾಗ ಖಾಲಿ ಮಾಡಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ." : "This browser could not save the note. Free some storage and try again.");
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

  const symptomName = (value: string) => {
    if (language === "kn") {
      const translations: Record<string, string> = {
        "Fever": "ಜ್ವರ",
        "Headache": "ತಲೆನೋವು",
        "Cough or breathing concern": "ಕೆಮ್ಮು ಅಥವಾ ಉಸಿರಾಟದ ತೊಂದರೆ",
        "Stomach pain": "ಹೊಟ್ಟೆ ನೋವು",
        "Nausea": "ವಾಕರಿಕೆ",
        "Skin concern": "ಚರ್ಮದ ಸಮಸ್ಯೆ",
        "Pain or discomfort": "ನೋವು ಅಥವಾ ಅಸೌಕರ್ಯ",
        "Something else": "ಬೇರೆ ಏನಾದರೂ",
      };
      return translations[value] || value;
    }
    return value;
  };

  return (
    <div className="cp-symptom-page">
      <header className="cp-page-header">
        <div className="cp-page-title-icon"><Activity size={24} /></div>
        <div className="cp-page-copy">
          <span className="cp-eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
        </div>
        <div className="cp-page-action cp-language-switch" role="group" aria-label={t.languages}>
          <button type="button" className={language === "en" ? "selected" : ""} aria-pressed={language === "en"} onClick={() => setLanguage("en")}>English</button>
          <button type="button" className={language === "kn" ? "selected" : ""} aria-pressed={language === "kn"} onClick={() => setLanguage("kn")}>ಕನ್ನಡ</button>
        </div>
      </header>

      <div className="cp-symptom-urgent" role="note">
        <ShieldAlert size={20} />
        <p>{t.urgent}</p>
        <button type="button" onClick={() => onNavigate("Emergency Help")}>{t.emergency}<ArrowRight size={15} /></button>
      </div>

      <section className="cp-panel cp-symptom-flow" aria-labelledby="cp-symptom-question">
        <div className="cp-symptom-progress">
          <span>{t.step} {step + 1} {t.of} 4</span>
          <div role="progressbar" aria-valuemin={1} aria-valuemax={4} aria-valuenow={step + 1}><i style={{ width: String(((step + 1) / 4) * 100) + "%" }} /></div>
        </div>

        {step === 0 && (
          <div className="cp-symptom-step">
            <span className="cp-eyebrow">01 · {t.question}</span>
            <h2 id="cp-symptom-question">{t.question}</h2>
            <p>{t.choose}</p>
            <div className="cp-symptom-choices" role="group" aria-label={t.question}>
              {symptoms.map((item) => (
                <button type="button" key={item} className={symptom === item ? "selected" : ""} aria-pressed={symptom === item} onClick={() => { setSymptom(item); setError(""); }}>
                  <span aria-hidden="true">{symptom === item ? "✓" : "＋"}</span>{symptomName(item)}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="cp-symptom-step">
            <span className="cp-eyebrow">02 · {t.who}</span>
            <h2 id="cp-symptom-question">{t.who}</h2>
            <p>{t.age}</p>
            <div className="cp-symptom-form-grid">
              <label>{t.who}
                <select value={person} onChange={(event) => setPerson(event.target.value)}>
                  <option value="Me">{t.me}</option>
                  <option value="Someone I help">{t.someone}</option>
                  <option value="Prefer not to say">{t.prefer}</option>
                </select>
              </label>
              <label>{t.age}
                <select value={ageGroup} onChange={(event) => setAgeGroup(event.target.value)}>
                  {t.ageOptions.map((option, index) => <option key={option} value={index === 0 ? "" : option}>{option}</option>)}
                </select>
              </label>
              <label>{t.when}
                <select value={duration} onChange={(event) => setDuration(event.target.value)}>
                  {t.whenOptions.map((option, index) => <option key={option} value={index === 0 ? "" : option}>{option}</option>)}
                </select>
              </label>
              <label>{t.measure} <span className="cp-symptom-optional">{t.measureHelp}</span>
                <div className="cp-symptom-measurement">
                  <input inputMode="decimal" value={measurement} onChange={(event) => setMeasurement(event.target.value)} aria-label={t.value} placeholder={t.value} />
                  <input value={measurementUnit} onChange={(event) => setMeasurementUnit(event.target.value)} aria-label={t.units} placeholder={t.units + " (e.g. °C)"} />
                </div>
              </label>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="cp-symptom-step">
            <span className="cp-eyebrow">03 · {t.notesTitle}</span>
            <h2 id="cp-symptom-question">{t.notesTitle}</h2>
            <p>{t.notesHelp}</p>
            <div className="cp-symptom-notes-tools">
              <button type="button" className="cp-button quiet" onClick={startVoice} disabled={listening}><Mic size={16} /> {listening ? t.listening : t.speak}</button>
              <button type="button" className="cp-button quiet" onClick={() => speak(t.notesHelp)}><Volume2 size={16} /> {t.read}</button>
            </div>
            <label className="cp-symptom-notes-label" htmlFor="cp-symptom-notes">{t.notesTitle}</label>
            <textarea id="cp-symptom-notes" className="cp-symptom-notes" rows={5} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={t.notesPlaceholder} />
            {voiceNotice && <p className="cp-symptom-voice" role="status">{voiceNotice}</p>}
          </div>
        )}

        {step === 3 && (
          <div className="cp-symptom-step">
            <span className="cp-eyebrow">04 · {t.reviewTitle}</span>
            <h2 id="cp-symptom-question">{t.reviewTitle}</h2>
            <p>{t.reviewHelp}</p>
            <dl className="cp-symptom-review">
              <div><dt>{t.question}</dt><dd>{symptomName(symptom) || t.unknown}</dd></div>
              <div><dt>{t.who}</dt><dd>{person === "Me" ? t.me : person === "Someone I help" ? t.someone : t.prefer}{ageGroup ? " · " + ageGroup : ""}</dd></div>
              <div><dt>{t.when}</dt><dd>{duration || t.unknown}</dd></div>
              <div><dt>{t.measure}</dt><dd>{measurement ? measurement + (measurementUnit ? " " + measurementUnit : "") : t.unknown}</dd></div>
              <div><dt>{t.notesTitle}</dt><dd>{notes.trim() || t.unknown}</dd></div>
            </dl>
            <p className="cp-symptom-private"><CheckCircle2 size={16} /> {t.notSent}</p>
          </div>
        )}

        {error && <p className="cp-symptom-error" role="alert">{error}</p>}
        <div className="cp-symptom-nav">
          {step > 0
            ? <button type="button" className="cp-button quiet" onClick={() => { setStep((current) => current - 1); setError(""); }}><ArrowLeft size={16} /> {t.back}</button>
            : <span />}
          {step < 3
            ? <button type="button" className="cp-button primary" disabled={step === 0 && !symptom} onClick={() => { setStep((current) => current + 1); setError(""); }}><span>{step === 2 ? t.review : t.next}</span><ArrowRight size={16} /></button>
            : <button type="button" className="cp-button primary" onClick={saveEntry}><CheckCircle2 size={16} /> {t.save}</button>}
        </div>
        {status && <div className="cp-symptom-saved" role="status"><CheckCircle2 size={17} /><span>{status}<small>{t.notSent}</small></span></div>}
      </section>

      <p className="cp-symptom-boundary">CAREPATH does not diagnose, decide how urgent a symptom is, interpret readings, or recommend treatment. Use a qualified professional for personal medical decisions.</p>

      <section className="cp-panel cp-symptom-history">
        <div className="cp-panel-heading"><div><span className="cp-eyebrow">{entries.length} SAVED ON THIS DEVICE</span><h2>{t.recent}</h2></div></div>
        {entries.length ? <div className="cp-symptom-entry-list">{entries.map((entry) => (
          <article className="cp-symptom-entry" key={entry.id}>
            <span className="cp-symptom-entry-icon"><Clock3 size={17} /></span>
            <div>
              <strong>{symptomName(entry.symptom)}</strong>
              <small>{entry.date} · {entry.time} · {entry.person}{entry.ageGroup ? " · " + entry.ageGroup : ""}</small>
              <p>{[entry.duration, entry.measurement ? entry.measurement + (entry.measurementUnit ? " " + entry.measurementUnit : "") : "", entry.notes].filter(Boolean).join(" · ") || t.unknown}</p>
            </div>
            <button type="button" className="cp-symptom-remove" aria-label={t.remove + " " + symptomName(entry.symptom)} onClick={() => removeEntry(entry.id)}><Trash2 size={16} /><span>{t.remove}</span></button>
          </article>
        ))}</div> : <div className="cp-symptom-empty"><Activity size={23} /><p>{t.empty}</p></div>}
      </section>

      {status && <div className="cp-inline-actions"><button type="button" className="cp-button primary" onClick={resetForm}>{t.newNote}</button><button type="button" className="cp-button quiet" onClick={() => onNavigate("Visit Prep")}>{t.visit}<ArrowRight size={15} /></button></div>}
    </div>
  );
}
