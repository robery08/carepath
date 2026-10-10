export type VoiceLanguage = "en" | "kn";

const VOICE_LANGUAGE_KEY = "carepath_voice_language";
const VOICE_RATE_KEY = "carepath_voice_rate";

export function getVoiceLanguage(): VoiceLanguage {
  try {
    return localStorage.getItem(VOICE_LANGUAGE_KEY) === "kn" ? "kn" : "en";
  } catch {
    return "en";
  }
}

export function saveVoiceLanguage(language: VoiceLanguage) {
  try { localStorage.setItem(VOICE_LANGUAGE_KEY, language); } catch { /* Voice can still work for this visit. */ }
}

export function getVoiceRate() {
  try {
    const value = Number(localStorage.getItem(VOICE_RATE_KEY));
    return Number.isFinite(value) && value >= 0.65 && value <= 1.15 ? value : 0.9;
  } catch {
    return 0.9;
  }
}

export function saveVoiceRate(rate: number) {
  try { localStorage.setItem(VOICE_RATE_KEY, String(rate)); } catch { /* Voice can still work for this visit. */ }
}

function announceSpeech(active: boolean) {
  window.dispatchEvent(new CustomEvent("carepath:speech", { detail: { active } }));
}

export function stopReading() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  announceSpeech(false);
}

export function speakText(text: string, options: { rate?: number; language?: VoiceLanguage } = {}) {
  const cleaned = text.replace(/\s+/g, " ").trim().slice(0, 8000);
  if (!cleaned || !("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") return false;

  stopReading();
  const utterance = new SpeechSynthesisUtterance(cleaned);
  const language = options.language ?? getVoiceLanguage();
  utterance.lang = language === "kn" ? "kn-IN" : "en-IN";
  utterance.rate = options.rate ?? getVoiceRate();
  utterance.onstart = () => announceSpeech(true);
  utterance.onend = () => announceSpeech(false);
  utterance.onerror = () => announceSpeech(false);
  window.speechSynthesis.speak(utterance);
  return true;
}
