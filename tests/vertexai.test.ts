import assert from "node:assert";
import test from "node:test";
import {
  analyzePartOrientation,
  cleanJsonString,
  evaluateViewSelection,
  extractDrawingWithGemini,
  synthesizeGdntDimensions,
} from "../lib/gcp/vertexai";

test("Vertex AI: cleanJsonString extracts JSON from markdown code fences", () => {
  const fencedJson = '```json\n{"status": "ok", "value": 42}\n```';
  const cleaned = cleanJsonString(fencedJson);
  const parsed = JSON.parse(cleaned);
  assert.strictEqual(parsed.status, "ok");
  assert.strictEqual(parsed.value, 42);
});

test("Vertex AI: cleanJsonString extracts array with surrounding prose", () => {
  const proseJson = 'Here is the requested view selection analysis:\n[{"view":"front","required":true,"reasoning":"Primary view"}]\nHope this helps!';
  const cleaned = cleanJsonString(proseJson);
  const parsed = JSON.parse(cleaned);
  assert.ok(Array.isArray(parsed));
  assert.strictEqual(parsed[0].view, "front");
  assert.strictEqual(parsed[0].required, true);
});

test("Vertex AI: Stage 3 Part Orientation returns valid ASME orientation", async () => {
  const result = await analyzePartOrientation({ fileName: "bracket.step" });
  assert.ok(result.primaryDatumPlane);
  assert.ok(Array.isArray(result.recommendedOrientation));
  assert.strictEqual(result.recommendedOrientation.length, 3);
  assert.ok(typeof result.stabilityScore === "number");
  // Explicit fallback tracking
  assert.ok(typeof result.fallbackUsed === "boolean");
});

test("Vertex AI: Stage 5 View Selection evaluates 6 principal views per ASME Y14.3", async () => {
  const views = await evaluateViewSelection({ fileName: "clevis.step", bRepFaceCount: 18 });
  assert.strictEqual(views.length, 6);
  const frontView = views.find((v) => v.view === "front");
  assert.ok(frontView);
  assert.strictEqual(frontView.required, true);
});

test("Vertex AI: Stage 7 GD&T Synthesis produces ASME Y14.5 dimensions", async () => {
  const dims = await synthesizeGdntDimensions({ fileName: "clevis.step" });
  assert.ok(Array.isArray(dims));
  assert.ok(dims.length > 0);
  assert.ok(dims[0].id);
  assert.ok(dims[0].text);
});

test("Vertex AI: extractDrawingWithGemini enforces 50MB upload limit and rejects unsupported formats", async () => {
  // Reject unsupported format
  await assert.rejects(
    async () => {
      await extractDrawingWithGemini({
        buffer: Buffer.from("test"),
        fileName: "malicious.exe",
      });
    },
    /Unsupported drawing format/
  );

  // Reject oversized file (>50MB)
  const oversizedBuffer = Buffer.alloc(51 * 1024 * 1024);
  await assert.rejects(
    async () => {
      await extractDrawingWithGemini({
        buffer: oversizedBuffer,
        fileName: "oversized_drawing.pdf",
      });
    },
    /exceeds maximum allowable limit of 50MB/
  );
});

