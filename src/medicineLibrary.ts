export type MedicineCategoryTerm = { label: string; query: string };
export type MedicineCategory = {
  id: string;
  name: string;
  description: string;
  terms: MedicineCategoryTerm[];
};

/**
 * Category navigation terms only. Medicine records and product details are
 * fetched live from NLM RxNorm; these entries are not a local drug database.
 */
export const MEDICINE_CATEGORIES: MedicineCategory[] = [
  { id: "diabetes", name: "Diabetes & blood sugar", description: "Search medicine names and classes used in diabetes care.", terms: [{ label: "Metformin", query: "metformin" }, { label: "Insulin", query: "insulin" }, { label: "SGLT2 medicines", query: "empagliflozin" }, { label: "GLP-1 medicines", query: "semaglutide" }, { label: "DPP-4 medicines", query: "sitagliptin" }] },
  { id: "cancer", name: "Cancer & oncology", description: "Find oncology medicine records; treatment requires a specialist team.", terms: [{ label: "Imatinib", query: "imatinib" }, { label: "Tamoxifen", query: "tamoxifen" }, { label: "Letrozole", query: "letrozole" }, { label: "Capecitabine", query: "capecitabine" }, { label: "Pembrolizumab", query: "pembrolizumab" }] },
  { id: "fever-pain", name: "Fever & pain relief", description: "Explore common pain and fever medicine names and official labels.", terms: [{ label: "Paracetamol / acetaminophen", query: "acetaminophen" }, { label: "Ibuprofen", query: "ibuprofen" }, { label: "Naproxen", query: "naproxen" }, { label: "Aspirin", query: "aspirin" }, { label: "Diclofenac", query: "diclofenac" }] },
  { id: "heart", name: "Heart & cardiovascular", description: "Search heart and circulation medicine records.", terms: [{ label: "Atorvastatin", query: "atorvastatin" }, { label: "Metoprolol", query: "metoprolol" }, { label: "Apixaban", query: "apixaban" }, { label: "Clopidogrel", query: "clopidogrel" }, { label: "Lisinopril", query: "lisinopril" }] },
  { id: "blood-pressure", name: "Blood pressure & cholesterol", description: "Search commonly used medicine names; check local labels and clinician instructions.", terms: [{ label: "Amlodipine", query: "amlodipine" }, { label: "Losartan", query: "losartan" }, { label: "Lisinopril", query: "lisinopril" }, { label: "Atorvastatin", query: "atorvastatin" }, { label: "Rosuvastatin", query: "rosuvastatin" }] },
  { id: "kidney", name: "Kidney health", description: "Medicine records related to kidney care; suitability depends on the person and clinical plan.", terms: [{ label: "Sevelamer", query: "sevelamer" }, { label: "Furosemide", query: "furosemide" }, { label: "Epoetin alfa", query: "epoetin alfa" }, { label: "Finerenone", query: "finerenone" }, { label: "Dapagliflozin", query: "dapagliflozin" }] },
  { id: "liver", name: "Liver health", description: "Search medicines that may appear in liver-care plans; consult the treating team.", terms: [{ label: "Lactulose", query: "lactulose" }, { label: "Rifaximin", query: "rifaximin" }, { label: "Entecavir", query: "entecavir" }, { label: "Ursodiol", query: "ursodiol" }, { label: "Tenofovir", query: "tenofovir" }] },
  { id: "antibiotics", name: "Antibiotics & antimicrobials", description: "Antibiotics treat some bacterial infections and do not treat viral illnesses.", terms: [{ label: "Amoxicillin", query: "amoxicillin" }, { label: "Azithromycin", query: "azithromycin" }, { label: "Doxycycline", query: "doxycycline" }, { label: "Cephalexin", query: "cephalexin" }, { label: "Ciprofloxacin", query: "ciprofloxacin" }] },
  { id: "antiviral", name: "Antiviral medicines", description: "Search antiviral medicine names and their product records.", terms: [{ label: "Acyclovir", query: "acyclovir" }, { label: "Oseltamivir", query: "oseltamivir" }, { label: "Valacyclovir", query: "valacyclovir" }, { label: "Tenofovir", query: "tenofovir" }, { label: "Nirmatrelvir", query: "nirmatrelvir" }] },
  { id: "antifungal", name: "Antifungal medicines", description: "Search antifungal medicine records; forms and uses vary by product.", terms: [{ label: "Fluconazole", query: "fluconazole" }, { label: "Clotrimazole", query: "clotrimazole" }, { label: "Terbinafine", query: "terbinafine" }, { label: "Nystatin", query: "nystatin" }, { label: "Miconazole", query: "miconazole" }] },
  { id: "respiratory", name: "Respiratory & asthma", description: "Search inhaled and other respiratory medicine records.", terms: [{ label: "Albuterol / salbutamol", query: "albuterol" }, { label: "Budesonide", query: "budesonide" }, { label: "Montelukast", query: "montelukast" }, { label: "Fluticasone", query: "fluticasone" }, { label: "Tiotropium", query: "tiotropium" }] },
  { id: "allergy", name: "Allergy & immunology", description: "Search allergy medicine records and official product information.", terms: [{ label: "Cetirizine", query: "cetirizine" }, { label: "Loratadine", query: "loratadine" }, { label: "Fexofenadine", query: "fexofenadine" }, { label: "Epinephrine", query: "epinephrine" }, { label: "Prednisone", query: "prednisone" }] },
  { id: "digestive", name: "Digestive health", description: "Search medicines related to digestive health and their labels.", terms: [{ label: "Omeprazole", query: "omeprazole" }, { label: "Pantoprazole", query: "pantoprazole" }, { label: "Ondansetron", query: "ondansetron" }, { label: "Famotidine", query: "famotidine" }, { label: "Loperamide", query: "loperamide" }] },
  { id: "neurology", name: "Neurology", description: "Search medicine records used in neurologic care.", terms: [{ label: "Levetiracetam", query: "levetiracetam" }, { label: "Gabapentin", query: "gabapentin" }, { label: "Sumatriptan", query: "sumatriptan" }, { label: "Carbidopa / levodopa", query: "carbidopa levodopa" }, { label: "Topiramate", query: "topiramate" }] },
  { id: "mental-health", name: "Mental health", description: "Search mental health medicine records; do not start, stop, or change treatment without the prescriber.", terms: [{ label: "Sertraline", query: "sertraline" }, { label: "Escitalopram", query: "escitalopram" }, { label: "Fluoxetine", query: "fluoxetine" }, { label: "Lithium", query: "lithium" }, { label: "Quetiapine", query: "quetiapine" }] },
  { id: "vitamins", name: "Vitamins & minerals", description: "Search ingredient and product names; supplements may differ from regulated medicines.", terms: [{ label: "Vitamin D", query: "cholecalciferol" }, { label: "Iron", query: "ferrous sulfate" }, { label: "Folic acid", query: "folic acid" }, { label: "Vitamin B12", query: "cyanocobalamin" }, { label: "Calcium", query: "calcium carbonate" }] },
  { id: "skin", name: "Skin & dermatology", description: "Search topical and dermatology medicine records.", terms: [{ label: "Hydrocortisone", query: "hydrocortisone topical" }, { label: "Tretinoin", query: "tretinoin" }, { label: "Mupirocin", query: "mupirocin" }, { label: "Clobetasol", query: "clobetasol" }, { label: "Adapalene", query: "adapalene" }] },
  { id: "eye-ear", name: "Eye & ear", description: "Search ophthalmic and ear medicine records; verify the route and exact product.", terms: [{ label: "Latanoprost", query: "latanoprost" }, { label: "Timolol eye drops", query: "timolol ophthalmic" }, { label: "Ciprofloxacin eye drops", query: "ciprofloxacin ophthalmic" }, { label: "Ofloxacin ear drops", query: "ofloxacin otic" }, { label: "Olopatadine", query: "olopatadine" }] },
  { id: "womens-health", name: "Women’s health", description: "Search women’s health medicine records; pregnancy-related decisions need a clinician.", terms: [{ label: "Estradiol", query: "estradiol" }, { label: "Progesterone", query: "progesterone" }, { label: "Levonorgestrel", query: "levonorgestrel" }, { label: "Clomiphene", query: "clomiphene" }, { label: "Tranexamic acid", query: "tranexamic acid" }] },
  { id: "pediatrics", name: "Child & paediatric health", description: "Children need age- and weight-specific professional advice; this catalogue does not calculate doses.", terms: [{ label: "Paracetamol / acetaminophen", query: "acetaminophen" }, { label: "Amoxicillin", query: "amoxicillin" }, { label: "Cetirizine", query: "cetirizine" }, { label: "Oral rehydration salts", query: "oral rehydration salts" }, { label: "Salbutamol", query: "albuterol" }] },
  { id: "older-adults", name: "Older adult health", description: "Search medicine records; interactions and suitability require a full medication review.", terms: [{ label: "Apixaban", query: "apixaban" }, { label: "Levothyroxine", query: "levothyroxine" }, { label: "Metformin", query: "metformin" }, { label: "Alendronate", query: "alendronate" }, { label: "Donepezil", query: "donepezil" }] },
  { id: "bone-joint", name: "Bone & joint health", description: "Search medicine records related to bone, joint, and inflammatory care.", terms: [{ label: "Alendronate", query: "alendronate" }, { label: "Denosumab", query: "denosumab" }, { label: "Methotrexate", query: "methotrexate" }, { label: "Celecoxib", query: "celecoxib" }, { label: "Diclofenac", query: "diclofenac" }] },
  { id: "emergency", name: "Emergency medicine information", description: "Educational records only. In an emergency, contact local emergency services now.", terms: [{ label: "Epinephrine", query: "epinephrine" }, { label: "Naloxone", query: "naloxone" }, { label: "Glucagon", query: "glucagon" }, { label: "Nitroglycerin", query: "nitroglycerin" }, { label: "Activated charcoal", query: "activated charcoal" }] },
  { id: "first-aid", name: "First aid & wound care", description: "Search first-aid related product records; urgent wounds need local professional care.", terms: [{ label: "Oral rehydration salts", query: "oral rehydration salts" }, { label: "Hydrocortisone topical", query: "hydrocortisone topical" }, { label: "Bacitracin", query: "bacitracin topical" }, { label: "Lidocaine topical", query: "lidocaine topical" }, { label: "Chlorhexidine", query: "chlorhexidine" }] },
  { id: "other", name: "Other medicines", description: "Search the active NLM RxNorm medicine vocabulary by name, ingredient, strength, or brand.", terms: [{ label: "Levothyroxine", query: "levothyroxine" }, { label: "Warfarin", query: "warfarin" }, { label: "Omeprazole", query: "omeprazole" }, { label: "Dolo 650", query: "Dolo 650" }, { label: "Search another name", query: "acetaminophen" }] },
];

