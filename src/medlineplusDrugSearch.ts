export type MedlinePlusDrugResult = {
  title: string;
  url: string;
  summary: string;
};

type FeedEntry = {
  title?: { _value?: string };
  link?: { href?: string };
  summary?: { _value?: string };
};

type FeedResponse = {
  feed?: {
    entry?: FeedEntry | FeedEntry[];
  };
};

const CONNECT_URL = "https://connect.medlineplus.gov/service";
const DRUG_CODE_SYSTEM = "2.16.840.1.113883.6.69";

function plainText(value: string) {
  const document = new DOMParser().parseFromString(value, "text/html");
  return (document.body.textContent || "").replace(/\s+/g, " ").trim();
}

function parseEntries(response: FeedResponse): MedlinePlusDrugResult[] {
  const rawEntries = response.feed?.entry;
  const entries = Array.isArray(rawEntries) ? rawEntries : rawEntries ? [rawEntries] : [];

  return entries.flatMap((entry) => {
    const title = entry.title?._value?.trim();
    const rawUrl = entry.link?.href;
    if (!title || !rawUrl) return [];

    try {
      const url = new URL(rawUrl);
      if (url.protocol !== "https:" || url.hostname !== "medlineplus.gov" || !url.pathname.startsWith("/druginfo/meds/")) return [];
      return [{ title, url: url.toString(), summary: entry.summary?._value ? plainText(entry.summary._value).slice(0, 1800) : "" }];
    } catch {
      return [];
    }
  });
}

/** Look up a medicine name only after the user agrees to share that name. */
export function searchMedlinePlusDrug(medicineName: string): Promise<MedlinePlusDrugResult[]> {
  const name = medicineName.trim().slice(0, 100);
  if (!name) return Promise.resolve([]);
  if (typeof document === "undefined" || typeof window === "undefined") return Promise.reject(new Error("This search is available in a browser."));

  return new Promise((resolve, reject) => {
    const callbackName = `carepathDrug_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const targetWindow = window as unknown as Record<string, unknown>;
    const script = document.createElement("script");
    let settled = false;

    const cleanup = () => {
      window.clearTimeout(timeout);
      script.remove();
      delete targetWindow[callbackName];
    };
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      callback();
    };
    const timeout = window.setTimeout(() => finish(() => reject(new Error("The medicine source did not respond in time."))), 12000);

    targetWindow[callbackName] = (payload: unknown) => {
      finish(() => resolve(parseEntries(payload as FeedResponse)));
    };

    const params = new URLSearchParams({
      "mainSearchCriteria.v.cs": DRUG_CODE_SYSTEM,
      "mainSearchCriteria.v.dn": name,
      "informationRecipient.languageCode.c": "en",
      knowledgeResponseType: "application/javascript",
      callback: callbackName,
    });
    script.async = true;
    script.src = `${CONNECT_URL}?${params.toString()}`;
    script.onerror = () => finish(() => reject(new Error("The medicine source could not be reached.")));
    document.head.appendChild(script);
  });
}
