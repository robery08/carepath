export type CareContentKind = "medicine" | "condition" | "self-care";
export type CareContentStatus = "draft" | "published" | "archived";

export type CareContent = {
  id: string;
  kind: CareContentKind;
  title: string;
  keywords: string[];
  purposeEn: string;
  purposeKn: string;
  summaryEn: string;
  summaryKn: string;
  pointsEn: string[];
  pointsKn: string[];
  sourceName: string;
  sourceUrl: string;
  status: CareContentStatus;
  revision: number;
  createdAt: string;
  updatedAt: string;
};

export type CareContentChange = {
  id: string;
  action: "published" | "updated" | "archived" | "rollback";
  contentTitle: string;
  revision: number;
  at: string;
  actor: string;
  snapshot: CareContent[];
};

const CONTENT_KEY = "carepath_admin_content_v1";
const HISTORY_KEY = "carepath_admin_history_v1";

function readArray<T>(key: string): T[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value as T[] : [];
  } catch {
    return [];
  }
}

export function getCareContent(): CareContent[] {
  return readArray<CareContent>(CONTENT_KEY);
}

export function getPublishedCareContent(): CareContent[] {
  return getCareContent().filter((item) => item.status === "published");
}

export function getCareContentHistory(): CareContentChange[] {
  return readArray<CareContentChange>(HISTORY_KEY);
}

export function saveCareContent(items: CareContent[]): boolean {
  try {
    localStorage.setItem(CONTENT_KEY, JSON.stringify(items));
    localStorage.setItem("carepath_last_local_save", new Date().toISOString());
    window.dispatchEvent(new Event("carepath:refresh"));
    return true;
  } catch {
    return false;
  }
}

export function saveCareContentHistory(items: CareContentChange[]): boolean {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 50)));
    return true;
  } catch {
    return false;
  }
}

export function findPublishedCareContent(query: string, kind?: CareContentKind): CareContent | null {
  const normalized = query.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  if (!normalized) return null;
  return getPublishedCareContent().find((item) => {
    if (kind && item.kind !== kind) return false;
    const title = item.title.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    const keywords = item.keywords.map((word) => word.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim()).filter(Boolean);
    return normalized.includes(title) || keywords.some((word) => normalized.includes(word));
  }) ?? null;
}

export const CARE_CONTENT_STORAGE_KEYS = [CONTENT_KEY, HISTORY_KEY] as const;
