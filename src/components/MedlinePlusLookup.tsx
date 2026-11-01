import { useState } from "react";
import { ArrowRight, ExternalLink, FileSearch, LoaderCircle, Search, ShieldAlert } from "lucide-react";
import ReadAloudButton from "./ReadAloudButton";
import { searchMedlinePlusDrug, type MedlinePlusDrugResult } from "../medlineplusDrugSearch";
import { fdaLabelUrl, searchFdaDrugLabels, type FdaDrugLabel } from "../fdaDrugLabelSearch";

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
  const [loadingSource, setLoadingSource] = useState<"medlineplus" | "fda" | null>(null);
  const [message, setMessage] = useState("");
  const [results, setResults] = useState<MedlinePlusDrugResult[]>([]);
  const [fdaResults, setFdaResults] = useState<FdaDrugLabel[]>([]);
  const [selectedLabelId, setSelectedLabelId] = useState("");

  const search = async () => {
    if (!consent) { setMessage(language === "en" ? "Please agree before sending the medicine name." : "ಔಷಧಿ ಹೆಸರನ್ನು ಕಳುಹಿಸುವ ಮೊದಲು ಒಪ್ಪಿಗೆ ನೀಡಿ."); return; }
    if (!term.trim() || /[\u0C80-\u0CFF]/u.test(term)) { setMessage(language === "en" ? "Type the medicine name in English as printed on the package." : "ಪ್ಯಾಕೆಟ್‌ನಲ್ಲಿರುವಂತೆ ಔಷಧಿಯ ಹೆಸರನ್ನು ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಬರೆಯಿರಿ."); return; }
    setLoading(true); setLoadingSource("medlineplus"); setMessage(""); setResults([]);
    try {
      const found = await searchMedlinePlusDrug(term);
      setResults(found);
      if (!found.length) setMessage(language === "en" ? "No match came back. This does not mean the medicine is unavailable or unsafe. Try its generic name or check your country's regulator." : "ಹೊಂದಾಣಿಕೆ ಸಿಗಲಿಲ್ಲ. ಇದರಿಂದ ಔಷಧಿ ಲಭ್ಯವಿಲ್ಲ ಅಥವಾ ಸುರಕ್ಷಿತವಲ್ಲ ಎಂದರ್ಥವಲ್ಲ. ಜೆನೆರಿಕ್ ಹೆಸರು ಅಥವಾ ನಿಮ್ಮ ದೇಶದ ನಿಯಂತ್ರಕ ನೋಡಿ.");
    } catch {
      setMessage(language === "en" ? "MedlinePlus could not be reached. Check your internet connection and try again." : "MedlinePlus ಅನ್ನು ಸಂಪರ್ಕಿಸಲಾಗಲಿಲ್ಲ. ಇಂಟರ್ನೆಟ್ ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.");
    } finally { setLoading(false); setLoadingSource(null); }
  };

  const searchLabels = async () => {
    if (!consent) { setMessage(language === "en" ? "Please agree before sending the medicine name." : "ಔಷಧಿ ಹೆಸರನ್ನು ಕಳುಹಿಸುವ ಮೊದಲು ಒಪ್ಪಿಗೆ ನೀಡಿ."); return; }
    if (!term.trim() || /[\u0C80-\u0CFF]/u.test(term)) { setMessage(language === "en" ? "Type the medicine name in English as printed on the package." : "ಪ್ಯಾಕೆಟ್‌ನಲ್ಲಿರುವಂತೆ ಔಷಧಿಯ ಹೆಸರನ್ನು ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಬರೆಯಿರಿ."); return; }
    setLoading(true); setLoadingSource("fda"); setMessage(""); setFdaResults([]); setSelectedLabelId("");
    try {
      const found = await searchFdaDrugLabels(term);
      setFdaResults(found);
      setSelectedLabelId(found[0]?.id ?? "");
      if (!found.length) setMessage(language === "en" ? "No U.S. submitted product label matched. This is not a worldwide medicine catalogue and a missing result says nothing about safety or local availability." : "U.S. ಸಲ್ಲಿಸಿದ ಉತ್ಪನ್ನ ಲೇಬಲ್ ಹೊಂದಿಕೆಯಾಗಲಿಲ್ಲ. ಇದು ವಿಶ್ವದ ಎಲ್ಲಾ ಔಷಧಿಗಳ ಪಟ್ಟಿ ಅಲ್ಲ; ಫಲಿತಾಂಶ ಇಲ್ಲದಿರುವುದು ಸುರಕ್ಷತೆ ಅಥವಾ ಸ್ಥಳೀಯ ಲಭ್ಯತೆಯನ್ನು ಸೂಚಿಸುವುದಿಲ್ಲ.");
    } catch {
      setMessage(language === "en" ? "The FDA label service could not be reached. Check your connection and try again." : "FDA ಲೇಬಲ್ ಸೇವೆಯನ್ನು ಸಂಪರ್ಕಿಸಲಾಗಲಿಲ್ಲ. ಇಂಟರ್ನೆಟ್ ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.");
    } finally { setLoading(false); setLoadingSource(null); }
  };

  const selectedLabel = fdaResults.find((result) => result.id === selectedLabelId) ?? null;

  return <div className="cp-official-search-choice cp-live-med-search">
    <strong>{language === "en" ? "Medicine information, searched inside CARE CONNECTED" : "CARE CONNECTED ಒಳಗೆ ಔಷಧಿ ಮಾಹಿತಿ ಹುಡುಕಿ"}</strong>
    <p>{language === "en" ? "MedlinePlus offers plain-language information. FDA submitted labels can show product-specific uses, warnings, side effects, and interactions. Neither source is a complete worldwide catalogue or personal treatment advice." : "MedlinePlus ಸರಳ ಭಾಷೆಯ ಮಾಹಿತಿ ನೀಡುತ್ತದೆ. FDA ಸಲ್ಲಿಸಿದ ಲೇಬಲ್ ಉತ್ಪನ್ನದ ಬಳಕೆ, ಎಚ್ಚರಿಕೆ, ಅಡ್ಡಪರಿಣಾಮ ಮತ್ತು ಪರಸ್ಪರ ಕ್ರಿಯೆ ತೋರಿಸಬಹುದು. ಇವು ವಿಶ್ವದ ಸಂಪೂರ್ಣ ಪಟ್ಟಿ ಅಥವಾ ವೈಯಕ್ತಿಕ ಚಿಕಿತ್ಸಾ ಸಲಹೆ ಅಲ್ಲ."}</p>
    <label>{language === "en" ? "Search by brand or generic name" : "ಬ್ರ್ಯಾಂಡ್ ಅಥವಾ ಜೆನೆರಿಕ್ ಹೆಸರಿನಿಂದ ಹುಡುಕಿ"}<input value={term} maxLength={100} onChange={(event) => { setTerm(event.target.value); setConsent(false); setResults([]); setFdaResults([]); setSelectedLabelId(""); setMessage(""); }} /></label>
    <label className="cp-live-med-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>{language === "en" ? "I agree to send only this medicine name to the source I select (U.S. NIH MedlinePlus or the U.S. FDA openFDA label service). My saved medicines, allergies, profile, and the rest of my question are not sent." : "ನಾನು ಆಯ್ಕೆಮಾಡಿದ ಮೂಲಕ್ಕೆ ಈ ಔಷಧಿ ಹೆಸರನ್ನು ಮಾತ್ರ ಕಳುಹಿಸಲು ಒಪ್ಪುತ್ತೇನೆ (U.S. NIH MedlinePlus ಅಥವಾ U.S. FDA openFDA ಲೇಬಲ್ ಸೇವೆ). ನನ್ನ ಉಳಿಸಿದ ಔಷಧಿ, ಅಲರ್ಜಿ, ಪ್ರೊಫೈಲ್ ಅಥವಾ ಉಳಿದ ಪ್ರಶ್ನೆ ಕಳುಹಿಸುವುದಿಲ್ಲ."}</span></label>
    <div className="cp-med-source-actions">
      <button className="cp-button primary" type="button" onClick={search} disabled={loading}>{loading && loadingSource === "medlineplus" ? <LoaderCircle size={16} className="cp-spin" /> : <Search size={16} />}{language === "en" ? "Plain-language guide · MedlinePlus" : "ಸರಳ ಮಾಹಿತಿ · MedlinePlus"}</button>
      <button className="cp-button quiet" type="button" onClick={searchLabels} disabled={loading}>{loading && loadingSource === "fda" ? <LoaderCircle size={16} className="cp-spin" /> : <FileSearch size={16} />}{language === "en" ? "Product label · U.S. FDA data" : "ಉತ್ಪನ್ನ ಲೇಬಲ್ · U.S. FDA ಮಾಹಿತಿ"}</button>
    </div>
    {message && <p className="cp-ai-status" role="status">{message}</p>}
    {results.map((result) => <article className="cp-drug-result" key={result.url}><span className="cp-eyebrow">U.S. NIH MEDLINEPLUS · GENERAL INFORMATION</span><h3>{result.title}</h3>{result.summary && <><p>{result.summary}</p><ReadAloudButton text={result.title + ". " + result.summary} label="Listen to medicine information" /></>}<a href={result.url} target="_blank" rel="noreferrer">{language === "en" ? "Read complete medicine page" : "ಸಂಪೂರ್ಣ ಔಷಧಿ ಪುಟ ಓದಿ"}<ArrowRight size={14} /></a><small>{language === "en" ? "The live result is in English. Verify the package and local label with a pharmacist." : "ನೇರ ಮೂಲ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿದೆ. ಪ್ಯಾಕೆಟ್ ಮತ್ತು ಸ್ಥಳೀಯ ಲೇಬಲ್ ಅನ್ನು ಫಾರ್ಮಸಿಸ್ಟ್ ಜೊತೆ ಪರಿಶೀಲಿಸಿ."}</small></article>)}
    {fdaResults.length > 0 && <section className="cp-fda-search-results" aria-label="U.S. FDA submitted medicine product labels">
      <div className="cp-fda-result-heading"><span><FileSearch size={17} /></span><div><strong>{fdaResults.length} product label{fdaResults.length === 1 ? "" : "s"} found</strong><small>U.S. FDA submitted labeling · product records may differ</small></div></div>
      <div className="cp-fda-product-layout">
        <div className="cp-fda-product-list" role="group" aria-label="Matching product labels">
          {fdaResults.map((label) => <button type="button" key={label.id} className={selectedLabelId === label.id ? "selected" : ""} aria-pressed={selectedLabelId === label.id} onClick={() => setSelectedLabelId(label.id)}><strong>{label.brandName}</strong><span>{label.genericName || "Generic name not listed"}</span><small>{[label.productType, label.route, label.manufacturer].filter(Boolean).join(" · ") || "Product details not listed"}</small></button>)}
        </div>
        {selectedLabel && <article className="cp-fda-product-detail">
          <header><span className="cp-eyebrow">PRODUCT LABEL DETAILS · ENGLISH SOURCE</span><h3>{selectedLabel.brandName}</h3><p>{[selectedLabel.genericName, selectedLabel.productType, selectedLabel.route, selectedLabel.manufacturer].filter(Boolean).join(" · ")}</p></header>
          {selectedLabel.sections.map((section, index) => <details key={section.key} open={index === 0}>
            <summary>{section.label}</summary><p>{section.text}</p>
          </details>)}
          <ReadAloudButton text={() => `${selectedLabel.brandName}. ${selectedLabel.sections.map((section) => `${section.label}. ${section.text}`).join(". ")}`} label="Listen to selected product label" />
          <a href={fdaLabelUrl(selectedLabel)} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Open complete label at DailyMed</a>
          <div className="cp-fda-caveat"><ShieldAlert size={15} /><p>These are U.S. submitted product-label excerpts, in English. Match the exact package, strength, and form. Labels can differ by product and may not match products currently sold. This is not a recommendation, personal safety check, or dosing instruction.</p></div>
        </article>}
      </div>
    </section>}
  </div>;
}

