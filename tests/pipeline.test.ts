import assert from "node:assert";
import test from "node:test";
import { NextRequest } from "next/server";
import { POST as pipelinePostHandler } from "../app/api/architect/pipeline/route";
import { GET as runsGetHandler } from "../app/api/architect/runs/route";
import { POST as uploadPostHandler } from "../app/api/upload/route";
import { checkVertexAiHealth } from "../lib/gcp/vertexai";
import { checkStorageHealth } from "../lib/gcp/storage";
import { checkFirestoreHealth } from "../lib/gcp/firestore";

test("Architect Workflow: Full end-to-end run lifecycle from upload to Stage 8 completion", async () => {
  const { config } = await import("../lib/config");
  config.useMockServices = true;

  // 1. Simulate multipart file upload via POST /api/upload
  const formData = new FormData();
  const fileBlob = new Blob(["ISO-10303-21; CAD DATA TEST"], { type: "application/octet-stream" });
  formData.append("file", fileBlob, "clevis_test_part.step");

  const uploadReq = new Request("http://localhost:3000/api/upload", {
    method: "POST",
    body: formData,
  });

  const uploadRes = await uploadPostHandler(uploadReq as unknown as NextRequest);
  assert.strictEqual(uploadRes.status, 201);
  const uploadJson = await uploadRes.json();
  assert.strictEqual(uploadJson.success, true);
  assert.ok(uploadJson.run.id);
  assert.ok(uploadJson.storage.storageUri);

  const runId = uploadJson.run.id;

  // 2. Execute full pipeline via POST /api/architect/pipeline
  const pipelineReq = new Request("http://localhost:3000/api/architect/pipeline", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ runId, targetStage: 8 }),
  });

  const pipelineRes = await pipelinePostHandler(pipelineReq as unknown as NextRequest);
  assert.strictEqual(pipelineRes.status, 200);
  const pipelineJson = await pipelineRes.json();
  assert.strictEqual(pipelineJson.success, true);
  assert.strictEqual(pipelineJson.run.currentStage, 8);
  assert.strictEqual(pipelineJson.run.status, "success");

  // Verify Stage Outputs
  const outputs = pipelineJson.run.stageOutputs;
  assert.ok(outputs.stage1, "Stage 1 summary output missing");
  assert.strictEqual(outputs.stage1.bRepFaceCount, 18);
  assert.ok(outputs.stage2, "Stage 2 six views output missing");
  assert.ok(outputs.stage3, "Stage 3 orientation output missing");
  assert.ok(outputs.stage4, "Stage 4 feature tree output missing");
  assert.strictEqual(outputs.stage4.features.length, 10);
  assert.ok(outputs.stage5, "Stage 5 view selection output missing");
  assert.strictEqual(outputs.stage5.length, 6);
  assert.ok(outputs.stage6, "Stage 6 derived views output missing");
  assert.ok(outputs.stage7, "Stage 7 GD&T output missing");
  assert.ok(outputs.stage8, "Stage 8 sheet output missing");

  // Verify Cloud Storage Artifacts were generated and recorded
  assert.ok(Array.isArray(pipelineJson.run.artifacts));
  assert.ok(pipelineJson.run.artifacts.length >= 3);
  assert.ok(pipelineJson.run.artifacts.some((a: { name: string }) => a.name === "views_projection_spec.json"));
  assert.ok(pipelineJson.run.artifacts.some((a: { name: string }) => a.name === "feature_tree.json"));
  assert.ok(pipelineJson.run.artifacts.some((a: { name: string }) => a.name === "sheet_layout_spec.json"));

  // 3. Verify retrieval via GET /api/architect/runs
  const runsReq = new Request(`http://localhost:3000/api/architect/runs?id=${runId}`);
  const runsRes = await runsGetHandler(runsReq as unknown as NextRequest);
  assert.strictEqual(runsRes.status, 200);
  const runsJson = await runsRes.json();
  assert.strictEqual(runsJson.run.id, runId);
  assert.strictEqual(runsJson.run.status, "success");
});

test("Health Diagnostics: Service health checks return structured diagnostic reports", async () => {
  const [vertex, storage, firestore] = await Promise.all([
    checkVertexAiHealth(),
    checkStorageHealth(),
    checkFirestoreHealth(),
  ]);

  assert.ok(vertex.status);
  assert.ok(vertex.details);
  assert.ok(storage.status);
  assert.ok(storage.details);
  assert.ok(firestore.status);
  assert.ok(firestore.details);
});
