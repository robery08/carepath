import test from "node:test";
import assert from "node:assert/strict";
import { buildConfirmedSummary, classifyInput, extractFacts, inspectRecords } from "../src/lifeEngine.mjs";

test("extracts literal dates and health values without interpretation", () => {
  const facts = extractFacts("Sample training note. Fasting glucose: 126 mg/dL. Appointment 14 Oct 2026.");
  assert.ok(facts.some((fact) => fact.kind === "measurement" && fact.value === "126 mg/dL"));
  assert.ok(facts.some((fact) => fact.kind === "date" && fact.value === "2026-10-14"));
  assert.equal(classifyInput("glucose lab result", "document"), "test or measurement record");
});

test("flags an exact duplicate and a same-date conflicting value for user review", () => {
  const records = [
    { id: "a", text: "Sample record. Fasting glucose: 126 mg/dL. 2026-10-01" },
    { id: "b", text: "Sample record. Fasting glucose: 132 mg/dL. 2026-10-01" },
    { id: "c", text: "Sample record. Fasting glucose: 126 mg/dL. 2026-10-01" },
  ];
  const result = inspectRecords(records);
  assert.ok(result.duplicates.some((duplicate) => duplicate.ids.includes("a") && duplicate.ids.includes("c")));
  assert.ok(result.conflicts.some((conflict) => conflict.ids.includes("a") && conflict.ids.includes("b")));
  assert.ok(result.suggestions.some((suggestion) => suggestion.ids.includes("a") && suggestion.ids.includes("b")));
});

test("handover summary includes confirmed records only", () => {
  const summary = buildConfirmedSummary([
    { status: "confirmed", createdAt: "2026-10-01T10:00:00.000Z", title: "Visit note", sourceLabel: "Typed by you", text: "Asked about follow-up." },
    { status: "review", createdAt: "2026-10-01T11:00:00.000Z", title: "Unreviewed file", sourceLabel: "File", text: "Unverified content." },
  ]);
  assert.match(summary, /Asked about follow-up/);
  assert.doesNotMatch(summary, /Unverified content/);
});
