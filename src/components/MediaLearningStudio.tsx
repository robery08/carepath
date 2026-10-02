import { useEffect, useMemo, useRef, useState } from "react";
import { Captions, FileAudio, FileVideo, Info, Search, ShieldCheck, Trash2, Upload } from "lucide-react";
import type { ChangeEvent, FormEvent } from "react";
import ReadAloudButton from "./ReadAloudButton";

type Language = "en" | "kn";
type Cue = { text: string; start?: number };
type LocalMedia = { url: string; name: string; audio: boolean };

const copy = {
  en: {
    eyebrow: "LEARN WITH YOUR OWN MEDIA",
    title: "Play a health video or audio. Find the useful moment.",
    intro: "Choose a short clip stored on this device, then add its captions or transcript. CARE CONNECTED can find matching lines for you.",
    private: "Stays on this device",
    pick: "Choose video or audio",
    empty: "Your clip will play here",
    supported: "Video or audio · up to 80 MB",
    mediaSelected: "Selected on this device",
    remove: "Remove clip",
    captionTitle: "Add captions or transcript",
    captionCopy: "Paste text, one caption per line, or choose a WebVTT (.vtt) captions file.",
    captionPlaceholder: "Paste captions or transcript here…",
    captionFile: "Choose .vtt captions",
    clear: "Clear text",
    questionTitle: "What are you looking for?",
    questionPlaceholder: "For example: What does it say about blood pressure?",
    ask: "Find in captions",
    resultTitle: "Matching caption lines",
    noMedia: "You can paste a transcript even when you do not have the original clip.",
    noCaptions: "Add captions or a transcript before asking.",
    noMatches: "I could not find those words in the captions. Try a shorter phrase from the video.",
    matches: "I found caption lines that match your words.",
    localNote: "This searches only the captions or transcript you provide. It does not watch or listen to the clip, verify health claims, make an AI answer, or give medical advice. Check health guidance with a qualified professional.",
    seek: "Play this moment",
  },
  kn: {
    eyebrow: "ನಿಮ್ಮ ಮಾಧ್ಯಮದೊಂದಿಗೆ ಕಲಿಯಿರಿ",
    title: "ಆರೋಗ್ಯ ವೀಡಿಯೊ ಅಥವಾ ಧ್ವನಿಯನ್ನು ಪ್ಲೇ ಮಾಡಿ. ಬೇಕಾದ ಭಾಗವನ್ನು ಹುಡುಕಿ.",
    intro: "ಈ ಸಾಧನದಲ್ಲಿರುವ ಚಿಕ್ಕ ಕ್ಲಿಪ್ ಆಯ್ಕೆಮಾಡಿ, ನಂತರ ಅದರ ಉಪಶೀರ್ಷಿಕೆ ಅಥವಾ ಪಠ್ಯವನ್ನು ಸೇರಿಸಿ. CARE CONNECTED ಹೊಂದುವ ಸಾಲುಗಳನ್ನು ಹುಡುಕುತ್ತದೆ.",
    private: "ಈ ಸಾಧನದಲ್ಲೇ ಇರುತ್ತದೆ",
    pick: "ವೀಡಿಯೊ ಅಥವಾ ಧ್ವನಿ ಆಯ್ಕೆ",
    empty: "ನಿಮ್ಮ ಕ್ಲಿಪ್ ಇಲ್ಲಿ ಪ್ಲೇ ಆಗುತ್ತದೆ",
    supported: "ವೀಡಿಯೊ ಅಥವಾ ಧ್ವನಿ · 80 MB ವರೆಗೆ",
    mediaSelected: "ಈ ಸಾಧನದಲ್ಲಿ ಆಯ್ಕೆಮಾಡಲಾಗಿದೆ",
    remove: "ಕ್ಲಿಪ್ ತೆಗೆದುಹಾಕಿ",
    captionTitle: "ಉಪಶೀರ್ಷಿಕೆ ಅಥವಾ ಪಠ್ಯ ಸೇರಿಸಿ",
    captionCopy: "ಪಠ್ಯವನ್ನು ಪ್ರತಿ ಸಾಲಿಗೆ ಒಂದು ಉಪಶೀರ್ಷಿಕೆಯಂತೆ ಅಂಟಿಸಿ ಅಥವಾ WebVTT (.vtt) ಕಡತ ಆಯ್ಕೆಮಾಡಿ.",
    captionPlaceholder: "ಉಪಶೀರ್ಷಿಕೆ ಅಥವಾ ಪಠ್ಯವನ್ನು ಇಲ್ಲಿ ಅಂಟಿಸಿ…",
    captionFile: ".vtt ಉಪಶೀರ್ಷಿಕೆ ಆಯ್ಕೆ",
    clear: "ಪಠ್ಯ ಅಳಿಸಿ",
    questionTitle: "ನೀವು ಏನು ಹುಡುಕುತ್ತಿದ್ದೀರಿ?",
    questionPlaceholder: "ಉದಾಹರಣೆ: ರಕ್ತದೊತ್ತಡದ ಬಗ್ಗೆ ಏನು ಹೇಳುತ್ತದೆ?",
    ask: "ಉಪಶೀರ್ಷಿಕೆಗಳಲ್ಲಿ ಹುಡುಕಿ",
    resultTitle: "ಹೊಂದುವ ಉಪಶೀರ್ಷಿಕೆ ಸಾಲುಗಳು",
    noMedia: "ಮೂಲ ಕ್ಲಿಪ್ ಇಲ್ಲದಿದ್ದರೂ ಪಠ್ಯವನ್ನು ಅಂಟಿಸಿ ಹುಡುಕಬಹುದು.",
    noCaptions: "ಪ್ರಶ್ನಿಸುವ ಮೊದಲು ಉಪಶೀರ್ಷಿಕೆ ಅಥವಾ ಪಠ್ಯ ಸೇರಿಸಿ.",
    noMatches: "ಆ ಪದಗಳು ಉಪಶೀರ್ಷಿಕೆಯಲ್ಲಿ ಸಿಗಲಿಲ್ಲ. ವೀಡಿಯೊದಲ್ಲಿರುವ ಚಿಕ್ಕ ಪದ ಅಥವಾ ವಾಕ್ಯ ಪ್ರಯತ್ನಿಸಿ.",
    matches: "ನಿಮ್ಮ ಪದಗಳಿಗೆ ಹೊಂದುವ ಉಪಶೀರ್ಷಿಕೆ ಸಾಲುಗಳು ಸಿಕ್ಕಿವೆ.",
    localNote: "ನೀವು ನೀಡಿದ ಉಪಶೀರ್ಷಿಕೆ ಅಥವಾ ಪಠ್ಯದಲ್ಲಷ್ಟೇ ಹುಡುಕುತ್ತದೆ. ಕ್ಲಿಪ್‌ನ್ನು ನೋಡುವುದಿಲ್ಲ ಅಥವಾ ಕೇಳುವುದಿಲ್ಲ, ಆರೋಗ್ಯದ ಹೇಳಿಕೆಗಳನ್ನು ಪರಿಶೀಲಿಸುವುದಿಲ್ಲ, AI ಉತ್ತರ ಅಥವಾ ವೈದ್ಯಕೀಯ ಸಲಹೆ ನೀಡುವುದಿಲ್ಲ. ಆರೋಗ್ಯದ ಸಲಹೆಯನ್ನು ಅರ್ಹ ವೃತ್ತಿಪರರೊಂದಿಗೆ ಪರಿಶೀಲಿಸಿ.",
    seek: "ಈ ಕ್ಷಣ ಪ್ಲೇ ಮಾಡಿ",
  },
} as const;

