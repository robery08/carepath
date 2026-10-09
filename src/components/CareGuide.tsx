import { useState, type FormEvent } from "react";
import { Activity, ArrowRight, BookOpen, ExternalLink, HeartPulse, Languages, Pill, Search, ShieldCheck, Sparkles } from "lucide-react";

type Lang = "en" | "kn";
type Topic = { id: string; color: string; title: Record<Lang, string>; summary: Record<Lang, string>; keys: string[]; sections: Record<Lang, { title: string; points: string[] }[]>; source: string; url: string };
const topics: Topic[] = [
  {
    id: "diabetes", color: "mint", title: { en: "Diabetes & blood sugar", kn: "ಮಧುಮೇಹ ಮತ್ತು ರಕ್ತದ ಸಕ್ಕರೆ" }, summary: { en: "A steady routine and a plan made with your diabetes team can help with day-to-day care.", kn: "ಆರೈಕೆ ತಂಡದ ಯೋಜನೆ ಮತ್ತು ನಿಯಮಿತ ದಿನಚರಿ ದೈನಂದಿನ ಆರೈಕೆಗೆ ಸಹಾಯ ಮಾಡುತ್ತದೆ." }, keys: ["diabet", "sugar", "glucose", "ಮಧುಮೇಹ", "ಸಕ್ಕರೆ"],
    sections: {
      en: [{ title: "Everyday routine", points: ["Follow the food, activity, and monitoring plan agreed with your care team.", "Check blood sugar only as your own care plan recommends; timing and goals vary."] }, { title: "Medicines & check-ups", points: ["Use medicines exactly as prescribed. Do not stop or change them based on this guide.", "Keep appointments; ask about eye, kidney, foot, blood pressure, and cholesterol checks."] }, { title: "When to get help", points: ["Get urgent help for fainting, severe confusion, chest pain, or trouble breathing.", "Contact your team about a new foot wound, vision change, or repeated unusual readings."] }],
      kn: [{ title: "ದೈನಂದಿನ ದಿನಚರಿ", points: ["ಆಹಾರ, ಚಟುವಟಿಕೆ ಮತ್ತು ಪರೀಕ್ಷೆಗಳಿಗಾಗಿ ಆರೈಕೆ ತಂಡದ ಯೋಜನೆ ಅನುಸರಿಸಿ.", "ನಿಮ್ಮ ಯೋಜನೆ ಹೇಳಿದಾಗ ಮಾತ್ರ ಸಕ್ಕರೆ ಪರೀಕ್ಷಿಸಿ; ಸಮಯ ಮತ್ತು ಗುರಿಗಳು ವ್ಯಕ್ತಿಗತ."] }, { title: "ಔಷಧಿ ಮತ್ತು ತಪಾಸಣೆ", points: ["ಔಷಧಿಗಳನ್ನು ಸೂಚಿಸಿದಂತೆ ಬಳಸಿ. ಈ ಮಾರ್ಗದರ್ಶಿಯ ಆಧಾರದ ಮೇಲೆ ನಿಲ್ಲಿಸಬೇಡಿ ಅಥವಾ ಬದಲಿಸಬೇಡಿ.", "ನಿಯಮಿತ ಭೇಟಿ ಮಾಡಿ; ಕಣ್ಣು, ಮೂತ್ರಪಿಂಡ, ಪಾದ, ರಕ್ತದೊತ್ತಡ ಮತ್ತು ಕೊಲೆಸ್ಟ್ರಾಲ್ ತಪಾಸಣೆಗಳ ಬಗ್ಗೆ ಕೇಳಿ."] }, { title: "ಯಾವಾಗ ಸಹಾಯ ಪಡೆಯಬೇಕು", points: ["ಮೂರ್ಛೆ, ತೀವ್ರ ಗೊಂದಲ, ಎದೆನೋವು ಅಥವಾ ಉಸಿರಾಟದ ತೊಂದರೆ ಇದ್ದರೆ ತುರ್ತು ಸಹಾಯ ಪಡೆಯಿರಿ.", "ಪಾದದ ಹೊಸ ಗಾಯ, ದೃಷ್ಟಿ ಬದಲಾವಣೆ ಅಥವಾ ಮರುಮರು ಅಸಾಮಾನ್ಯ ಫಲಿತಾಂಶಗಳಿದ್ದರೆ ಆರೈಕೆ ತಂಡವನ್ನು ಸಂಪರ್ಕಿಸಿ."] }]
    },
    source: "WHO · Diabetes", url: "https://www.who.int/news-room/fact-sheets/detail/diabetes"
  },
  {
    id: "bp", color: "blue", title: { en: "High blood pressure", kn: "ಅಧಿಕ ರಕ್ತದೊತ್ತಡ" }, summary: { en: "It may have no noticeable symptoms; regular checks and follow-up matter.", kn: "ಸ್ಪಷ್ಟ ಲಕ್ಷಣಗಳೇ ಇರದಿರಬಹುದು; ನಿಯಮಿತ ಪರೀಕ್ಷೆ ಮತ್ತು ಮೇಲ್ವಿಚಾರಣೆ ಮುಖ್ಯ." }, keys: ["blood pressure", "hypertension", "pressure", " bp", "ರಕ್ತದೊತ್ತಡ", "ಬಿಪಿ"],
    sections: {
      en: [{ title: "Measure & record", points: ["Arrange checks with a health professional and note readings with date and context.", "Ask how to measure and when to follow up; one reading may not tell the whole story."] }, { title: "Daily care & medicines", points: ["Balanced lower-salt meals, activity, and avoiding tobacco can support heart health.", "Take prescribed medicines as directed. Ask before changing them, even if you feel well."] }, { title: "When to get help", points: ["A very high reading with chest pain, difficulty breathing, confusion, or vision changes needs urgent care.", "For fainting, severe weakness, or sudden stroke-like symptoms, contact local emergency services."] }],
      kn: [{ title: "ಅಳೆಯಿರಿ ಮತ್ತು ದಾಖಲಿಸಿ", points: ["ಆರೋಗ್ಯ ವೃತ್ತಿಪರರಿಂದ ಪರೀಕ್ಷಿಸಿ; ದಿನಾಂಕ ಮತ್ತು ಸಂದರ್ಭದೊಂದಿಗೆ ದಾಖಲಿಸಿ.", "ಹೇಗೆ ಅಳೆಯಬೇಕು ಮತ್ತು ಯಾವಾಗ ಮರುಪರಿಶೀಲಿಸಬೇಕು ಎಂದು ವೈದ್ಯರನ್ನು ಕೇಳಿ."] }, { title: "ದೈನಂದಿನ ಆರೈಕೆ ಮತ್ತು ಔಷಧಿ", points: ["ಕಡಿಮೆ ಉಪ್ಪಿನ ಸಮತೋಲನದ ಆಹಾರ, ಚಟುವಟಿಕೆ ಮತ್ತು ತಂಬಾಕು ತ್ಯಜಿಸುವುದು ಸಹಾಯಕ.", "ಸೂಚಿಸಿದ ಔಷಧಿಯನ್ನು ಹಾಗೆಯೇ ಬಳಸಿ. ಬದಲಿಸುವ ಮೊದಲು ವೈದ್ಯರನ್ನು ಕೇಳಿ."] }, { title: "ಯಾವಾಗ ಸಹಾಯ ಪಡೆಯಬೇಕು", points: ["ತುಂಬಾ ಅಧಿಕ ಫಲಿತಾಂಶದ ಜೊತೆ ಎದೆನೋವು, ಉಸಿರಾಟದ ತೊಂದರೆ ಅಥವಾ ದೃಷ್ಟಿ ಬದಲಾವಣೆ ಇದ್ದರೆ ತಕ್ಷಣ ಚಿಕಿತ್ಸೆ ಪಡೆಯಿರಿ.", "ಮೂರ್ಛೆ, ತೀವ್ರ ದೌರ್ಬಲ್ಯ ಅಥವಾ ಹಠಾತ್ ಪಾರ್ಶ್ವವಾಯು ಲಕ್ಷಣಗಳಿದ್ದರೆ ತುರ್ತು ಸೇವೆಗೆ ಕರೆಮಾಡಿ."] }]
    },
    source: "WHO · Hypertension", url: "https://www.who.int/en/news-room/fact-sheets/detail/hypertension"
  },
  {
    id: "cancer", color: "rose", title: { en: "Cancer treatment support", kn: "ಕ್ಯಾನ್ಸರ್ ಚಿಕಿತ್ಸೆಯ ಆರೈಕೆ" }, summary: { en: "Your oncology team’s instructions matter because risks differ by treatment.", kn: "ಚಿಕಿತ್ಸೆಯ ಪ್ರಕಾರ ಅಪಾಯ ಬದಲಾಗುತ್ತದೆ; ಆಂಕಾಲಜಿ ತಂಡದ ಸೂಚನೆ ಮುಖ್ಯ." }, keys: ["cancer", "chemo", "chemotherapy", "oncology", "ಕ್ಯಾನ್ಸರ್", "ಕಿಮೋ"],
    sections: {
      en: [{ title: "Keep your plan close", points: ["Save your oncology team’s daytime and after-hours contacts and written instructions.", "Keep a current treatment list; note symptoms and questions for visits."] }, { title: "Medicines & side effects", points: ["Ask your team or pharmacist before adding over-the-counter, herbal, or fever medicines.", "Do not stop or delay cancer treatment based on a general app guide."] }, { title: "Fever or infection signs", points: ["During treatment, 38°C / 100.5°F—or your team’s threshold—needs prompt contact with your oncology team.", "Follow their urgent-care instructions. Do not wait for an app response."] }],
      kn: [{ title: "ಚಿಕಿತ್ಸಾ ಯೋಜನೆ ಹತ್ತಿರದಲ್ಲಿಡಿ", points: ["ಆಂಕಾಲಜಿ ತಂಡದ ಸಂಪರ್ಕ ಸಂಖ್ಯೆ ಮತ್ತು ಲಿಖಿತ ಸೂಚನೆ ಉಳಿಸಿಕೊಳ್ಳಿ.", "ಚಿಕಿತ್ಸೆ ಮತ್ತು ಔಷಧಿಗಳ ಪಟ್ಟಿ ಇಡಿ; ಲಕ್ಷಣಗಳು ಮತ್ತು ಪ್ರಶ್ನೆಗಳನ್ನು ದಾಖಲಿಸಿ."] }, { title: "ಔಷಧಿ ಮತ್ತು ಅಡ್ಡಪರಿಣಾಮ", points: ["ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಇಲ್ಲದ ಅಥವಾ ಗಿಡಮೂಲಿಕೆ/ಜ್ವರದ ಔಷಧಿ ಸೇರಿಸುವ ಮೊದಲು ತಂಡ ಅಥವಾ ಔಷಧ ತಜ್ಞರನ್ನು ಕೇಳಿ.", "ಸಾಮಾನ್ಯ ಆಪ್ ಮಾರ್ಗದರ್ಶಿಯ ಆಧಾರದ ಮೇಲೆ ಚಿಕಿತ್ಸೆಯನ್ನು ನಿಲ್ಲಿಸಬೇಡಿ ಅಥವಾ ಮುಂದೂಡಬೇಡಿ."] }, { title: "ಜ್ವರ ಅಥವಾ ಸೋಂಕು", points: ["ಚಿಕಿತ್ಸೆಯ ಸಮಯದಲ್ಲಿ 38°C / 100.5°F ಅಥವಾ ನಿಮ್ಮ ತಂಡದ ಮಿತಿಗಿಂತ ಹೆಚ್ಚು ಜ್ವರ ಇದ್ದರೆ ತಂಡವನ್ನು ತಕ್ಷಣ ಸಂಪರ್ಕಿಸಿ.", "ಅವರ ತುರ್ತು ಸೂಚನೆ ಅನುಸರಿಸಿ. ಆಪ್ ಉತ್ತರಕ್ಕಾಗಿ ಕಾಯಬೇಡಿ."] }]
    },
    source: "NCI · Infection during cancer treatment", url: "https://www.cancer.gov/about-cancer/treatment/side-effects/infection"
  },
  {
    id: "medicines", color: "violet", title: { en: "Everyday medicine safety", kn: "ದೈನಂದಿನ ಔಷಧಿ ಸುರಕ್ಷತೆ" }, summary: { en: "Use the current label and professional advice; medicine use depends on the product and your health.", kn: "ಇತ್ತೀಚಿನ ಲೇಬಲ್ ಮತ್ತು ವೃತ್ತಿಪರರ ಸಲಹೆ ಅನುಸರಿಸಿ; ಬಳಕೆ ಉತ್ಪನ್ನ ಮತ್ತು ಆರೋಗ್ಯದ ಮೇಲೆ ಅವಲಂಬಿತ." }, keys: ["medicine", "medication", "tablet", "pill", "dose", "missed dose", "ಔಷಧಿ", "ಮಾತ್ರೆ", "ಗುಳಿ"],
    sections: {
      en: [{ title: "Keep one current list", points: ["Copy the exact name, strength, and instructions from the package or prescription.", "Include non-prescription medicines, vitamins, and herbal products; share the list at visits."] }, { title: "Use medicines safely", points: ["Take only medicines meant for you, exactly as current instructions say. Never share them.", "Ask a pharmacist before crushing a tablet or combining medicines and supplements."] }, { title: "If something is unclear", points: ["For a missed dose, side effect, or unclear label, check the leaflet or ask a pharmacist/prescriber.", "Do not double a dose, stop a regular medicine, or choose a new one based on this guide."] }],
      kn: [{ title: "ಒಂದು ನವೀಕೃತ ಪಟ್ಟಿ ಇಡಿ", points: ["ಪ್ಯಾಕೆಟ್‌ನಿಂದ ನಿಖರ ಹೆಸರು, ಬಲ ಮತ್ತು ಸೂಚನೆ ದಾಖಲಿಸಿ.", "ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಇಲ್ಲದ ಔಷಧಿ, ವಿಟಮಿನ್ ಮತ್ತು ಗಿಡಮೂಲಿಕೆ ಉತ್ಪನ್ನ ಸೇರಿಸಿ; ಭೇಟಿಯಲ್ಲಿ ಪಟ್ಟಿಯನ್ನು ತೋರಿಸಿ."] }, { title: "ಸುರಕ್ಷಿತವಾಗಿ ಬಳಸಿ", points: ["ನಿಮಗಾಗಿ ನೀಡಿದ ಔಷಧಿಯನ್ನು ಸೂಚನೆಯಂತೆ ಬಳಸಿ. ಹಂಚಿಕೊಳ್ಳಬೇಡಿ.", "ಮಾತ್ರೆ ಪುಡಿ ಮಾಡುವ ಅಥವಾ ಔಷಧಿ-ಪೂರಕಗಳನ್ನು ಜೊತೆಗೆ ಬಳಸುವ ಮೊದಲು ಔಷಧ ತಜ್ಞರನ್ನು ಕೇಳಿ."] }, { title: "ಸೂಚನೆ ಅರ್ಥವಾಗದಿದ್ದರೆ", points: ["ಮಾತ್ರೆ ತಪ್ಪಿದರೆ ಅಥವಾ ಅಡ್ಡಪರಿಣಾಮ ಇದ್ದರೆ ವಿವರ ಪತ್ರ ಓದಿ ಅಥವಾ ಔಷಧ ತಜ್ಞ/ವೈದ್ಯರನ್ನು ಕೇಳಿ.", "ಎರಡು ಪ್ರಮಾಣ ತೆಗೆದುಕೊಳ್ಳಬೇಡಿ, ಔಷಧಿ ನಿಲ್ಲಿಸಬೇಡಿ ಅಥವಾ ಹೊಸದನ್ನು ಆಯ್ಕೆಮಾಡಬೇಡಿ."] }]
    },
    source: "NHS · Medicines information", url: "https://www.nhs.uk/tests-and-treatments/medicines-information/"
  }
];