export type RxNormMedicineProduct = {
  rxcui: string;
  name: string;
  synonym: string;
  tty: string;
  brandName: string;
  genericName: string;
};

type RxNormConcept = { rxcui?: unknown; name?: unknown; synonym?: unknown; tty?: unknown; language?: unknown; suppress?: unknown };
type RxNormConceptGroup = { tty?: unknown; conceptProperties?: RxNormConcept | RxNormConcept[] };
type RxNormDrugsResponse = { drugGroup?: { conceptGroup?: RxNormConceptGroup | RxNormConceptGroup[] } };

function asArray<T>(value: T | T[] | undefined): T[] { return value === undefined ? [] : Array.isArray(value) ? value : [value]; }

export function parseRxNormMedicineProducts(payload: unknown): RxNormMedicineProduct[] {
  if (!payload || typeof payload !== "object") return [];
  const groups = asArray((payload as RxNormDrugsResponse).drugGroup?.conceptGroup);
  const seen = new Set<string>();
  return groups.flatMap((group) => {
    const tty = typeof group.tty === "string" ? group.tty : "";
    if (tty !== "SCD" && tty !== "SBD") return [];
    return asArray(group.conceptProperties).flatMap((item) => {
      const rxcui = typeof item.rxcui === "string" ? item.rxcui.trim() : "";
      const name = typeof item.name === "string" ? item.name.trim() : "";
      const synonym = typeof item.synonym === "string" ? item.synonym.trim() : "";
      if (!rxcui || !name || item.suppress === "Y" || (item.language && item.language !== "ENG") || seen.has(rxcui)) return [];
      seen.add(rxcui);
      const bracketBrand = name.match(/\[([^\]]+)\]\s*$/)?.[1] ?? "";
      const unbrandedName = name.replace(/\s*\[[^\]]+\]\s*$/, "");
      const doseFormAt = unbrandedName.search(/\b(?:oral|topical|intravenous|intramuscular|subcutaneous|ophthalmic|otic|nasal|inhalation|rectal|vaginal)\s+(?:tablet|capsule|solution|suspension|injection|cream|ointment|drops|inhalant|patch|powder|spray|gel|film|lotion|suppository)\b/i);
      const ingredientPart = doseFormAt >= 0 ? unbrandedName.slice(0, doseFormAt) : unbrandedName;
      const genericName = ingredientPart
        .replace(/\b\d+(?:\.\d+)?\s*(?:MG|MCG|G|ML|MEQ|UNT|%)(?:\s*\/\s*\d+(?:\.\d+)?\s*(?:MG|MCG|G|ML|MEQ|UNT|%|ACT))?/gi, "")
        .replace(/\s*\/\s*$/, "")
        .replace(/\s+/g, " ")
        .trim();
      return [{ rxcui, name, synonym, tty, brandName: tty === "SBD" ? bracketBrand : "", genericName: genericName || name }];
    });
  }).sort((a, b) => a.name.localeCompare(b.name)).slice(0, 60);
}

