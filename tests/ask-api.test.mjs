import test from "node:test";
import assert from "node:assert/strict";
import { onRequest } from "../functions/api/ask.js";

const origin = "https://carepath.example";
const makeRequest = (body, options = {}) => new Request(`${origin}/api/ask`, {
  method: options.method ?? "POST",
  headers: { "Content-Type": "application/json", Origin: origin, ...options.headers },
  body: typeof body === "string" ? body : JSON.stringify(body),
});

test("rejects non-POST requests and cross-origin requests", async () => {
  const get = await onRequest({ request: new Request(`${origin}/api/ask`), env: {} });
  assert.equal(get.status, 405);
  const crossOrigin = await onRequest({ request: makeRequest({ question: "hello" }, { headers: { Origin: "https://attacker.example" } }), env: {} });
  assert.equal(crossOrigin.status, 403);
});

test("rejects malformed and oversized requests before calling the provider", async () => {
  const malformed = await onRequest({ request: makeRequest("{"), env: {} });
  assert.equal(malformed.status, 400);
  const tooLarge = await onRequest({ request: makeRequest({ question: "x".repeat(57000) }), env: {} });
  assert.equal(tooLarge.status, 413);
  const empty = await onRequest({ request: makeRequest({ question: "  " }), env: {} });
  assert.equal(empty.status, 400);
});

test("reports missing server configuration without exposing secrets", async () => {
  const response = await onRequest({ request: makeRequest({ question: "What is a cough?" }), env: {} });
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "assistant_not_configured" });
});

test("sends selected question and document excerpt server-side and returns secure web citations", async (context) => {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";
  let capturedInit;
  globalThis.fetch = async (url, init) => {
    capturedUrl = String(url);
    capturedInit = init;
    return Response.json({ candidates: [{
      content: { parts: [{ text: "Please review this with a clinician." }] },
      groundingMetadata: { groundingChunks: [
        { web: { title: "Official health source", uri: "https://www.example.gov/health" } },
        { web: { title: "Unsafe", uri: "javascript:alert(1)" } },
      ] },
    }] });
  };
  context.after(() => { globalThis.fetch = originalFetch; });
  const response = await onRequest({
    request: makeRequest({ question: "Explain this result", language: "en", messages: [{ role: "user", text: "Earlier question" }, { role: "system", text: "Should be removed" }], documentExcerpt: "Hemoglobin: 12" }),
    env: { GEMINI_API_KEY: "server-only-test-key", CAREPATH_GEMINI_MODEL: "gemini-test-flash" },
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { answer: "Please review this with a clinician.", sources: [{ title: "Official health source", url: "https://www.example.gov/health" }] });
  assert.match(capturedUrl, /models\/gemini-test-flash:generateContent$/);
  assert.equal(capturedUrl.includes("server-only-test-key"), false);
  assert.equal(capturedInit.headers["x-goog-api-key"], "server-only-test-key");
  const requestBody = JSON.parse(capturedInit.body);
  assert.equal(requestBody.contents.length, 2);
  assert.match(requestBody.contents[1].parts[0].text, /Hemoglobin: 12/);
  assert.match(requestBody.systemInstruction.parts[0].text, /Never tell a person which medicine\/tablet to take/);
  assert.deepEqual(requestBody.tools, [{ google_search: {} }]);
});

test("does not reveal provider errors", async (context) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("private provider diagnostics", { status: 429 });
  context.after(() => { globalThis.fetch = originalFetch; });
  const response = await onRequest({ request: makeRequest({ question: "What is a cough?" }), env: { GEMINI_API_KEY: "server-only-test-key" } });
  assert.equal(response.status, 429);
  assert.deepEqual(await response.json(), { error: "provider_rate_limited" });
});