function parseSeconds(value: string): number | undefined {
  const normalized = value.trim().replace(",", ".");
  const [clock, fraction = "0"] = normalized.split(".");
  const parts = clock.split(":").map(Number);
  if (!parts.length || parts.some((part) => !Number.isFinite(part))) return undefined;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2] + Number("0." + fraction);
  if (parts.length === 2) return parts[0] * 60 + parts[1] + Number("0." + fraction);
  return undefined;
}

function parseTranscript(value: string): Cue[] {
  const normalized = value.replace(/^\uFEFF/, "").trim();
  if (!normalized) return [];
  if (normalized.includes("-->")) {
    return normalized.split(/\r?\n\s*\r?\n/).flatMap((block) => {
      const lines = block.split(/\r?\n/);
      const timeIndex = lines.findIndex((line) => line.includes("-->"));
      if (timeIndex < 0) return [];
      const start = parseSeconds(lines[timeIndex].split("-->")[0]);
      const text = lines.slice(timeIndex + 1).join(" ").replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").trim();
      return text ? [{ text, start }] : [];
    });
  }
  return normalized.split(/\r?\n+/).map((line) => line.trim()).filter(Boolean).map((text) => ({ text }));
}

function formatTime(seconds: number) {
  const whole = Math.floor(seconds);
  return String(Math.floor(whole / 60)).padStart(2, "0") + ":" + String(whole % 60).padStart(2, "0");
}

