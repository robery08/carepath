export type LifeFact = {
  kind: "date" | "measurement" | "medicine";
  label: string;
  value: string;
  numericValue?: number;
  secondaryValue?: number;
  unit?: string;
  date?: string | null;
};

export type LifeRecordForAnalysis = { id: string; text: string };
export function extractFacts(text: string): LifeFact[];
export function classifyInput(text: string, requestedKind?: string): string;
export function inspectRecords(records: LifeRecordForAnalysis[]): {
  duplicates: Array<{ ids: string[] }>;
  conflicts: Array<{ ids: string[]; label: string; date: string; values: string[] }>;
  suggestions: Array<{ ids: string[]; date: string; reason: string }>;
  factsById: Record<string, LifeFact[]>;
};
export function buildConfirmedSummary(records: Array<{
  status: string;
  createdAt: string;
  date?: string;
  title: string;
  sourceLabel: string;
  sourceName?: string;
  text: string;
}>): string;
