import test from "node:test";
import assert from "node:assert/strict";
import { rxNormConceptUrl, searchRxNormMedicineNames } from "../src/rxnormMedicineSearch.ts";

test("returns named active RxNorm suggestions and de-duplicates concepts", async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = "";
  globalThis.fetch = async (input) => {
    requestedUrl = String(input);
    return new Response(JSON.stringify({ approximateGroup: { candidate: [
      { rxcui: "123", name: "acetaminophen 500 MG Oral Tablet", rank: "1", source: "RXNORM" },
      { rxcui: "123", name: "duplicate result", rank: "1", source: "RXNORM" },
      { rxcui: "456", name: "other vocabulary", rank: "1", source: "OTHER" },
      { rxcui: "321", name: "acetaminophen 325 MG Oral Tablet", rank: "2", source: "RXNORM" },
    ] } }), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  try {
    const matches = await searchRxNormMedicineNames("acetaminofin");
    const url = new URL(requestedUrl);
    assert.equal(url.searchParams.get("term"), "acetaminofin");
    assert.equal(url.searchParams.get("option"), "1");
    assert.deepEqual(matches, [
      { rxcui: "123", name: "acetaminophen 500 MG Oral Tablet", rank: 1 },
      { rxcui: "321", name: "acetaminophen 325 MG Oral Tablet", rank: 2 },
    ]);
    assert.match(rxNormConceptUrl(matches[0]), /rxnav\.nlm\.nih\.gov\/REST\/rxcui\/123\/properties\.json$/);
  } finally { globalThis.fetch = originalFetch; }
});

test("does not call RxNorm for an empty query", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("fetch should not be called"); };
  try { assert.deepEqual(await searchRxNormMedicineNames("   "), []); }
  finally { globalThis.fetch = originalFetch; }
});
