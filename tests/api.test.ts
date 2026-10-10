import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST as handleUpload } from "../app/api/upload/route";
import { POST as handlePipeline } from "../app/api/architect/pipeline/route";
import { GET as handleRuns } from "../app/api/architect/runs/route";
import { POST as handleFrontlineChat } from "../app/api/frontline/chat/route";
import { POST as handleVisionAnalyze } from "../app/api/vision/analyze/route";

test("API: POST /api/upload accepts valid multipart form file and creates run", async () => {
  const formData = new FormData();
  const fileContent = "SOLIDWORKS STEP AP214 CONTENT";
  const blob = new Blob([fileContent], { type: "application/octet-stream" });
  formData.append("file", blob, "clevis_test.step");
  formData.append("runType", "Part — one drawing");

  const req = new NextRequest("http://localhost:3000/api/upload", {
    method: "POST",
    body: formData,
  });

  const res = await handleUpload(req);
  assert.equal(res.status, 200);

  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(json.runId);
  assert.equal(json.fileName, "clevis_test.step");
  assert.ok(json.storageUri);
});

test("API: POST /api/upload returns 400 when file is missing", async () => {
  const formData = new FormData();
  const req = new NextRequest("http://localhost:3000/api/upload", {
    method: "POST",
    body: formData,
  });

  const res = await handleUpload(req);
  assert.equal(res.status, 400);
  const json = await res.json();
  assert.match(json.error, /No file was provided/);
});

test("API: GET /api/architect/runs returns runs list and specific run by ID", async () => {
  // List runs
  const reqList = new NextRequest("http://localhost:3000/api/architect/runs");
  const resList = await handleRuns(reqList);
  assert.equal(resList.status, 200);
  const listJson = await resList.json();
  assert.ok(Array.isArray(listJson.runs));
  assert.ok(listJson.runs.length > 0);

  // Single run
  const firstId = listJson.runs[0].id;
  const reqSingle = new NextRequest(`http://localhost:3000/api/architect/runs?id=${firstId}`);
  const resSingle = await handleRuns(reqSingle);
  assert.equal(resSingle.status, 200);
  const singleJson = await resSingle.json();
  assert.equal(singleJson.run.id, firstId);
});

test("API: POST /api/architect/pipeline executes stage 3 orientation and stage 5 view selection", async () => {
  const reqStage3 = new NextRequest("http://localhost:3000/api/architect/pipeline", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ runId: "run-1", stageId: 3 }),
  });

  const resStage3 = await handlePipeline(reqStage3);
  assert.equal(resStage3.status, 200);
  const json3 = await resStage3.json();
  assert.equal(json3.success, true);
  assert.equal(json3.stageId, 3);
  assert.ok(json3.stageResult.turned);

  const reqStage5 = new NextRequest("http://localhost:3000/api/architect/pipeline", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ runId: "run-1", stageId: 5 }),
  });

  const resStage5 = await handlePipeline(reqStage5);
  assert.equal(resStage5.status, 200);
  const json5 = await resStage5.json();
  assert.equal(json5.success, true);
  assert.equal(json5.stageId, 5);
  assert.equal(json5.stageResult.length, 6);
});

test("API: POST /api/frontline/chat processes query and attaches grounded cards", async () => {
  const req = new NextRequest("http://localhost:3000/api/frontline/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "When was the press oil last changed?" }),
  });

  const res = await handleFrontlineChat(req);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.intent, "history");
  assert.ok(json.historyData);
  assert.ok(json.historyData.entries.length > 0);
});

test("API: POST /api/vision/analyze extracts drawing metrology", async () => {
  const req = new NextRequest("http://localhost:3000/api/vision/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      gcsUri: "gs://factory-floor-cad-drawings/samples/clevis_drawing.png",
      fileName: "clevis_drawing.png",
    }),
  });

  const res = await handleVisionAnalyze(req);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(json.analysis.titleBlock);
  assert.ok(json.analysis.dimensionsExtracted.length > 0);
});

