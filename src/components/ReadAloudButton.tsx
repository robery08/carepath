import { useEffect, useState } from "react";
import { Square, Volume2 } from "lucide-react";
import { speakText, stopReading } from "../voice";

type Props = {
  text: string | (() => string);
  label: string;
  className?: string;
};

export default function ReadAloudButton({ text, label, className = "" }: Props) {
  const [speaking, setSpeaking] = useState(false);
  const [message, setMessage] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    try { return localStorage.getItem("carepath_voice_support") !== "false"; } catch { return true; }
  });

  useEffect(() => {
    const update = (event: Event) => {
      const detail = (event as CustomEvent<{ active: boolean }>).detail;
      setSpeaking(Boolean(detail?.active));
    };
    window.addEventListener("carepath:speech", update);
    const updateSetting = () => {
      try { setVoiceEnabled(localStorage.getItem("carepath_voice_support") !== "false"); } catch { setVoiceEnabled(true); }
    };
    window.addEventListener("carepath:voice-setting", updateSetting);
    return () => { window.removeEventListener("carepath:speech", update); window.removeEventListener("carepath:voice-setting", updateSetting); };
  }, []);

  const toggle = () => {
    if (!voiceEnabled) { setMessage("Turn on Voice in the accessibility bar first."); return; }
    if (speaking) {
      stopReading();
      setMessage("");
      return;
    }
    const content = typeof text === "function" ? text() : text;
    if (!speakText(content)) setMessage("Read-aloud is not available in this browser.");
    else setMessage("");
  };

  return <span className={`cp-read-control ${className}`.trim()}>
    <button type="button" className="cp-read-button" onClick={toggle} aria-label={speaking ? "Stop reading" : label} title={speaking ? "Stop reading" : label} aria-pressed={speaking} disabled={!voiceEnabled}>
      {speaking ? <Square size={14} /> : <Volume2 size={15} />}
      <span>{speaking ? "Stop" : "Listen"}</span>
    </button>
    {message && <span className="cp-read-message" role="status">{message}</span>}
  </span>;
}
