export type RxNormMedicineMatch = { rxcui: string; name: string; rank: number };
type Candidate = { rxcui?: unknown; name?: unknown; rank?: unknown; source?: unknown };
type ResponseBody = { approximateGroup?: { candidate?: Candidate | Candidate[] } };
const ENDPOINT = "https://rxnav.nlm.nih.gov/REST/approximateTerm.json";

/** Returns name suggestions only; this does not verify a package or treatment. */
export async function searchRxNormMedicineNames(term: string): Promise<RxNormMedicineMatch[]> {
  const query = term.trim().replace(/[\u0000-\u001f]/g, " ").replace(/\s+/g, " ").slice(0, 100);
  if (!query) return [];
  const url = new URL(ENDPOINT);
  url.searchParams.set("term", query);
  url.searchParams.set("maxEntries", "8");
  url.searchParams.set("option", "1");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(url, { headers: { Accept: "application/json" }, signal: controller.signal });
    if (response.status === 404) return [];
    if (!response.ok) throw new Error(`NLM RxNorm lookup returned ${response.status}`);
    const body = await response.json() as ResponseBody;
    const raw = body.approximateGroup?.candidate;
    const candidates = Array.isArray(raw) ? raw : raw ? [raw] : [];
    const seen = new Set<string>();
    return candidates.flatMap((candidate) => {
      const rxcui = typeof candidate.rxcui === "string" ? candidate.rxcui.trim() : "";
      const name = typeof candidate.name === "string" ? candidate.name.trim() : "";
      if (!rxcui || !name || candidate.source !== "RXNORM" || seen.has(rxcui)) return [];
      seen.add(rxcui);
      const rank = Number(candidate.rank);
      return [{ rxcui, name, rank: Number.isFinite(rank) ? rank : 99 }];
    }).sort((a, b) => a.rank - b.rank).slice(0, 8);
  } finally {
    clearTimeout(timeout);
  }
}
export function rxNormConceptUrl(match: RxNormMedicineMatch) {
  return `https://rxnav.nlm.nih.gov/REST/rxcui/${encodeURIComponent(match.rxcui)}/properties.json`;
}