const productCache = new Map<string, { savedAt: number; products: RxNormMedicineProduct[] }>();
export async function searchRxNormMedicineProducts(term: string): Promise<RxNormMedicineProduct[]> {
  const query = term.trim().replace(/[\u0000-\u001f]/g, " ").replace(/\s+/g, " ").slice(0, 100);
  if (!query) return [];
  const key = query.toLocaleLowerCase();
  const cached = productCache.get(key);
  if (cached && Date.now() - cached.savedAt < 15 * 60_000) return cached.products;
  const url = new URL("https://rxnav.nlm.nih.gov/REST/drugs.json");
  url.searchParams.set("name", query);
  url.searchParams.set("expand", "psn");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(url, { headers: { Accept: "application/json" }, signal: controller.signal });
    if (response.status === 404) return [];
    if (!response.ok) throw new Error(`NLM RxNorm search returned ${response.status}`);
    const products = parseRxNormMedicineProducts(await response.json());
    productCache.set(key, { savedAt: Date.now(), products });
    return products;
  } finally { clearTimeout(timeout); }
}

export function rxNormProductUrl(product: Pick<RxNormMedicineProduct, "rxcui">) {
  return `https://rxnav.nlm.nih.gov/REST/rxcui/${encodeURIComponent(product.rxcui)}.json`;
}

