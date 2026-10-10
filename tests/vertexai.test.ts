import test from "node:test";
import assert from "node:assert/strict";
import {
  analyzePartOrientation,
  evaluateViewSelection,
  synthesizeGdntDimensions,
  generateFrontlineResponse,
} from "../lib/gcp/vertexai";
import {
  getFloorHistory,
  getInventory,
  getTrainingRecords,
} from "../lib/db/frontline";

test("Vertex AI: analyzePartOrientation generates stable orientation reasoning", async () => {
  const result = await analyzePartOrientation({
    fileName: "clevis.step",
    boundingBox: "150 × 120 × 88 mm",
    faceCount: 114,
  });

  assert.ok(result.turned);
  assert.ok(result.reasoning.length > 20);
  assert.ok(result.stableBase);
  assert.equal(result.normalVector.length, 3);
});

test("Vertex AI: evaluateViewSelection evaluates 6 principal views per ASME Y14.3", async () => {
  const views = await evaluateViewSelection({
    fileName: "clevis.step",
    featuresCount: 10,
  });

  assert.equal(views.length, 6);
  const frontView = views.find((v) => v.view === "front");
  assert.ok(frontView);
  assert.equal(frontView.required, true);

  const backView = views.find((v) => v.view === "back");
  assert.ok(backView);
  assert.equal(backView.required, false);
});

test("Vertex AI: synthesizeGdntDimensions produces ASME Y14.5 constraints", async () => {
  const dims = await synthesizeGdntDimensions({
    fileName: "clevis.step",
  });

  assert.ok(dims.length >= 10);
  assert.ok(dims.some((d) => d.kind === "leader"));
  assert.ok(dims.some((d) => d.kind === "linear"));
});

test("Vertex AI: generateFrontlineResponse categorizes intents and preserves deterministic floor data", async () => {
  const floorHistory = await getFloorHistory();
  const inventory = await getInventory();
  const training = await getTrainingRecords();

  // Test 1: Oil history query
  const historyRes = await generateFrontlineResponse({
    userQuery: "When was the press oil last changed?",
    floorHistory,
    inventory,
    training,
  });
  assert.equal(historyRes.intent, "history");
  assert.ok(historyRes.replyText);

  // Test 2: Inventory stock check
  const stockRes = await generateFrontlineResponse({
    userQuery: "Stock check: CNMG inserts",
    floorHistory,
    inventory,
    training,
  });
  assert.equal(stockRes.intent, "inventory");
  assert.equal(stockRes.canApprovePo, true);

  // Test 3: Equipment drift alert
  const driftRes = await generateFrontlineResponse({
    userQuery: "Any equipment drifting?",
    floorHistory,
    inventory,
    training,
  });
  assert.equal(driftRes.intent, "alert");

  // Test 4: Training certification check
  const trainRes = await generateFrontlineResponse({
    userQuery: "Priya's training status",
    floorHistory,
    inventory,
    training,
  });
  assert.equal(trainRes.intent, "training");

  // Test 5: PO approval
  const approveRes = await generateFrontlineResponse({
    userQuery: "approve",
    floorHistory,
    inventory,
    training,
  });
  assert.equal(approveRes.intent, "po_approval");
  assert.match(approveRes.outcomePill || "", /PO-1042/);
});

