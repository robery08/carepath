import { useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Captions,
  CirclePause,
  CirclePlay,
  Mic,
  Pill,
  ScanLine,
  ShieldCheck,
  Volume2,
  VolumeX,
} from "lucide-react";

type Language = "en" | "kn";

const tour = {
  en: [
    { title: "Start with Discover CAREPATH", caption: "Choose one clear action from the home screen. Your dashboard brings medicines, notes, and learning together.", script: "Welcome to CAREPATH. Start at Discover CAREPATH and choose one clear action. Your dashboard brings your medicines, notes, and learning together.", icon: <Activity size={36} />, tag: "YOUR HOME" },
    { title: "Search a medicine or health topic", caption: "Read short, structured guides and follow links to official sources. A medicine's general use does not tell you why it was prescribed to you.", script: "Search a generic medicine name or a health topic. Read the short points, then open the official source. General medicine information does not tell you why it was prescribed to you.", icon: <Pill size={36} />, tag: "LEARN SAFELY" },
    { title: "Scan, review, then save", caption: "Choose a document or image. Check every extracted word against the original before saving a note.", script: "Choose a report, prescription, or image in Scan and Upload. Check every extracted word against the original before saving a note. Text recognition can make mistakes.", icon: <ScanLine size={36} />, tag: "DOCUMENTS" },
    { title: "Use voice and simple controls", caption: "Turn voice support on or off. Read a section aloud, speak a note, and check the words before saving.", script: "Turn voice support on or off whenever you choose. Read a section aloud or speak a note, then check the words before saving. Voice support depends on your device and language settings.", icon: <Mic size={36} />, tag: "ACCESSIBILITY" },
    { title: "Keep your information under your control", caption: "This version saves personal notes in this browser. Export or delete them in Settings. For danger, call local emergency services.", script: "This version saves personal notes in this browser. You can export or delete them in Settings. CAREPATH does not replace a clinician or emergency service. If someone may be in immediate danger, call local emergency services.", icon: <ShieldCheck size={36} />, tag: "PRIVACY & HELP" },
  ],
  kn: [
    { title: "Discover CAREPATH ನಿಂದ ಪ್ರಾರಂಭಿಸಿ", caption: "ಮುಖಪುಟದಲ್ಲಿ ಒಂದು ಸ್ಪಷ್ಟ ಕೆಲಸ ಆಯ್ಕೆಮಾಡಿ. ಔಷಧಿ, ಟಿಪ್ಪಣಿ ಮತ್ತು ಕಲಿಕೆ ಒಂದೇ ಸ್ಥಳದಲ್ಲಿವೆ.", script: "CAREPATH ಗೆ ಸ್ವಾಗತ. Discover CAREPATH ನಲ್ಲಿ ಒಂದು ಕೆಲಸ ಆಯ್ಕೆಮಾಡಿ. ನಿಮ್ಮ ಔಷಧಿ, ಟಿಪ್ಪಣಿ ಮತ್ತು ಕಲಿಕೆ ಒಂದೇ ಸ್ಥಳದಲ್ಲಿವೆ.", icon: <Activity size={36} />, tag: "ನಿಮ್ಮ ಮುಖಪುಟ" },
    { title: "ಔಷಧಿ ಅಥವಾ ಆರೋಗ್ಯ ವಿಷಯ ಹುಡುಕಿ", caption: "ಚಿಕ್ಕ ಅಂಶಗಳನ್ನು ಓದಿ ಮತ್ತು ಅಧಿಕೃತ ಮೂಲಗಳನ್ನು ನೋಡಿ. ಔಷಧಿಯ ಸಾಮಾನ್ಯ ಬಳಕೆ ನಿಮಗೆ ಅದನ್ನು ಏಕೆ ನೀಡಲಾಗಿದೆ ಎಂಬುದನ್ನು ಹೇಳುವುದಿಲ್ಲ.", script: "ಸಾಮಾನ್ಯ ಔಷಧಿ ಹೆಸರು ಅಥವಾ ಆರೋಗ್ಯ ವಿಷಯ ಹುಡುಕಿ. ಚಿಕ್ಕ ಅಂಶಗಳನ್ನು ಓದಿ, ನಂತರ ಅಧಿಕೃತ ಮೂಲ ತೆರೆಯಿರಿ. ಔಷಧಿಯ ಸಾಮಾನ್ಯ ಮಾಹಿತಿ ನಿಮಗೆ ಅದನ್ನು ಏಕೆ ನೀಡಲಾಗಿದೆ ಎಂದು ಹೇಳುವುದಿಲ್ಲ.", icon: <Pill size={36} />, tag: "ಸುರಕ್ಷಿತವಾಗಿ ತಿಳಿಯಿರಿ" },
    { title: "ಸ್ಕ್ಯಾನ್ ಮಾಡಿ, ಪರಿಶೀಲಿಸಿ, ನಂತರ ಉಳಿಸಿ", caption: "ದಾಖಲೆ ಅಥವಾ ಚಿತ್ರ ಆಯ್ಕೆಮಾಡಿ. ಓದಿದ ಪ್ರತಿಯೊಂದು ಪದವನ್ನು ಮೂಲದೊಂದಿಗೆ ಹೋಲಿಸಿ ನಂತರ ಟಿಪ್ಪಣಿ ಉಳಿಸಿ.", script: "Scan and Upload ನಲ್ಲಿ ವರದಿ, ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಅಥವಾ ಚಿತ್ರ ಆಯ್ಕೆಮಾಡಿ. ಓದಿದ ಪ್ರತಿಯೊಂದು ಪದವನ್ನು ಮೂಲದೊಂದಿಗೆ ಪರಿಶೀಲಿಸಿ ನಂತರ ಟಿಪ್ಪಣಿ ಉಳಿಸಿ. ಪಠ್ಯ ಗುರುತಿಸುವಿಕೆ ತಪ್ಪಾಗಬಹುದು.", icon: <ScanLine size={36} />, tag: "ದಾಖಲೆಗಳು" },
    { title: "ಧ್ವನಿ ಮತ್ತು ಸರಳ ನಿಯಂತ್ರಣ ಬಳಸಿ", caption: "ಧ್ವನಿ ಸಹಾಯವನ್ನು ಆನ್ ಅಥವಾ ಆಫ್ ಮಾಡಿ. ಭಾಗವನ್ನು ಕೇಳಿ, ಟಿಪ್ಪಣಿ ಹೇಳಿ, ಉಳಿಸುವ ಮೊದಲು ಪದಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.", script: "ನಿಮಗೆ ಬೇಕಾದಾಗ ಧ್ವನಿ ಸಹಾಯ ಆನ್ ಅಥವಾ ಆಫ್ ಮಾಡಿ. ಭಾಗವನ್ನು ಕೇಳಿ ಅಥವಾ ಟಿಪ್ಪಣಿ ಹೇಳಿ, ನಂತರ ಉಳಿಸುವ ಮೊದಲು ಪದಗಳನ್ನು ಪರಿಶೀಲಿಸಿ. ಧ್ವನಿ ಸಾಧನ ಮತ್ತು ಭಾಷೆಯ ಮೇಲೆ ಅವಲಂಬಿತ.", icon: <Mic size={36} />, tag: "ಸುಲಭ ಬಳಕೆ" },
    { title: "ನಿಮ್ಮ ಮಾಹಿತಿಯ ನಿಯಂತ್ರಣ ನಿಮ್ಮಲ್ಲಿರಲಿ", caption: "ಈ ಆವೃತ್ತಿ ವೈಯಕ್ತಿಕ ಟಿಪ್ಪಣಿಗಳನ್ನು ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಉಳಿಸುತ್ತದೆ. ಅಪಾಯವಿದ್ದರೆ ಸ್ಥಳೀಯ ತುರ್ತು ಸೇವೆಗೆ ಕರೆ ಮಾಡಿ.", script: "ಈ ಆವೃತ್ತಿ ವೈಯಕ್ತಿಕ ಟಿಪ್ಪಣಿಗಳನ್ನು ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಉಳಿಸುತ್ತದೆ. ಸೆಟ್ಟಿಂಗ್ಸ್‌ನಲ್ಲಿ ಅವುಗಳನ್ನು ರಫ್ತು ಅಥವಾ ಅಳಿಸಬಹುದು. CAREPATH ವೈದ್ಯರು ಅಥವಾ ತುರ್ತು ಸೇವೆಗೆ ಬದಲಿಯಲ್ಲ. ತಕ್ಷಣದ ಅಪಾಯವಿದ್ದರೆ ಸ್ಥಳೀಯ ತುರ್ತು ಸೇವೆಗೆ ಕರೆ ಮಾಡಿ.", icon: <ShieldCheck size={36} />, tag: "ಗೌಪ್ಯತೆ ಮತ್ತು ಸಹಾಯ" },
  ],
} as const;

