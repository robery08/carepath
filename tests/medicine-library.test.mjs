import test from "node:test";
import assert from "node:assert/strict";
import { MEDICINE_CATEGORIES, matchingProducts, medicineProductForm, medicineProductStrength, parseRxNormMedicineProducts, searchRxNormMedicineProducts } from "../src/medicineLibrary.ts";

test("all requested health areas have live-search category terms", () => {
  assert.equal(MEDICINE_CATEGORIES.length, 25);
  assert.equal(new Set(MEDICINE_CATEGORIES.map((category) => category.id)).size, 25);
  for (const category of MEDICINE_CATEGORIES) {
    assert.ok(category.name.trim(), `missing name for ${category.id}`);
    assert.ok(category.description.trim(), `missing description for ${category.id}`);
    assert.ok(category.terms.length > 0, `missing search terms for ${category.id}`);
  }
});

test("parses generic and brand RxNorm products while ignoring non-product terms", () => {
  const products = parseRxNormMedicineProducts({ drugGroup: { conceptGroup: [
    { tty: "SCD", conceptProperties: { rxcui: "111", name: "metformin 500 MG Oral Tablet", synonym: "metformin 500 MG tablet", tty: "SCD", language: "ENG", suppress: "N" } },
    { tty: "SCD", conceptProperties: { rxcui: "112", name: "amoxicillin 500 MG / clavulanate 125 MG Oral Tablet", tty: "SCD", language: "ENG", suppress: "N" } },
    { tty: "SBD", conceptProperties: [{ rxcui: "222", name: "metformin 500 MG Oral Tablet [Glucophage]", synonym: "Glucophage 500 MG Oral Tablet", tty: "SBD", language: "ENG", suppress: "N" }] },
    { tty: "IN", conceptProperties: { rxcui: "333", name: "metformin", tty: "IN", language: "ENG", suppress: "N" } },
    { tty: "SCD", conceptProperties: { rxcui: "444", name: "suppressed product", tty: "SCD", language: "ENG", suppress: "Y" } },
  ] } });
  assert.equal(products.length, 3);
  assert.equal(products.find((product) => product.rxcui === "111")?.genericName, "metformin");
  assert.equal(products.find((product) => product.rxcui === "222")?.brandName, "Glucophage");
  assert.equal(products.find((product) => product.rxcui === "222")?.genericName, "metformin");
  assert.match(products.find((product) => product.rxcui === "112")?.genericName ?? "", /amoxicillin.*clavulanate/i);
});

test("extracts strengths and dosage form names from source concepts", () => {
  assert.equal(medicineProductStrength("acetaminophen 500 MG Oral Tablet"), "500 MG");
  assert.equal(medicineProductForm("albuterol 90 MCG/ACT Metered Dose Inhaler"), "Inhaler");
  assert.equal(matchingProducts(parseRxNormMedicineProducts({ drugGroup: { conceptGroup: [{ tty: "SCD", conceptProperties: { rxcui: "911", name: "albuterol 90 MCG/ACT Metered Dose Inhaler", tty: "SCD", language: "ENG", suppress: "N" } }] } }), { form: "inhaler" }).length, 1);
  assert.equal(medicineProductForm("metformin 500 MG Oral Tablet [Brand]"), "Tablet");
  assert.equal(medicineProductForm("concept with no form"), "Form not listed");
});

test("catalogue filters brand, generic, and dosage form concepts", () => {
  const products = parseRxNormMedicineProducts({ drugGroup: { conceptGroup: [
    { tty: "SCD", conceptProperties: { rxcui: "511", name: "metformin 500 MG Oral Tablet", tty: "SCD", language: "ENG", suppress: "N" } },
    { tty: "SBD", conceptProperties: { rxcui: "522", name: "metformin 500 MG Oral Tablet [Glucophage]", tty: "SBD", language: "ENG", suppress: "N" } },
    { tty: "SCD", conceptProperties: { rxcui: "533", name: "metformin 500 MG Oral Capsule", tty: "SCD", language: "ENG", suppress: "N" } },
  ] } });
  assert.equal(matchingProducts(products, { type: "brand", form: "tablet" }).length, 1);
  assert.equal(matchingProducts(products, { type: "generic", form: "capsule" }).length, 1);
  assert.equal(matchingProducts(products, { query: "Glucophage" }).length, 1);
});

test("fetches live product records using only the medicine term and caches it briefly", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  let requestedUrl = "";
  globalThis.fetch = async (input) => {
    calls += 1;
    requestedUrl = String(input);
    return new Response(JSON.stringify({ drugGroup: { conceptGroup: [{ tty: "SCD", conceptProperties: { rxcui: "411", name: "metformin 500 MG Oral Tablet", tty: "SCD", language: "ENG", suppress: "N" } }] } }), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  try {
    const first = await searchRxNormMedicineProducts("catalogue-test-metformin");
    const second = await searchRxNormMedicineProducts(" catalogue-test-metformin ");
    assert.equal(new URL(requestedUrl).searchParams.get("name"), "catalogue-test-metformin");
    assert.deepEqual(second, first);
    assert.equal(first.length, 1);
    assert.equal(calls, 1);
  } finally { globalThis.fetch = originalFetch; }
});

