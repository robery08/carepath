import { useMemo, useState } from "react";
import { ArrowDownWideNarrow, ArrowUpRight, BookOpen, ChevronRight, Grid2X2, Heart, Info, List, LoaderCircle, Pill, Search, ShieldCheck, Sparkles, X } from "lucide-react";
import { MEDICINE_CATEGORIES, matchingProducts, medicineProductForm, medicineProductStrength, rxNormProductUrl, searchRxNormMedicineProducts, type MedicineCategory, type RxNormMedicineProduct } from "../medicineLibrary";
import type { VoiceLanguage } from "../voice";
import MedlinePlusLookup from "./MedlinePlusLookup";
import "./MedicineLibrary.css";

type Props = { language: VoiceLanguage; onAddMedicine: (product: RxNormMedicineProduct) => void };
type ViewMode = "grid" | "list";
type ProductType = "all" | "brand" | "generic";
const SAVED_KEY = "care_connected_saved_rxnorm_products_v1";
const RECENT_KEY = "care_connected_recent_rxnorm_searches_v1";
function readStored<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; }
}
function categoryIcon(id: string) {
  if (id === "emergency") return "✦";
  if (id === "diabetes") return "◉";
  if (id === "cancer") return "✧";
  if (id === "heart" || id === "blood-pressure") return "♡";
  if (id === "respiratory") return "◌";
  if (id === "womens-health") return "✿";
  return "✚";
}

