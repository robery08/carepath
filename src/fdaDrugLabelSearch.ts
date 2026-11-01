export type FdaLabelSection = {
  key: string;
  label: string;
  text: string;
};

export type FdaDrugLabel = {
  id: string;
  brandName: string;
  genericName: string;
  manufacturer: string;
  productType: string;
  route: string;
  setId: string;
  sections: FdaLabelSection[];
};

type LabelRecord = Record<string, unknown> & {
  openfda?: Record<string, unknown>;
};

type LabelResponse = { results?: LabelRecord[] };

const ENDPOINT = "https://api.fda.gov/drug/label.json";

function firstString(value: unknown) {
  if (Array.isArray(value)) {
    const first = value.find((entry) => typeof entry === "string" && entry.trim());
    return typeof first === "string" ? first.trim() : "";
  }
  return typeof value === "string" ? value.trim() : "";
}

/** Convert FDA label HTML fragments to safe, readable plain text. */
export function cleanFdaLabelText(value: string) {
  return value
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\/\s*\1\s*>/gi, " ")
    .replace(/<\s*br\s*\/?\s*>|<\s*\/\s*(?:p|div|li|tr|h[1-6])\s*>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;|&#xA0;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_match, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/\s+/g, " ")
    .trim();
}

function getSection(record: LabelRecord, keys: string[], label: string): FdaLabelSection | null {
  for (const key of keys) {
    const text = Array.isArray(record[key])
      ? (record[key] as unknown[]).filter((value): value is string => typeof value === "string").map(cleanFdaLabelText).filter(Boolean).join(" ")
      : "";
    if (text) return { key, label, text: text.slice(0, 1600) };
  }
  return null;
}

function parseRecord(record: LabelRecord): FdaDrugLabel | null {
  const fda = record.openfda ?? {};
  const setId = firstString(fda.spl_set_id) || firstString(record.set_id);
  const id = firstString(record.id) || setId;
  const sections = [
    getSection(record, ["indications_and_usage", "purpose"], "Uses listed on this label"),
    getSection(record, ["boxed_warning", "warnings", "do_not_use"], "Warnings and when not to use"),
    getSection(record, ["adverse_reactions", "user_safety_warnings"], "Side effects listed on this label"),
    getSection(record, ["drug_interactions", "contraindications", "general_precautions"], "Interactions and precautions"),
    getSection(record, ["ask_doctor_or_pharmacist", "ask_doctor", "stop_use"], "When to ask a health professional"),
  ].filter((section): section is FdaLabelSection => Boolean(section));
  if (!sections.length || (!id && !setId)) return null;
  return {
    id: id || setId,
    brandName: firstString(fda.brand_name) || "Name not listed",
    genericName: firstString(fda.generic_name),
    manufacturer: firstString(fda.manufacturer_name),
    productType: firstString(fda.product_type),
    route: firstString(fda.route),
    setId,
    sections,
  };
}

function queryFor(field: "openfda.brand_name" | "openfda.generic_name", term: string) {
  const safeTerm = term.normalize("NFKC").replace(/["\\]/g, " ").replace(/[\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
  return `${field}:"${safeTerm}"`;
}

function urlFor(field: "openfda.brand_name" | "openfda.generic_name", term: string) {
  const url = new URL(ENDPOINT);
  url.searchParams.set("search", queryFor(field, term));
  url.searchParams.set("limit", "6");
  return url.toString();
}

async function requestLabels(url: string): Promise<LabelRecord[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(url, { headers: { Accept: "application/json" }, signal: controller.signal });
    // openFDA uses 404 when a valid query has no matches.
    if (response.status === 404) return [];
    if (!response.ok) throw new Error(`FDA label lookup returned ${response.status}`);
    const body = await response.json() as LabelResponse;
    return Array.isArray(body.results) ? body.results : [];
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Searches U.S. FDA-submitted product labels by brand and generic name.
 * This is a label lookup, not an approval check or a treatment recommendation.
 */
export async function searchFdaDrugLabels(medicineName: string): Promise<FdaDrugLabel[]> {
  const term = medicineName.trim().slice(0, 100);
  if (!term) return [];
  const [brandResult, genericResult] = await Promise.allSettled([
    requestLabels(urlFor("openfda.brand_name", term)),
    requestLabels(urlFor("openfda.generic_name", term)),
  ]);
  const fulfilled = [brandResult, genericResult].flatMap((result) => result.status === "fulfilled" ? result.value : []);
  if (!fulfilled.length && [brandResult, genericResult].every((result) => result.status === "rejected")) {
    throw new Error("FDA label lookup is temporarily unavailable.");
  }
  const seen = new Set<string>();
  return fulfilled.flatMap((record) => {
    const parsed = parseRecord(record);
    if (!parsed || seen.has(parsed.id)) return [];
    seen.add(parsed.id);
    return [parsed];
  }).slice(0, 8);
}

export function fdaLabelUrl(label: FdaDrugLabel) {
  if (label.setId) return `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${encodeURIComponent(label.setId)}`;
  const url = new URL(ENDPOINT);
  url.searchParams.set("search", `id:"${label.id.replace(/["\\]/g, " ")}"`);
  url.searchParams.set("limit", "1");
  return url.toString();
}

