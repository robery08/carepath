import { useState } from "react";
import { ArrowRight, LoaderCircle, Search } from "lucide-react";
import ReadAloudButton from "./ReadAloudButton";
import { searchMedlinePlusDrug, type MedlinePlusDrugResult } from "../medlineplusDrugSearch";

type Props = { question: string; language: "en" | "kn"; initialTerm?: string };
function extractName(question: string) {
  return question.trim()
    .replace(/^(?:what is|what's|tell me about|explain|purpose of|use of|medicine info for)\s+/i, "")
    .replace(/\s+(?:used for|use|purpose|for what|information|medicine information|tablet information).*$/i, "")
    .replace(/\s+(?:medicine|tablet|drug|capsule|pill)$/i, "")
    .replace(/[?!.]+$/g, "").trim().slice(0, 100);
}

export default function MedlinePlusLookup({ question, language, initialTerm }: Props) {
  const [term, setTerm] = useState(() => initialTerm ?? extractName(question));
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [results, setResults] = useState<MedlinePlusDrugResult[]>([]);

  const search = async () => {
    if (!consent) { setMessage(language === "en" ? "Please agree before sending the medicine name." : "ಔಷಧಿ ಹೆಸರನ್ನು ಕಳುಹಿಸುವ ಮೊದಲು ಒಪ್ಪಿಗೆ ನೀಡಿ."); return; }
    if (!term.trim() || /[\u0C80-\u0CFF]/u.test(term)) { setMessage(language === "en" ? "Type the medicine name in English as printed on the package." : "ಪ್ಯಾಕೆಟ್‌ನಲ್ಲಿರುವಂತೆ ಔಷಧಿಯ ಹೆಸರನ್ನು ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಬರೆಯಿರಿ."); return; }
    setLoading(true); setMessage(""); setResults([]);
    try {
      const found = await searchMedlinePlusDrug(term);
      setResults(found);
      if (!found.length) setMessage(language === "en" ? "No match came back. This does not mean the medicine is unavailable or unsafe. Try its generic name or check your country's regulator." : "ಹೊಂದಾಣಿಕೆ ಸಿಗಲಿಲ್ಲ. ಇದರಿಂದ ಔಷಧಿ ಲಭ್ಯವಿಲ್ಲ ಅಥವಾ ಸುರಕ್ಷಿತವಲ್ಲ ಎಂದರ್ಥವಲ್ಲ. ಜೆನೆರಿಕ್ ಹೆಸರು ಅಥವಾ ನಿಮ್ಮ ದೇಶದ ನಿಯಂತ್ರಕ ನೋಡಿ.");
    } catch {
      setMessage(language === "en" ? "MedlinePlus could not be reached. Check your internet connection and try again." : "MedlinePlus ಅನ್ನು ಸಂಪರ್ಕಿಸಲಾಗಲಿಲ್ಲ. ಇಂಟರ್ನೆಟ್ ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.");
    } finally { setLoading(false); }
  };

  return <div className="cp-official-search-choice cp-live-med-search">
    <strong>{language === "en" ? "Search official medicine information inside CARE CONNECTED" : "CARE CONNECTED ಒಳಗೆ ಅಧಿಕೃತ ಔಷಧಿ ಮಾಹಿತಿ ಹುಡುಕಿ"}</strong>
    <p>{language === "en" ? "MedlinePlus Connect can return general information for many medicine names. It is not a complete worldwide catalogue or a check of local approvals." : "MedlinePlus Connect ಅನೇಕ ಔಷಧಿ ಹೆಸರುಗಳಿಗೆ ಸಾಮಾನ್ಯ ಮಾಹಿತಿ ನೀಡಬಹುದು. ಇದು ವಿಶ್ವದ ಎಲ್ಲಾ ಔಷಧಿಗಳ ಪಟ್ಟಿ ಅಥವಾ ಸ್ಥಳೀಯ ಅನುಮೋದನೆ ಪರಿಶೀಲನೆ ಅಲ್ಲ."}</p>
    <label>{language === "en" ? "Medicine name to search" : "ಹುಡುಕಬೇಕಾದ ಔಷಧಿಯ ಹೆಸರು"}<input value={term} maxLength={100} onChange={(event) => { setTerm(event.target.value); setConsent(false); setResults([]); setMessage(""); }} /></label>
    <label className="cp-live-med-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>{language === "en" ? "I agree to send only this medicine name to U.S. NIH MedlinePlus. My saved medicines, allergies, profile, and the rest of my question are not included." : "ಈ ಔಷಧಿ ಹೆಸರನ್ನು ಮಾತ್ರ U.S. NIH MedlinePlus ಗೆ ಕಳುಹಿಸಲು ಒಪ್ಪುತ್ತೇನೆ. ಉಳಿಸಿದ ಔಷಧಿ, ಅಲರ್ಜಿ, ಪ್ರೊಫೈಲ್ ಅಥವಾ ಉಳಿದ ಪ್ರಶ್ನೆ ಕಳುಹಿಸುವುದಿಲ್ಲ."}</span></label>
    <button className="cp-button primary" type="button" onClick={search} disabled={loading}>{loading ? <LoaderCircle size={16} className="cp-spin" /> : <Search size={16} />}{language === "en" ? "Search MedlinePlus in this app" : "ಈ ಆಪ್‌ನಲ್ಲಿ MedlinePlus ಹುಡುಕಿ"}</button>
    {message && <p className="cp-ai-status" role="status">{message}</p>}
    {results.map((result) => <article className="cp-drug-result" key={result.url}><span className="cp-eyebrow">U.S. NIH MEDLINEPLUS · GENERAL INFORMATION</span><h3>{result.title}</h3>{result.summary && <><p>{result.summary}</p><ReadAloudButton text={result.title + ". " + result.summary} label="Listen to medicine information" /></>}<a href={result.url} target="_blank" rel="noreferrer">{language === "en" ? "Read complete medicine page" : "ಸಂಪೂರ್ಣ ಔಷಧಿ ಪುಟ ಓದಿ"}<ArrowRight size={14} /></a><small>{language === "en" ? "The live result is in English. Verify the package and local label with a pharmacist." : "ನೇರ ಮೂಲ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿದೆ. ಪ್ಯಾಕೆಟ್ ಮತ್ತು ಸ್ಥಳೀಯ ಲೇಬಲ್ ಅನ್ನು ಫಾರ್ಮಸಿಸ್ಟ್ ಜೊತೆ ಪರಿಶೀಲಿಸಿ."}</small></article>)}
  </div>;
}
