import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateViewSelection,
  extractDrawingWithGemini,
  synthesizeGdntDimensions,
} from "../lib/gcp/vertexai";

test("Vertex AI Drawing Extraction: Digital 2D drawing (PNG/JPEG) extracts structured metrology", async () => {
  const dummyBuffer = Buffer.from("PNG_DRAWING_HEADER_BYTES");
  const result = await extractDrawingWithGemini({
    buffer: dummyBuffer,
    fileName: "clevis_bracket_drawing.png",
  });

  assert.equal(result.sourceFileName, "clevis_bracket_drawing.png");
  assert.equal(result.mimeType, "image/png");
  assert.ok(result.textBlockCount > 0);
  assert.ok(result.titleBlock);
  assert.equal(result.titleBlock.partName, "CLEVIS_BRACKET_DRAWING");
  assert.equal(result.titleBlock.toleranceStandard, "ASME Y14.5-2018");
  assert.equal(result.titleBlock.units, "mm");
  assert.ok(result.dimensionsExtracted.length >= 5);
  assert.ok(result.dimensionsExtracted.some((d) => d.text.includes("Ø10")));
  assert.ok(result.gdtSymbolsExtracted && result.gdtSymbolsExtracted.length > 0);
  assert.ok(result.viewAnnotations && result.viewAnnotations.length > 0);
  assert.ok(result.notes.length > 0);
  assert.ok(result.uncertaintyDisclaimer);
});

test("Vertex AI Drawing Extraction: Multi-page engineering PDF preserves page count and view annotations", async () => {
  const result = await extractDrawingWithGemini({
    gcsUri: "gs://factory-floor-cad-drawings/samples/multi_page_assembly_drawing.pdf",
    fileName: "multi_page_assembly_drawing.pdf",
  });

  assert.equal(result.mimeType, "application/pdf");
  assert.ok(result.pageCount >= 2);
  assert.ok(result.viewAnnotations && result.viewAnnotations.length > 0);
  assert.ok(result.viewAnnotations.some((v) => v.viewName.includes("SECTION")));
});

test("Vertex AI Drawing Extraction: Scanned drawing with blurry or ambiguous annotations represents uncertainty explicitly", async () => {
  const result = await extractDrawingWithGemini({
    gcsUri: "gs://factory-floor-cad-drawings/scans/blurry_low_res_drawing.png",
    fileName: "blurry_low_res_drawing.png",
  });

  // Must explicitly flag ambiguities rather than guessing
  assert.ok(result.ambiguities && result.ambiguities.length > 0);
  assert.ok(result.unreadableRegions && result.unreadableRegions.length > 0);
  assert.equal(result.titleBlock?.isAmbiguous, true);
  assert.ok(result.dimensionsExtracted.some((d) => d.isAmbiguous));
  assert.ok(result.uncertaintyDisclaimer?.includes("assistive"));
});

test("Vertex AI Drawing Extraction: Rejects unsupported file formats and file sizes exceeding 50MB", async () => {
  // Test 1: Unsupported extension (.zip, .exe)
  await assert.rejects(
    async () => {
      await extractDrawingWithGemini({
        buffer: Buffer.from("ZIP_BYTES"),
        fileName: "part_drawing.zip",
      });
    },
    {
      message: /Unsupported drawing format: "\.zip"/,
    }
  );

  // Test 2: File size exceeds 50MB limit
  const oversizedBuffer = Buffer.alloc(51 * 1024 * 1024); // 51 MB
  await assert.rejects(
    async () => {
      await extractDrawingWithGemini({
        buffer: oversizedBuffer,
        fileName: "massive_blueprint.png",
      });
    },
    {
      message: /exceeds maximum allowable limit of 50MB/,
    }
  );

  // Test 3: Missing both buffer and gcsUri
  await assert.rejects(
    async () => {
      await extractDrawingWithGemini({
        fileName: "missing.pdf",
      });
    },
    {
      message: /Either buffer or gcsUri must be provided/,
    }
  );
});

test("Architect Stages: Extracted drawing metrology feeds into View Selection (Stage 5) and GD&T Synthesis (Stage 7)", async () => {
  const drawingAnalysis = await extractDrawingWithGemini({
    gcsUri: "gs://factory-floor-cad-drawings/samples/clevis_drawing.png",
    fileName: "clevis_drawing.png",
  });

  // Stage 5 View Selection incorporates extracted drawing views
  const views = await evaluateViewSelection({
    fileName: "clevis_drawing.png",
    featuresCount: 10,
    drawingAnalysis,
  });
  assert.equal(views.length, 6);
  assert.ok(views.some((v) => v.view === "front" && v.required));

  // Stage 7 GD&T Synthesis incorporates extracted dimensions
  const gdnt = await synthesizeGdntDimensions({
    fileName: "clevis_drawing.png",
    drawingAnalysis,
  });
  assert.ok(gdnt.length > 0);
  assert.ok(gdnt.some((d) => d.text.includes("Ø10") || d.kind === "leader"));
});

