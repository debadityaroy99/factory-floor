import test from "node:test";
import assert from "node:assert/strict";
import { validateUploadFile, uploadToStorage } from "../lib/gcp/storage";

test("GCS Storage: validateUploadFile accepts supported CAD STEP files", () => {
  const result = validateUploadFile("clevis.step", 290000, "application/octet-stream");
  assert.equal(result.valid, true);
  assert.equal(result.error, undefined);
});

test("GCS Storage: validateUploadFile accepts supported 2D drawings (PDF, PNG, SVG)", () => {
  const pdfRes = validateUploadFile("bracket_dwg.pdf", 500000, "application/pdf");
  assert.equal(pdfRes.valid, true);

  const pngRes = validateUploadFile("drawing_scan.png", 1200000, "image/png");
  assert.equal(pngRes.valid, true);
});

test("GCS Storage: validateUploadFile rejects unsupported extensions", () => {
  const result = validateUploadFile("script.exe", 1000, "application/octet-stream");
  assert.equal(result.valid, false);
  assert.match(result.error || "", /not supported/);
});

test("GCS Storage: validateUploadFile rejects empty files", () => {
  const result = validateUploadFile("empty.step", 0, "application/octet-stream");
  assert.equal(result.valid, false);
  assert.match(result.error || "", /empty/);
});

test("GCS Storage: validateUploadFile rejects files exceeding 50MB limit", () => {
  const oversized = 60 * 1024 * 1024;
  const result = validateUploadFile("huge.step", oversized, "application/octet-stream");
  assert.equal(result.valid, false);
  assert.match(result.error || "", /maximum limit/);
});

test("GCS Storage: uploadToStorage writes file and returns storage metadata", async () => {
  const buffer = Buffer.from("STEP-CAD-SAMPLE-GEOMETRY-DATA");
  const result = await uploadToStorage({
    buffer,
    fileName: "test_part.step",
    contentType: "application/octet-stream",
    destinationPrefix: "test_uploads",
  });

  assert.equal(result.fileName, "test_part.step");
  assert.equal(result.fileSizeBytes, buffer.length);
  assert.ok(result.storageUri.length > 0);
});