const copy = {
  en: { eyebrow: "CAREPATH CARE GUIDE", heading: "Clear health guidance, in your language", intro: "Ask a general question in English or Kannada. See a structured answer here with trusted sources to read more.", privacy: "Your question stays in this browser. This reviewed local guide works offline; it does not call Gemini or send your question to a server.", ask: "Show guide", prompt: "Try “How can I manage diabetes day to day?”", choose: "Explore a topic", noTitle: "I don’t have a reviewed guide for that question yet.", noText: "Try a topic below, or ask a pharmacist or your care team. This guide cannot safely answer every personal health question.", personalTitle: "This needs personal medical advice.", personalText: "CAREPATH cannot choose a medicine, dose, interaction, diagnosis, or treatment change. Contact your pharmacist, prescriber, or care team.", urgent: "Need urgent help?", urgentText: "For chest pain, trouble breathing, fainting, or sudden confusion, contact local emergency services now. During cancer treatment, follow your oncology team’s urgent instructions.", local: "Private · Works offline · Reviewed topics", question: "What would you like to understand?", source: "Trusted source" },
  kn: { eyebrow: "ಕೇರ್‌ಪಾತ್ ಆರೈಕೆ ಮಾರ್ಗದರ್ಶಿ", heading: "ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಸ್ಪಷ್ಟ ಆರೋಗ್ಯ ಮಾಹಿತಿ", intro: "ಸಾಮಾನ್ಯ ಪ್ರಶ್ನೆಯನ್ನು ಕನ್ನಡ ಅಥವಾ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಕೇಳಿ. ಉತ್ತರವನ್ನು ಇಲ್ಲಿಯೇ ವಿಭಾಗಗಳಾಗಿ ನೋಡಿ; ಇನ್ನಷ್ಟು ಓದಲು ವಿಶ್ವಾಸಾರ್ಹ ಮೂಲಗಳಿವೆ.", privacy: "ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಈ ಬ್ರೌಸರ್‌ನಲ್ಲೇ ಇರುತ್ತದೆ. ಪರಿಶೀಲಿತ ಸ್ಥಳೀಯ ಮಾರ್ಗದರ್ಶಿ ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ಕೆಲಸ ಮಾಡುತ್ತದೆ; Gemini ಅಥವಾ ಸರ್ವರ್ ಬಳಸುವುದಿಲ್ಲ.", ask: "ಮಾರ್ಗದರ್ಶಿ ತೋರಿಸಿ", prompt: "ಉದಾ: ಮಧುಮೇಹವನ್ನು ದಿನನಿತ್ಯ ಹೇಗೆ ನೋಡಿಕೊಳ್ಳುವುದು?", choose: "ವಿಷಯ ಆಯ್ಕೆಮಾಡಿ", noTitle: "ಈ ಪ್ರಶ್ನೆಗೆ ಪರಿಶೀಲಿತ ಮಾರ್ಗದರ್ಶಿ ಇನ್ನೂ ಇಲ್ಲ.", noText: "ಕೆಳಗಿನ ವಿಷಯ ಆಯ್ಕೆಮಾಡಿ ಅಥವಾ ಔಷಧ ತಜ್ಞ/ಆರೈಕೆ ತಂಡವನ್ನು ಕೇಳಿ. ವೈಯಕ್ತಿಕ ಆರೋಗ್ಯ ಪ್ರಶ್ನೆಗಳಿಗೆ ಇದು ಸುರಕ್ಷಿತ ಉತ್ತರ ನೀಡಲಾರದು.", personalTitle: "ಇದಕ್ಕೆ ವೈಯಕ್ತಿಕ ವೈದ್ಯಕೀಯ ಸಲಹೆ ಅಗತ್ಯ.", personalText: "CAREPATH ಔಷಧಿ, ಪ್ರಮಾಣ, ಪರಸ್ಪರ ಪರಿಣಾಮ, ರೋಗನಿರ್ಣಯ ಅಥವಾ ಚಿಕಿತ್ಸೆಯ ಬದಲಾವಣೆ ನಿರ್ಧರಿಸುವುದಿಲ್ಲ. ಔಷಧ ತಜ್ಞ, ವೈದ್ಯರು ಅಥವಾ ಆರೈಕೆ ತಂಡವನ್ನು ಸಂಪರ್ಕಿಸಿ.", urgent: "ತುರ್ತು ಸಹಾಯ ಬೇಕೇ?", urgentText: "ಎದೆನೋವು, ಉಸಿರಾಟದ ತೊಂದರೆ, ಮೂರ್ಛೆ ಅಥವಾ ಹಠಾತ್ ಗೊಂದಲವಿದ್ದರೆ ತುರ್ತು ಸೇವೆ ಸಂಪರ್ಕಿಸಿ. ಕ್ಯಾನ್ಸರ್ ಚಿಕಿತ್ಸೆಯಲ್ಲಿದ್ದರೆ ಆಂಕಾಲಜಿ ತಂಡದ ಸೂಚನೆ ಅನುಸರಿಸಿ.", local: "ಖಾಸಗಿ · ಆಫ್‌ಲೈನ್ · ಪರಿಶೀಲಿತ ವಿಷಯ", question: "ನೀವು ಏನು ತಿಳಿಯಲು ಬಯಸುತ್ತೀರಿ?", source: "ವಿಶ್ವಾಸಾರ್ಹ ಮೂಲ" }
};