export default function QuickTour() {
  const [language, setLanguage] = useState<Language>("en");
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [narration, setNarration] = useState(false);
  const [captions, setCaptions] = useState(true);
  const slides = tour[language];
  const current = slides[index];

  useEffect(() => {
    if (!playing) return;
    let timer = 0;
    let advanced = false;
    const advance = () => {
      if (advanced) return;
      advanced = true;
      if (index < slides.length - 1) setIndex((value) => value + 1);
      else setPlaying(false);
    };
    const canSpeak = narration && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
    if (canSpeak) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(current.script);
      utterance.lang = language === "kn" ? "kn-IN" : "en-IN";
      utterance.rate = 0.9;
      utterance.onend = advance;
      utterance.onerror = advance;
      window.speechSynthesis.speak(utterance);
      timer = window.setTimeout(advance, 24000);
    } else {
      timer = window.setTimeout(advance, 6500);
    }
    return () => {
      window.clearTimeout(timer);
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, [current.script, index, language, narration, playing, slides.length]);

  const step = (delta: number) => {
    setIndex((value) => Math.max(0, Math.min(slides.length - 1, value + delta)));
    setPlaying(false);
  };

  return <section className="cp-tour" aria-labelledby="cp-tour-title">
    <div className="cp-tour-heading"><div><span className="cp-eyebrow">A SHORT GUIDED WALKTHROUGH</span><h2 id="cp-tour-title">See how CAREPATH works</h2><p>Watch the steps, read captions, or turn on narration. The text transcript is below.</p></div><div className="cp-tour-language" role="group" aria-label="Tour language"><button className={language === "en" ? "selected" : ""} aria-pressed={language === "en"} onClick={() => { setPlaying(false); setIndex(0); setLanguage("en"); }}>English</button><button className={language === "kn" ? "selected" : ""} aria-pressed={language === "kn"} onClick={() => { setPlaying(false); setIndex(0); setLanguage("kn"); }}>ಕನ್ನಡ</button></div></div>
    <div className="cp-tour-player">
      <div className={`cp-tour-screen scene-${index + 1}`} aria-live="polite"><div className="cp-tour-scene-orb">{current.icon}</div><span className="cp-tour-scene-tag">{current.tag}</span><h3>{current.title}</h3>{captions && <p className="cp-tour-caption">{current.caption}</p>}<span className="cp-tour-frame">0{index + 1} <i>/</i> 0{slides.length}</span></div>
      <div className="cp-tour-controls"><div className="cp-tour-buttons"><button onClick={() => step(-1)} disabled={index === 0} aria-label="Previous tour step"><ArrowLeft size={17} /></button><button className="cp-tour-play" onClick={() => setPlaying((value) => !value)} aria-label={playing ? "Pause the tour" : "Play the tour"}>{playing ? <CirclePause size={20} /> : <CirclePlay size={20} />}{playing ? "Pause" : index === slides.length - 1 ? "Replay tour" : "Play tour"}</button><button onClick={() => step(1)} disabled={index === slides.length - 1} aria-label="Next tour step"><ArrowRight size={17} /></button></div><div className="cp-tour-options"><button className={narration ? "selected" : ""} aria-pressed={narration} onClick={() => setNarration((value) => !value)}>{narration ? <Volume2 size={15} /> : <VolumeX size={15} />} Narration {narration ? "on" : "off"}</button><button className={captions ? "selected" : ""} aria-pressed={captions} onClick={() => setCaptions((value) => !value)}><Captions size={16} /> Captions {captions ? "on" : "off"}</button></div></div>
      <div className="cp-tour-progress" role="progressbar" aria-label="Tour progress" aria-valuemin={1} aria-valuemax={slides.length} aria-valuenow={index + 1}><span style={{ width: `${((index + 1) / slides.length) * 100}%` }} /></div>
    </div>
    <details className="cp-tour-transcript"><summary><BookOpen size={16} /> Read the full tour transcript</summary><ol>{slides.map((slide, itemIndex) => <li key={slide.title}><strong>{itemIndex + 1}. {slide.title}</strong><p>{slide.caption}</p></li>)}</ol><small><Mic size={13} /> Narration uses your browser’s built-in text-to-speech, when available. No AI video or AI medical response is generated here.</small></details>
  </section>;
}