export function medicineProductForm(name: string): string {
  const clean = name.replace(/\s*\[[^\]]+\]\s*$/, "");
  const match = clean.match(/\b(?:Metered Dose Inhaler|Dry Powder Inhaler|Tablet|Capsule|Solution|Suspension|Injection|Cream|Ointment|Drops|Inhaler|Inhalant|Aerosol|Inhalation|Patch|Powder|Spray|Gel|Film|Lotion|Suppository)\b/i);
  if (!match) return "Form not listed";
  return /inhaler/i.test(match[0]) ? "Inhaler" : match[0];
}

export function medicineProductStrength(name: string): string {
  const match = name.match(/\b\d+(?:\.\d+)?\s*(?:MG|MCG|G|ML|MEQ|UNT|%)(?:\s*\/\s*\d+(?:\.\d+)?\s*(?:ML|G))?\b/i);
  return match?.[0] ?? "Strength not listed";
}

export function matchingProducts(products: RxNormMedicineProduct[], filters: { form?: string; type?: "all" | "brand" | "generic"; query?: string }) {
  const query = filters.query?.trim().toLocaleLowerCase() ?? "";
  return products.filter((product) => {
    const textMatch = !query || `${product.name} ${product.synonym} ${product.genericName} ${product.brandName}`.toLocaleLowerCase().includes(query);
    const typeMatch = !filters.type || filters.type === "all" || (filters.type === "brand" ? product.tty === "SBD" : product.tty === "SCD");
    const formMatch = !filters.form || filters.form === "all" || medicineProductForm(product.name).toLocaleLowerCase().includes(filters.form.toLocaleLowerCase());
    return textMatch && typeMatch && formMatch;
  });
}