function getSavedLanguage(): Lang {
  try { return localStorage.getItem("carepath_guide_language") === "kn" ? "kn" : "en"; } catch { return "en"; }
}
function matchTopic(q: string) {
  const normalized = q.toLocaleLowerCase();
  return topics.find((topic) => topic.keys.some((key) => normalized.includes(key)));
}
export default function CareGuide() {
  const [lang, setLang] = useState<Lang>(getSavedLanguage);
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<Topic | null>(null);
  const [unknown, setUnknown] = useState(false);
  const [personal, setPersonal] = useState(false);
  const t = copy[lang];
  const answer = (q: string) => {
    const found = matchTopic(q);
    setQuestion(q); setResult(found ?? null); setUnknown(!found);
    setPersonal(/\b(dose|dosage|how many|how much|stop|start|change|switch|interaction|safe for me|which medicine|what medicine|missed dose|my result|my reading|diagnos|cure)\b|ಪ್ರಮಾಣ|ನಿಲ್ಲಿಸ|ಬದಲಿಸ|ಯಾವ ಔಷಧ|ನನ್ನ ಫಲಿತಾಂಶ/i.test(q));
  };
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (question.trim()) answer(question.trim()); };
  const pick = (topic: Topic) => {
    const examples: Record<string, Record<Lang, string>> = {
      diabetes: { en: "How do I care for diabetes day to day?", kn: "ಮಧುಮೇಹವನ್ನು ದಿನನಿತ್ಯ ಹೇಗೆ ನೋಡಿಕೊಳ್ಳುವುದು?" },
      bp: { en: "What should I know about blood pressure?", kn: "ರಕ್ತದೊತ್ತಡದ ಬಗ್ಗೆ ಏನು ತಿಳಿಯಬೇಕು?" },
      cancer: { en: "How can I stay safer during cancer treatment?", kn: "ಕ್ಯಾನ್ಸರ್ ಚಿಕಿತ್ಸೆಯ ಸಮಯದಲ್ಲಿ ಸುರಕ್ಷಿತವಾಗಿರಲು ಏನು ಮಾಡಬೇಕು?" },
      medicines: { en: "How can I use daily medicines safely?", kn: "ದೈನಂದಿನ ಔಷಧಿಯನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಹೇಗೆ ಬಳಸಬೇಕು?" }
    };
    answer(examples[topic.id][lang]);
  };
  const changeLanguage = (next: Lang) => { setLang(next); try { localStorage.setItem("carepath_guide_language", next); } catch { /* Preference is optional. */ } };

  return <div className="cp-care-guide">
    <header className="cp-guide-hero"><div className="cp-guide-hero-copy"><span className="cp-guide-eyebrow"><Sparkles size={14} /> {t.eyebrow}</span><h1>{t.heading}</h1><p>{t.intro}</p><span className="cp-guide-local"><ShieldCheck size={15} /> {t.local}</span></div><div className="cp-guide-language"><Languages size={17} /><button type="button" className={lang === "en" ? "selected" : ""} aria-pressed={lang === "en"} onClick={() => changeLanguage("en")}>English</button><button type="button" className={lang === "kn" ? "selected" : ""} aria-pressed={lang === "kn"} onClick={() => changeLanguage("kn")}>ಕನ್ನಡ</button></div></header>
    <div className="cp-guide-layout"><section className="cp-guide-main">
      <form className="cp-guide-ask" onSubmit={submit}><label htmlFor="cp-guide-question">{t.question}</label><div className="cp-guide-input-row"><Search size={19} /><input id="cp-guide-question" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder={t.prompt} maxLength={280} /><button type="submit" disabled={!question.trim()}>{t.ask}<ArrowRight size={16} /></button></div></form>
      {result && <article className={"cp-guide-answer " + result.color} aria-live="polite"><div className="cp-guide-answer-heading"><span className="cp-guide-answer-icon">{result.id === "diabetes" ? <Activity size={21} /> : result.id === "medicines" ? <Pill size={21} /> : <HeartPulse size={21} />}</span><div><span className="cp-guide-answer-kicker">{t.choose}</span><h2>{result.title[lang]}</h2><p>{result.summary[lang]}</p></div></div><div className="cp-guide-slides">{result.sections[lang].map((section, i) => <section className="cp-guide-slide" key={section.title}><span className="cp-guide-slide-number">0{i + 1}</span><div><h3>{section.title}</h3><ul>{section.points.map((point) => <li key={point}>{point}</li>)}</ul></div></section>)}</div><a className="cp-guide-source" href={result.url} target="_blank" rel="noreferrer"><BookOpen size={15} /> {t.source}: {result.source} <ExternalLink size={13} /></a></article>}
      {unknown && <div className="cp-guide-feedback" role="status"><strong>{t.noTitle}</strong><p>{t.noText}</p></div>}
      {personal && <div className="cp-guide-caution" role="status"><strong>{t.personalTitle}</strong><p>{t.personalText}</p></div>}
      <div className="cp-guide-topic-picker"><div className="cp-guide-section-title"><span>{t.choose}</span><small>{lang === "en" ? "Tap a card to see a short, structured guide" : "ವಿಭಾಗಿತ ಮಾರ್ಗದರ್ಶಿಗಾಗಿ ಕಾರ್ಡ್ ಆಯ್ಕೆಮಾಡಿ"}</small></div><div className="cp-guide-topic-grid">{topics.map((item) => <button className={"cp-guide-topic " + item.color} type="button" key={item.id} onClick={() => pick(item)}><span className="cp-guide-topic-icon">{item.id === "diabetes" ? <Activity size={19} /> : item.id === "medicines" ? <Pill size={19} /> : <HeartPulse size={19} />}</span><span><strong>{item.title[lang]}</strong><small>{item.summary[lang]}</small></span><ArrowRight size={16} /></button>)}</div></div>
      <div className="cp-guide-privacy"><ShieldCheck size={16} /><p>{t.privacy}</p></div>
    </section><aside className="cp-guide-side">
      <div className="cp-guide-side-card cp-guide-urgent"><span><HeartPulse size={18} /></span><div><h2>{t.urgent}</h2><p>{t.urgentText}</p></div></div>
      <div className="cp-guide-side-card cp-guide-help"><span><Pill size={18} /></span><div><h2>{lang === "en" ? "Medicine use in daily life" : "ದೈನಂದಿನ ಜೀವನದಲ್ಲಿ ಔಷಧಿ ಬಳಕೆ"}</h2><p>{lang === "en" ? "Read the current label, keep one medicine list, include non-prescription products, and ask a pharmacist before adding or changing anything." : "ಪ್ರಸ್ತುತ ಲೇಬಲ್ ಓದಿ, ಔಷಧಿಗಳ ಪಟ್ಟಿ ಇಡಿ; ಬದಲಿಸುವ ಮೊದಲು ಔಷಧ ತಜ್ಞರನ್ನು ಕೇಳಿ."}</p></div></div>
      <button className="cp-guide-side-link" type="button" onClick={() => pick(topics[3])}><Pill size={17} />{lang === "en" ? "Open medicine safety guide" : "ಔಷಧಿ ಸುರಕ್ಷತಾ ಮಾರ್ಗದರ್ಶಿ ತೆರೆಯಿರಿ"}<ArrowRight size={15} /></button>
      <div className="cp-guide-side-note"><ShieldCheck size={16} /><span>{lang === "en" ? "General learning only. It cannot diagnose or make treatment decisions." : "ಸಾಮಾನ್ಯ ಮಾಹಿತಿ ಮಾತ್ರ. ರೋಗನಿರ್ಣಯ ಅಥವಾ ಚಿಕಿತ್ಸೆಯ ನಿರ್ಧಾರ ಮಾಡುವುದಿಲ್ಲ."}</span></div>
    </aside></div>
  </div>;
}