function searchable(value: string) {
  return value.toLocaleLowerCase().normalize("NFC").replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
}

function matchingCues(cues: Cue[], question: string) {
  const ignored = new Set(["what", "where", "when", "why", "how", "this", "that", "about", "tell", "show", "me", "does", "do", "can", "could", "should", "the", "a", "an", "and", "or", "is", "are", "in", "on", "to", "for", "of", "it", "with", "from", "my", "you", "your"]);
  const questionTerms = searchable(question).filter((term) => !ignored.has(term) && term.length > 1);
  const terms = questionTerms.length ? questionTerms : searchable(question);
  return cues.map((cue, index) => {
    const cueWords = searchable(cue.text);
    const score = terms.reduce((sum, term) => sum + (cueWords.includes(term) ? 1 : 0), 0);
    return { cue, index, score };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score || a.index - b.index).slice(0, 4).map((item) => item.cue);
}

export default function MediaLearningStudio({ language }: { language: Language }) {
  const text = copy[language];
  const [media, setMedia] = useState<LocalMedia | null>(null);
  const [transcript, setTranscript] = useState("");
  const [question, setQuestion] = useState("");
  const [matches, setMatches] = useState<Cue[]>([]);
  const [message, setMessage] = useState("");
  const playerRef = useRef<HTMLMediaElement>(null);
  const captionsRef = useRef<HTMLInputElement>(null);
  const cues = useMemo(() => parseTranscript(transcript), [transcript]);

  useEffect(() => () => {
    if (media?.url) URL.revokeObjectURL(media.url);
  }, [media?.url]);

  const chooseMedia = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 80 * 1024 * 1024) { setMessage(language === "en" ? "Choose a clip smaller than 80 MB so it stays responsive on this device." : "ಈ ಸಾಧನದಲ್ಲಿ ಸುಗಮವಾಗಿ ಬಳಸಲು 80 MB ಗಿಂತ ಕಡಿಮೆ ಗಾತ್ರದ ಕ್ಲಿಪ್ ಆಯ್ಕೆಮಾಡಿ."); return; }
    const audio = file.type.startsWith("audio/") || /\.(mp3|wav|m4a|aac|oga|ogg)$/i.test(file.name);
    const video = file.type.startsWith("video/") || /\.(mp4|webm|mov|ogv)$/i.test(file.name);
    if (!audio && !video) { setMessage(language === "en" ? "Choose a video or audio file supported by your browser." : "ನಿಮ್ಮ ಬ್ರೌಸರ್ ಬೆಂಬಲಿಸುವ ವೀಡಿಯೊ ಅಥವಾ ಧ್ವನಿ ಕಡತ ಆಯ್ಕೆಮಾಡಿ."); return; }
    setMedia({ url: URL.createObjectURL(file), name: file.name, audio });
    setMessage(text.mediaSelected);
  };

  const chooseCaptions = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      setTranscript(await file.text());
      setMatches([]);
      setMessage(language === "en" ? "Captions are ready to search. Review the words against the clip." : "ಉಪಶೀರ್ಷಿಕೆಗಳು ಹುಡುಕಲು ಸಿದ್ಧ. ಕ್ಲಿಪ್‌ನೊಂದಿಗೆ ಪದಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.");
    } catch {
      setMessage(language === "en" ? "This captions file could not be read. Paste the transcript instead." : "ಈ ಉಪಶೀರ್ಷಿಕೆ ಕಡತ ಓದಲಾಗಲಿಲ್ಲ. ಬದಲಾಗಿ ಪಠ್ಯವನ್ನು ಅಂಟಿಸಿ.");
    }
  };

  const ask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMatches([]);
    if (!question.trim()) { setMessage(language === "en" ? "Type a word or question to search." : "ಹುಡುಕಲು ಪದ ಅಥವಾ ಪ್ರಶ್ನೆ ಟೈಪ್ ಮಾಡಿ."); return; }
    if (!cues.length) { setMessage(text.noCaptions); return; }
    const found = matchingCues(cues, question);
    setMatches(found);
    setMessage(found.length ? text.matches : text.noMatches);
  };

  const seekTo = (cue: Cue) => {
    if (cue.start === undefined || !playerRef.current) return;
    playerRef.current.currentTime = cue.start;
    void playerRef.current.play().catch(() => undefined);
  };

  return <section className="cp-media-studio" aria-labelledby="cp-media-title">
    <div className="cp-media-heading">
      <div><span className="cp-eyebrow">{text.eyebrow}</span><h2 id="cp-media-title">{text.title}</h2><p>{text.intro}</p></div>
      <span className="cp-media-private"><ShieldCheck size={15} />{text.private}</span>
    </div>
    <div className="cp-media-grid">
      <div className="cp-media-player">
        {media ? <div className="cp-media-selected">
          {media.audio ? <div className="cp-media-audio-art"><FileAudio size={46} /><span>{media.name}</span><audio ref={(element) => { playerRef.current = element; }} controls src={media.url} /></div> : <video ref={(element) => { playerRef.current = element; }} controls playsInline src={media.url} aria-label={media.name} />}
          <div className="cp-media-selected-row"><span><span className="cp-media-dot" />{text.mediaSelected} · {media.name}</span><button type="button" onClick={() => { playerRef.current?.pause(); setMedia(null); }} aria-label={text.remove}><Trash2 size={15} />{text.remove}</button></div>
        </div> : <div className="cp-media-empty">
          <span className="cp-media-empty-icon"><FileVideo size={30} /></span><strong>{text.empty}</strong><small>{text.noMedia}</small>
          <label className="cp-media-file-button"><Upload size={16} />{text.pick}<input type="file" accept="video/*,audio/*,.mp4,.webm,.mov,.mp3,.wav,.m4a,.ogg" onChange={chooseMedia} aria-label={text.pick} /></label><span className="cp-media-file-hint">{text.supported}</span>
        </div>}
      </div>
      <div className="cp-media-captions">
        <div className="cp-media-captions-head"><div><span className="cp-media-small-icon"><Captions size={17} /></span><div><strong>{text.captionTitle}</strong><small>{text.captionCopy}</small></div></div>
          <label className="cp-media-vtt-button"><Upload size={14} />{text.captionFile}<input ref={captionsRef} type="file" accept=".vtt,text/vtt" onChange={chooseCaptions} /></label>
        </div>
        <textarea value={transcript} onChange={(event) => { setTranscript(event.target.value); setMatches([]); }} rows={5} placeholder={text.captionPlaceholder} aria-label={text.captionTitle} />
        {transcript && <div className="cp-media-caption-meta"><span>{cues.length} {language === "en" ? "caption lines ready" : "ಉಪಶೀರ್ಷಿಕೆ ಸಾಲುಗಳು ಸಿದ್ಧ"}</span><button type="button" onClick={() => { setTranscript(""); setMatches([]); setMessage(""); }}>{text.clear}</button></div>}
      </div>
    </div>
    <form className="cp-media-question" onSubmit={ask}>
      <label htmlFor="cp-media-question">{text.questionTitle}</label>
      <div><input id="cp-media-question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={text.questionPlaceholder} /><button className="cp-button primary" type="submit"><Search size={16} />{text.ask}</button></div>
      {message && <p className="cp-media-status" role="status">{message}</p>}
    </form>
    {matches.length > 0 && <div className="cp-media-results"><div className="cp-media-results-head"><h3>{text.resultTitle}</h3><ReadAloudButton text={matches.map((cue) => cue.text).join(". ")} label={language === "en" ? "Listen to caption matches" : "ಉಪಶೀರ್ಷಿಕೆಗಳನ್ನು ಕೇಳಿ"} language={language} /></div><ol>{matches.map((cue, index) => <li key={String(cue.start) + cue.text + index}><p>{cue.text}</p>{cue.start !== undefined && <button type="button" onClick={() => seekTo(cue)}><span>{formatTime(cue.start)}</span> {text.seek}</button>}</li>)}</ol></div>}
    <p className="cp-media-safety"><Info size={16} />{text.localNote}</p>
  </section>;
}