export default function MedicineLibrary({ language, onAddMedicine }: Props) {
  const [term, setTerm] = useState("");
  const [category, setCategory] = useState<MedicineCategory | null>(null);
  const [products, setProducts] = useState<RxNormMedicineProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadedTerm, setLoadedTerm] = useState("");
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);
  const [view, setView] = useState<ViewMode>("grid");
  const [typeFilter, setTypeFilter] = useState<ProductType>("all");
  const [formFilter, setFormFilter] = useState("all");
  const [sort, setSort] = useState("name");
  const [savedOnly, setSavedOnly] = useState(false);
  const [saved, setSaved] = useState<string[]>(() => readStored<string[]>(SAVED_KEY, []));
  const [recent, setRecent] = useState<string[]>(() => readStored<string[]>(RECENT_KEY, []));
  const [selected, setSelected] = useState<RxNormMedicineProduct | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const displayedProducts = useMemo(() => {
    const savedSet = new Set(saved);
    const filtered = matchingProducts(products, { type: typeFilter, form: formFilter });
    const visible = savedOnly ? filtered.filter((product) => savedSet.has(product.rxcui)) : filtered;
    return [...visible].sort((left, right) => sort === "brand" ? left.brandName.localeCompare(right.brandName) : sort === "strength" ? medicineProductStrength(left.name).localeCompare(medicineProductStrength(right.name)) : left.name.localeCompare(right.name));
  }, [products, saved, savedOnly, sort, typeFilter, formFilter]);

  const runSearch = async (searchTerm = term) => {
    const clean = searchTerm.trim();
    if (!clean) { setError(language === "kn" ? "ಮೊದಲು ಔಷಧಿಯ ಹೆಸರು ನಮೂದಿಸಿ." : "Enter a medicine name or ingredient first."); return; }
    if (!consent) { setError(language === "kn" ? "ಹುಡುಕಲು ಮೊದಲು ಒಪ್ಪಿಗೆ ನೀಡಿ. ಈ ಹುಡುಕಾಟ ಪದ ಮಾತ್ರ NLM RxNorm ಗೆ ಕಳುಹಿಸಲಾಗುತ್ತದೆ." : "Please agree before searching. Only this search term goes to NLM RxNorm."); return; }
    setLoading(true); setError(""); setSelected(null); setDetailsOpen(false); setProducts([]); setLoadedTerm(clean); setSavedOnly(false);
    const nextRecent = [clean, ...recent.filter((value) => value.toLocaleLowerCase() !== clean.toLocaleLowerCase())].slice(0, 8);
    setRecent(nextRecent);
    try {
      const found = await searchRxNormMedicineProducts(clean);
      setProducts(found);
      if (!found.length) setError(language === "kn" ? "ಈ NLM RxNorm ಹುಡುಕಾಟದಲ್ಲಿ ಹೊಂದಾಣಿಕೆಯ ಉತ್ಪನ್ನ ಸಿಗಲಿಲ್ಲ. ಇದು ಔಷಧಿ ಲಭ್ಯವಿಲ್ಲ ಅಥವಾ ಸುರಕ್ಷಿತವಲ್ಲ ಎಂದರ್ಥವಲ್ಲ." : "No matching medicine products came back from this NLM RxNorm search. That does not mean a medicine is unavailable or unsafe.");
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(nextRecent)); } catch { /* recent searches are optional */ }
    } catch {
      setError(language === "kn" ? "NLM RxNorm ಸೇವೆಯನ್ನು ಸಂಪರ್ಕಿಸಲಾಗಲಿಲ್ಲ. ಇಂಟರ್ನೆಟ್ ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ." : "Could not reach NLM RxNorm. Check the connection and try again.");
    } finally { setLoading(false); }
  };

  const chooseCategory = (next: MedicineCategory) => {
    setCategory(next); setSavedOnly(false); setError("");
    if (!products.length) setLoadedTerm("");
  };
  const chooseTerm = (query: string) => {
    if (!query) return;
    setTerm(query); setConsent(false); setError(""); setProducts([]); setLoadedTerm(""); setSelected(null); setDetailsOpen(false); setSavedOnly(false);
  };
  const toggleSaved = (product: RxNormMedicineProduct) => {
    const next = saved.includes(product.rxcui) ? saved.filter((id) => id !== product.rxcui) : [product.rxcui, ...saved];
    setSaved(next);
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(next)); } catch { setError("Saved medicine shortcuts could not be stored in this browser."); }
  };
  const openProduct = (product: RxNormMedicineProduct) => { setSelected(product); setDetailsOpen(true); setSavedOnly(false); };

  const resultControls = <div className="cc-med-library-controls">
    <span className="cc-med-result-count"><strong>{displayedProducts.length}</strong> results <small>from the current RxNorm search</small></span>
    <div className="cc-med-control-group">
      <label>Type<select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as ProductType)}><option value="all">All products</option><option value="generic">Generic</option><option value="brand">Brand</option></select></label>
      <label>Form<select value={formFilter} onChange={(event) => setFormFilter(event.target.value)}><option value="all">All forms</option><option value="tablet">Tablets</option><option value="capsule">Capsules</option><option value="solution">Liquids</option><option value="injection">Injections</option><option value="cream">Creams</option><option value="inhaler">Inhalers</option><option value="drops">Drops</option></select></label>
      <label><ArrowDownWideNarrow size={14} />Sort<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="name">Name</option><option value="brand">Brand</option><option value="strength">Strength</option></select></label>
      <div className="cc-med-view-toggle" role="group" aria-label="Choose catalogue view"><button type="button" aria-label="Grid view" aria-pressed={view === "grid"} className={view === "grid" ? "active" : ""} onClick={() => setView("grid")}><Grid2X2 size={16} /></button><button type="button" aria-label="List view" aria-pressed={view === "list"} className={view === "list" ? "active" : ""} onClick={() => setView("list")}><List size={16} /></button></div>
    </div>
  </div>;

  return <section className="cc-med-library" aria-label="Medicine Intelligence Centre">
    <header className="cc-med-library-hero">
      <div className="cc-med-library-hero-top"><span className="cc-med-library-mark"><Pill size={22} /></span><div><span className="cc-med-library-eyebrow">CARE CONNECTED · MEDICINE INTELLIGENCE</span><h2>Find a medicine. Understand the source.</h2><p>Search real NLM RxNorm records by brand, generic name, ingredient, strength, or form.</p></div><span className="cc-med-live-badge"><i /> Live NLM search</span></div>
      <form className="cc-med-library-search" onSubmit={(event) => { event.preventDefault(); void runSearch(); }}>
        <Search size={19} /><input value={term} maxLength={100} onChange={(event) => { setTerm(event.target.value); setConsent(false); setError(""); setProducts([]); setLoadedTerm(""); setSelected(null); setDetailsOpen(false); setSavedOnly(false); }} placeholder="Try metformin, Dolo, acetaminofin, 500 mg…" aria-label="Search the NLM RxNorm medicine records" /><button type="submit" disabled={loading}>{loading ? <LoaderCircle className="cc-med-spin" size={17} /> : <Search size={17} />}<span>{loading ? "Searching" : "Search medicines"}</span></button>
      </form>
      <label className="cc-med-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>When I search, send only this search term to the U.S. National Library of Medicine (NLM) RxNorm service. My saved medicines, profile, and health records are not sent.</span></label>
      <div className="cc-med-library-trust"><span><ShieldCheck size={15} /> Official NLM vocabulary</span><span><BookOpen size={15} /> Product labels are separate</span><span><Info size={15} /> No dose or treatment advice</span></div>
    </header>

    <div className="cc-med-library-shell">
      <aside className="cc-med-categories" aria-label="Medicine categories">
        <div className="cc-med-category-heading"><div><span className="cc-med-library-eyebrow">BROWSE BY HEALTH AREA</span><h3>Categories</h3></div><span>{MEDICINE_CATEGORIES.length}</span></div>
        <div className="cc-med-category-list">{MEDICINE_CATEGORIES.map((item) => <button type="button" key={item.id} className={category?.id === item.id ? "active" : ""} onClick={() => chooseCategory(item)}><span className={`cc-med-category-icon ${item.id}`}>{categoryIcon(item.id)}</span><span>{item.name}</span><ChevronRight size={14} /></button>)}</div>
        <p className="cc-med-category-note">Categories help you explore. They do not mean a medicine is right for a symptom or person.</p>
      </aside>

      <main className="cc-med-catalog-main">
        {category ? <section className="cc-med-selected-category">
          <div className="cc-med-category-title"><div><span className="cc-med-library-eyebrow">MEDICINE AREA</span><h3>{category.name}</h3><p>{category.description}</p></div><span className={`cc-med-category-icon large ${category.id}`}>{categoryIcon(category.id)}</span></div>
          <div className="cc-med-topic-chips"><span>Search a common name:</span>{category.terms.map((item) => <button key={item.label} type="button" onClick={() => chooseTerm(item.query)} disabled={!item.query}>{item.label}</button>)}</div>
        </section> : <section className="cc-med-catalog-welcome"><div className="cc-med-welcome-orb"><Pill size={25} /></div><div><span className="cc-med-library-eyebrow">START WITH WHAT YOU KNOW</span><h3>Choose a health area or search a medicine name</h3><p>These categories lead to live records from NLM RxNorm. Search a product to see its recognized name, generic or brand type, strength, and form where listed.</p></div><div className="cc-med-welcome-side"><span><strong>25</strong> areas</span><span><strong>Live</strong> search</span><span><strong>Source</strong> shown</span></div></section>}

        {recent.length > 0 && !products.length && <section className="cc-med-recent-searches"><span>Recent searches on this device</span>{recent.slice(0, 5).map((value) => <button key={value} type="button" onClick={() => { setTerm(value); setConsent(false); setError(""); }}>{value}</button>)}</section>}

        {error && <div className={`cc-med-library-message${products.length ? " info" : ""}`} role="status"><Info size={16} />{error}</div>}

        {products.length > 0 && <section className="cc-med-catalog-results">
          <div className="cc-med-catalog-results-heading"><div><span className="cc-med-library-eyebrow">LIVE CATALOGUE · NLM RXNORM</span><h3>{savedOnly ? "Your saved medicine records" : `Results for “${loadedTerm}”`}</h3><p>Active clinical product concepts found in the current source response. This is not a global stock or approval check.</p></div><button type="button" className={`cc-med-saved-filter${savedOnly ? " active" : ""}`} onClick={() => { setSavedOnly((value) => !value); setSelected(null); setDetailsOpen(false); }}><Heart size={16} fill={savedOnly ? "currentColor" : "none"} /> Saved <b>{saved.length}</b></button></div>
          {resultControls}
          {displayedProducts.length > 0 ? <div className={`cc-med-product-${view}`}>
            {view === "list" && <div className="cc-med-table-head"><span>MEDICINE RECORD</span><span>GENERIC / INGREDIENT</span><span>STRENGTH</span><span>FORM</span><span>SOURCE STATUS</span><span>OPEN</span></div>}
            {displayedProducts.map((product) => {
              const brand = product.brandName || "Generic concept";
              const strength = medicineProductStrength(product.name);
              const form = medicineProductForm(product.name);
              return view === "grid" ? <article key={product.rxcui} className="cc-med-product-card">
                <div className="cc-med-product-card-top"><div className="cc-med-product-art"><Pill size={25} /><span>RxNorm</span></div><button type="button" className={`cc-med-save${saved.includes(product.rxcui) ? " active" : ""}`} aria-label={saved.includes(product.rxcui) ? "Remove saved medicine" : "Save medicine record"} aria-pressed={saved.includes(product.rxcui)} onClick={() => toggleSaved(product)}><Heart size={17} fill={saved.includes(product.rxcui) ? "currentColor" : "none"} /></button></div>
                <span className={`cc-med-product-kind ${product.tty === "SBD" ? "brand" : "generic"}`}>{product.tty === "SBD" ? "BRAND CONCEPT" : "GENERIC CONCEPT"}</span><h4>{product.name}</h4><div className="cc-med-product-meta"><span>{brand}</span><span>{strength}</span><span>{form}</span></div><div className="cc-med-product-foot"><span><ShieldCheck size={14} /> NLM record · not pack verified</span><button type="button" onClick={() => openProduct(product)}>Details <ChevronRight size={15} /></button></div>
              </article> : <article key={product.rxcui} className="cc-med-product-row"><div className="cc-med-row-name"><span className="cc-med-row-pill"><Pill size={18} /></span><div><strong>{product.name}</strong><small>{product.tty === "SBD" ? "Brand product concept" : "Generic product concept"}</small></div></div><span>{product.genericName}</span><span>{strength}</span><span>{form}</span><span className="cc-med-row-status">NLM RxNorm</span><button type="button" onClick={() => openProduct(product)}>Open <ArrowUpRight size={14} /></button></article>;
            })}
          </div> : <div className="cc-med-no-products"><Search size={23} /><strong>{savedOnly ? "No saved results in this search" : "No records match these filters"}</strong><span>Try another form filter, switch to all products, or search a different medicine name.</span></div>}
          <div className="cc-med-nlm-attribution">This product uses publicly available data from the U.S. National Library of Medicine (NLM), NIH, HHS. NLM does not endorse or recommend this product.</div>
        </section>}

        {category && !products.length && !loading && <div className="cc-med-category-next"><Sparkles size={17} /><span><strong>Explore this area with a live source search</strong>Choose a name above or type any medicine, brand, or ingredient in the search box.</span></div>}
      </main>
    </div>

    {detailsOpen && selected && <div className="cc-med-detail-backdrop" role="presentation" onClick={() => setDetailsOpen(false)}><section className="cc-med-detail-panel" role="dialog" aria-modal="true" aria-labelledby="cc-med-detail-title" onClick={(event) => event.stopPropagation()}>
      <header className="cc-med-detail-head"><div className="cc-med-detail-icon"><Pill size={22} /></div><div><span className="cc-med-library-eyebrow">NLM RXNORM · MEDICINE RECORD</span><h2 id="cc-med-detail-title">{selected.name}</h2><p>RxCUI {selected.rxcui} · {selected.tty === "SBD" ? "Branded drug concept" : "Clinical drug concept"}</p></div><button type="button" className="cc-med-detail-close" aria-label="Close medicine details" onClick={() => setDetailsOpen(false)}><X size={19} /></button></header>
      <div className="cc-med-detail-facts"><div><span>Generic concept</span><strong>{selected.genericName || "Not separately listed"}</strong></div><div><span>Brand</span><strong>{selected.brandName || "No brand in this concept"}</strong></div><div><span>Strength as listed</span><strong>{medicineProductStrength(selected.name)}</strong></div><div><span>Form as listed</span><strong>{medicineProductForm(selected.name)}</strong></div></div>
      <div className="cc-med-detail-notice"><Info size={16} /><span>This source identifies a standardized medicine concept. It does not confirm your package, country availability, current marketing, prescription status, or whether it is suitable for you.</span></div>
      <div className="cc-med-detail-actions"><a href={rxNormProductUrl(selected)} target="_blank" rel="noreferrer">Open NLM source <ArrowUpRight size={15} /></a><button type="button" onClick={() => onAddMedicine(selected)}><Pill size={15} /> Review as a medicine for my cabinet</button></div>
      <div className="cc-med-detail-label"><h3>Uses, warnings & label details</h3><p>Choose an official information source. CARE CONNECTED sends only the name you approve, and does not decide which medicine or dose to use.</p><MedlinePlusLookup key={`${selected.rxcui}-lookup`} question="" initialTerm={selected.brandName || selected.genericName || selected.name} language={language === "kn" ? "kn" : "en"} /></div>
    </section></div>}
  </section>;
}

