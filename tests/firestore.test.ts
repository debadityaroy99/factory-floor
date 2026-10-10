import test from "node:test";
import assert from "node:assert/strict";
import {
  createRunRecord,
  getRunRecord,
  listRunRecords,
  updateRunStageRecord,
} from "../lib/db/runs";
import {
  getFloorHistory,
  getInventory,
  getTrainingRecords,
  updateInventoryOnHand,
} from "../lib/db/frontline";
import { PipelineRun } from "../lib/types";

test("Firestore: Pipeline Runs CRUD lifecycle", async () => {
  const testRunId = `test-run-${Date.now()}`;
  const newRun: PipelineRun = {
    id: testRunId,
    name: "Bracket Test",
    fileName: "bracket.step",
    fileType: ".step",
    fileSizeBytes: 154000,
    timestamp: "Oct 10, 11:00 AM",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    currentStage: 1,
    stagesCompleted: "1/8 stages",
    status: "running",
    stageOutputs: {},
    logs: [],
  };

  // 1. Create
  await createRunRecord(newRun);

  // 2. Read
  const fetched = await getRunRecord(testRunId);
  assert.ok(fetched);
  assert.equal(fetched.id, testRunId);
  assert.equal(fetched.fileName, "bracket.step");

  // 3. Update stage
  const updated = await updateRunStageRecord(testRunId, {
    currentStage: 3,
    stagesCompleted: "3/8 stages",
    status: "running",
    stageOutputKey: "orientation",
    stageOutputValue: {
      turned: "kept as modelled",
      reasoning: "Stable base on Datum A",
      stableBase: "Datum A",
      normalVector: [0, 0, 1],
    },
  });

  assert.ok(updated);
  assert.equal(updated.currentStage, 3);
  assert.equal(updated.stageOutputs.orientation?.turned, "kept as modelled");

  // 4. List runs includes newly created run
  const runs = await listRunRecords();
  assert.ok(runs.some((r) => r.id === testRunId));
});

test("Firestore: Frontline shopfloor records query and inventory update", async () => {
  // 1. History records
  const history = await getFloorHistory();
  assert.ok(history.length >= 5);
  const hydraulic = history.find((h) => h.equipmentId === "PRESS-03");
  assert.ok(hydraulic);
  assert.match(hydraulic.title, /Hydraulic press/);

  // 2. Training records
  const training = await getTrainingRecords();
  assert.ok(training.length >= 1);
  assert.equal(training[0].name, "Priya S.");
  assert.ok(training[0].missingModules.includes("Chemical handling"));

  // 3. Inventory read and update
  const inventory = await getInventory();
  assert.ok(inventory.length >= 3);
  const cnmg = inventory.find((i) => i.item.includes("CNMG 432"));
  assert.ok(cnmg);

  const originalStock = cnmg.onHand;
  await updateInventoryOnHand(cnmg.id, originalStock + 50);

  const updatedInv = await getInventory();
  const updatedCnmg = updatedInv.find((i) => i.id === cnmg.id);
  assert.equal(updatedCnmg?.onHand, originalStock + 50);

  // Revert for cleanliness
  await updateInventoryOnHand(cnmg.id, originalStock);
});

