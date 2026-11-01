import test from "node:test";
import assert from "node:assert/strict";
import { cleanFdaLabelText, fdaLabelUrl, searchFdaDrugLabels } from "../src/fdaDrugLabelSearch.ts";

test("converts submitted label markup to plain text", () => {
  assert.equal(cleanFdaLabelText("<p>Helps &amp; comforts</p><script>ignore me</script>"), "Helps & comforts");
});

test("searches brand and generic labels, removes duplicate SPL records, and exposes label sections", async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  const fixture = {
    results: [{
      id: "fda-label-1",
      set_id: "00000000-1111-2222-3333-444444444444",
      indications_and_usage: ["<p>Use exactly as directed on this package.</p>"],
      warnings: ["Do not use if the seal is broken."],
      adverse_reactions: ["Nausea may occur."],
      openfda: {
        spl_set_id: ["00000000-1111-2222-3333-444444444444"],
        brand_name: ["Example Brand"],
        generic_name: ["example ingredient"],
        manufacturer_name: ["Example Manufacturer"],
        product_type: ["HUMAN OTC DRUG"],
        route: ["ORAL"],
      },
    }],
  };
  globalThis.fetch = async (input) => {
    requests.push(String(input));
    return new Response(JSON.stringify(fixture), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  try {
    const labels = await searchFdaDrugLabels("Example Brand");
    assert.equal(requests.length, 2);
    assert.ok(requests.some((url) => url.includes("openfda.brand_name")));
    assert.ok(requests.some((url) => url.includes("openfda.generic_name")));
    assert.equal(labels.length, 1);
    assert.equal(labels[0].brandName, "Example Brand");
    assert.equal(labels[0].genericName, "example ingredient");
    assert.ok(labels[0].sections.some((section) => section.label === "Uses listed on this label" && section.text.includes("package")));
    assert.ok(labels[0].sections.some((section) => section.label === "Warnings and when not to use"));
    assert.match(fdaLabelUrl(labels[0]), /dailymed\.nlm\.nih\.gov\/dailymed\/drugInfo\.cfm\?setid=/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

