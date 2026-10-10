import assert from "node:assert";
import test from "node:test";
import {
  createRunRecord,
  getRunRecord,
  listRunRecords,
  updateRunStageRecord,
} from "../lib/db/runs";
import { PipelineRun } from "../lib/types";

test("Firestore (Mock Mode): PipelineRun CRUD lifecycle and atomic stage updates", async () => {
  const { config } = await import("../lib/config");
  config.useMockServices = true;

  const timestamp = Date.now();
  const runId = `test-run-lifecycle-${timestamp}`;

  const initialRun: PipelineRun = {
    id: runId,
    name: "clevis_test",
    fileName: "clevis.step",
    fileType: ".step",
    fileSizeBytes: 2048,
    contentType: "application/octet-stream",
    timestamp: "Oct 10, 04:00 PM",
    createdAt: timestamp,
    updatedAt: timestamp,
    currentStage: 1,
    stagesCompleted: "1/8 stages",
    status: "running",
    stageOutputs: {},
    logs: [],
  };

  // 1. Create run
  const created = await createRunRecord(initialRun);
  assert.strictEqual(created.id, runId);

  // 2. Read run
  const retrieved = await getRunRecord(runId);
  assert.ok(retrieved);
  assert.strictEqual(retrieved.name, "clevis_test");
  assert.strictEqual(retrieved.currentStage, 1);

  // 3. Update stage
  const updated = await updateRunStageRecord(runId, {
    currentStage: 3,
    stagesCompleted: "3/8 stages",
    stageOutputKey: "stage3",
    stageOutputValue: {
      primaryDatumPlane: "Planar Face A",
      secondaryDatumPlane: "Bore B",
      reasoning: "Test orientation",
      stabilityScore: 0.95,
      recommendedOrientation: [0, 0, 1],
    },
    logEntry: {
      timestamp: new Date().toISOString(),
      level: "info",
      stageId: 3,
      stageName: "Orientation",
      message: "Stage 3 orientation completed.",
    },
  });

  assert.ok(updated);
  assert.strictEqual(updated.currentStage, 3);
  assert.strictEqual(updated.stagesCompleted, "3/8 stages");
  assert.ok(updated.stageOutputs.stage3);
  assert.strictEqual(updated.stageOutputs.stage3.primaryDatumPlane, "Planar Face A");
  assert.strictEqual(updated.logs?.length, 1);

  // 4. List runs
  const runs = await listRunRecords(10);
  assert.ok(Array.isArray(runs));
  assert.ok(runs.some((r) => r.id === runId));
});

test("Firestore (Strict Mode): Throws actionable error when live Firestore is unreachable or disabled", async () => {
  const { config } = await import("../lib/config");
  config.useMockServices = false;

  const testRun: PipelineRun = {
    id: `strict-run-${Date.now()}`,
    name: "strict_test",
    fileName: "part.step",
    fileType: ".step",
    fileSizeBytes: 1024,
    contentType: "application/octet-stream",
    timestamp: "Oct 10, 04:00 PM",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    currentStage: 1,
    stagesCompleted: "1/8 stages",
    status: "running",
    stageOutputs: {},
    logs: [],
  };

  await assert.rejects(
    async () => {
      await createRunRecord(testRun);
    },
    /Firestore persistence error/
  );
});

