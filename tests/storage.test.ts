import assert from "node:assert";
import test from "node:test";
import {
  downloadFileFromStorage,
  uploadFileToStorage,
  validateUploadFile,
} from "../lib/gcp/storage";

test("Storage: validateUploadFile accepts supported CAD and drawing extensions", () => {
  assert.strictEqual(validateUploadFile("part.step", 1024, "application/octet-stream").valid, true);
  assert.strictEqual(validateUploadFile("part.stp", 1024, "application/octet-stream").valid, true);
  assert.strictEqual(validateUploadFile("drawing.pdf", 5000, "application/pdf").valid, true);
  assert.strictEqual(validateUploadFile("blueprint.png", 2000, "image/png").valid, true);
});

test("Storage: validateUploadFile rejects unsupported extensions, empty files, and oversized files", () => {
  assert.strictEqual(validateUploadFile("script.py", 1024, "text/plain").valid, false);
  assert.strictEqual(validateUploadFile("binary.exe", 1024, "application/octet-stream").valid, false);
  assert.strictEqual(validateUploadFile("empty.step", 0, "application/octet-stream").valid, false);
  assert.strictEqual(validateUploadFile("oversized.step", 52 * 1024 * 1024, "application/octet-stream").valid, false);
});

test("Storage (Strict Mode): Throws error without silent local fallback when live GCP is unreachable", async () => {
  // Ensure mock mode is false
  const oldEnv = process.env.USE_MOCK_SERVICES;
  process.env.USE_MOCK_SERVICES = "false";
  const { config } = await import("../lib/config");
  config.useMockServices = false;

  const runId = `strict-test-${Date.now()}`;
  const dummyBuffer = Buffer.from("CAD DATA");

  // In offline sandbox, live upload must throw rather than silently succeeding locally
  await assert.rejects(
    async () => {
      await uploadFileToStorage({
        buffer: dummyBuffer,
        fileName: "part.step",
        contentType: "application/octet-stream",
        runId,
        category: "source",
      });
    },
    /Failed to persist file/
  );

  process.env.USE_MOCK_SERVICES = oldEnv;
});

test("Storage (Mock Mode): Persists to local run folder when USE_MOCK_SERVICES=true", async () => {
  const { config } = await import("../lib/config");
  config.useMockServices = true;

  const runId = `mock-test-${Date.now()}`;
  const unsafeFileName = "../../etc/passwd..clevis#01.step";
  const dummyBuffer = Buffer.from("ISO-10303-21; CAD DATA");

  const result = await uploadFileToStorage({
    buffer: dummyBuffer,
    fileName: unsafeFileName,
    contentType: "application/octet-stream",
    runId,
    category: "source",
  });

  assert.ok(result.storageUri);
  assert.ok(!result.storageUri.includes("../"));
  assert.ok(result.storageUri.includes(runId));
  assert.strictEqual(result.isMock, true);
  assert.strictEqual(result.fileSizeBytes, dummyBuffer.length);

  // Verify download
  const downloaded = await downloadFileFromStorage(result.storageUri);
  assert.strictEqual(downloaded.toString(), dummyBuffer.toString());

  // Test artifact category
  const artifactResult = await uploadFileToStorage({
    buffer: Buffer.from("{}"),
    fileName: "artifact.json",
    contentType: "application/json",
    runId,
    category: "artifact",
    stageId: 2,
  });
  assert.ok(artifactResult.storageUri.includes("artifacts"));
});

