const DATE_PATTERNS = [
  /\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/g,
  /\b(\d{1,2})\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(20\d{2})\b/gi,
];

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function normalizedDate(year, month, day) {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const value = new Date(Date.UTC(y, m - 1, d));
  if (value.getUTCFullYear() !== y || value.getUTCMonth() !== m - 1 || value.getUTCDate() !== d) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function extractFacts(text) {
  const facts = [];
  const dates = [];
  for (const match of text.matchAll(DATE_PATTERNS[0])) {
    const date = normalizedDate(match[1], match[2], match[3]);
    if (date) dates.push(date);
  }
  for (const match of text.matchAll(DATE_PATTERNS[1])) {
    const month = MONTHS.findIndex((value) => value === match[2].slice(0, 3).toLowerCase()) + 1;
    const date = normalizedDate(match[3], month, match[1]);
    if (date) dates.push(date);
  }
  for (const date of [...new Set(dates)]) facts.push({ kind: "date", label: "Date mentioned", value: date, date });

  const glucose = /(?:fasting\s+)?(?:blood\s+)?glucose\s*(?:reading)?\s*[:=–-]?\s*(\d{2,3}(?:\.\d+)?)\s*(mg\s*\/\s*d[l1]|mmol\s*\/\s*l)?/gi;
  for (const match of text.matchAll(glucose)) {
    const unit = (match[2] || "unit not stated").replace(/\s+/g, "");
    facts.push({ kind: "measurement", label: "Glucose value mentioned", value: `${match[1]} ${unit}`, numericValue: Number(match[1]), unit, date: dates[0] || null });
  }

  const bloodPressure = /(?:blood\s+pressure|\bBP)\s*[:=–-]?\s*(\d{2,3})\s*\/\s*(\d{2,3})\s*(mmhg)?/gi;
  for (const match of text.matchAll(bloodPressure)) {
    facts.push({ kind: "measurement", label: "Blood pressure mentioned", value: `${match[1]}/${match[2]} ${match[3] || "unit not stated"}`, numericValue: Number(match[1]), secondaryValue: Number(match[2]), unit: match[3] || "unit not stated", date: dates[0] || null });
  }

  const medicine = /(?:medicine|medication|tablet|drug)\s*[:=–-]\s*([^\n.;]{2,80})/gi;
  for (const match of text.matchAll(medicine)) facts.push({ kind: "medicine", label: "Medicine name written", value: match[1].trim(), date: dates[0] || null });
  return facts;
}

export function classifyInput(text, requestedKind = "note") {
  if (requestedKind !== "document") return requestedKind;
  const lower = text.toLowerCase();
  if (/prescription|tablet|medicine|medication|drug\s*:/i.test(lower)) return "prescription or medicine record";
  if (/lab|glucose|blood pressure|test result|specimen|reference range/i.test(lower)) return "test or measurement record";
  if (/appointment|follow[- ]?up|clinician|doctor|visit/i.test(lower)) return "appointment or visit note";
  return "document text";
}

export function inspectRecords(records) {
  const duplicates = [];
  const conflicts = [];
  const suggestions = [];
  const factsById = new Map(records.map((record) => [record.id, extractFacts(record.text)]));
  for (let left = 0; left < records.length; left += 1) {
    for (let right = left + 1; right < records.length; right += 1) {
      const a = records[left];
      const b = records[right];
      const cleanA = a.text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
      const cleanB = b.text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
      if (cleanA.length > 25 && cleanA === cleanB) duplicates.push({ ids: [a.id, b.id] });
      const sameText = cleanA.length > 25 && cleanA === cleanB;
      const datesA = new Set((factsById.get(a.id) || []).filter((fact) => fact.kind === "date").map((fact) => fact.value));
      const sharedDate = (factsById.get(b.id) || []).find((fact) => fact.kind === "date" && datesA.has(fact.value));
      if (sharedDate && !sameText) suggestions.push({ ids: [a.id, b.id], date: sharedDate.value, reason: `Both entries mention ${sharedDate.value}. Check the source before grouping them.` });
      for (const factA of factsById.get(a.id) || []) {
        if (factA.kind !== "measurement" || !factA.date || factA.numericValue === undefined) continue;
        const factB = (factsById.get(b.id) || []).find((item) => item.kind === "measurement" && item.label === factA.label && item.date === factA.date && item.numericValue !== undefined && item.numericValue !== factA.numericValue);
        if (factB) conflicts.push({ ids: [a.id, b.id], label: factA.label, date: factA.date, values: [factA.value, factB.value] });
      }
    }
  }
  return { duplicates, conflicts, suggestions, factsById: Object.fromEntries(factsById) };
}

export function buildConfirmedSummary(records) {
  const confirmed = records.filter((record) => record.status === "confirmed");
  if (!confirmed.length) return "No items have been confirmed yet. Review an inbox item to start a source-linked story.";
  return confirmed
    .slice()
    .sort((a, b) => (a.date || a.createdAt.slice(0, 10)).localeCompare(b.date || b.createdAt.slice(0, 10)))
    .map((record) => `${record.date || record.createdAt.slice(0, 10)} · ${record.title} (${record.sourceName || record.sourceLabel}): ${record.text.trim()}`)
    .join("\n\n");
}
