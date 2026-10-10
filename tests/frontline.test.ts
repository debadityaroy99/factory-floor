import test from "node:test";
import assert from "node:assert/strict";
import { getDocuments, searchKnowledgeRAG } from "../lib/db/documents";
import { getEquipmentById, getEquipmentList, updateEquipmentAnomaly } from "../lib/db/equipment";
import { acknowledgeEscalation, triggerEscalation } from "../lib/db/escalations";
import { approveKnowledgeRecord, createKnowledgeRecord, searchTribalKnowledge } from "../lib/db/knowledge";
import { createWorkOrder, updateWorkOrderStatus } from "../lib/db/workorders";
import { getEquipmentKpis, getPlantOverviewAnalytics, getTelemetryHistory } from "../lib/gcp/bigquery";
import { generateFrontlineResponse } from "../lib/gcp/vertexai";
import { GET as handleEquipmentGet } from "../app/api/frontline/equipment/route";
import { GET as handleWorkOrdersGet, POST as handleWorkOrdersPost } from "../app/api/frontline/work-orders/route";
import { GET as handleKnowledgeGet } from "../app/api/frontline/knowledge/route";
import { GET as handleAnalyticsGet } from "../app/api/frontline/analytics/route";
import { NextRequest } from "next/server";

test("Frontline Equipment: Registry, Health Scores, and Anomaly Detection", async () => {
  const equipment = await getEquipmentList();
  assert.ok(equipment.length >= 5);

  const press = await getEquipmentById("PRESS-03");
  assert.ok(press);
  assert.equal(press.id, "PRESS-03");
  assert.equal(press.type, "PRESS");
  assert.equal(press.criticality, "A");
  assert.equal(press.activeAnomalies.length, 1);

  const anomaly = press.activeAnomalies[0];
  assert.equal(anomaly.isConfirmedFailure, false); // Distinguishes anomaly from failure
  assert.equal(anomaly.metricName, "Hydraulic Oil Temp");
  assert.ok(anomaly.zScore > 2.0);
  assert.ok(anomaly.evidenceCalculation.includes("σ"));
  assert.ok(anomaly.preventiveRecommendation.includes("SOP-HYD-11"));

  // Verify health degradation on critical anomaly update
  const updatedPress = await updateEquipmentAnomaly("PRESS-03", {
    ...anomaly,
    id: "anom-press-crit",
    severity: "CRITICAL",
    measuredValue: 74.5,
    zScore: 4.8,
  });
  assert.ok(updatedPress);
  assert.equal(updatedPress.status, "CRITICAL");
  assert.ok(updatedPress.healthScore <= 50);
});

test("Frontline RAG: Grounded Citations, Role Filtering, and Refusal Contract", async () => {
  // Test 1: Hydraulic thermal drift cites SOP-HYD-11
  const citations = await searchKnowledgeRAG("hydraulic oil thermal drift heat exchanger", "OPERATOR");
  assert.ok(citations.length > 0);
  assert.equal(citations[0].docNumber, "SOP-HYD-11");
  assert.ok(citations[0].section.includes("§3.2") || citations[0].section.includes("§1.1"));
  assert.ok(citations[0].relevanceScore >= 0.5);

  // Test 2: Spindle coolant drop cites SOP-CNC-07
  const cncCitations = await searchKnowledgeRAG("CNC coolant delivery pressure drop strainer", "OPERATOR");
  assert.ok(cncCitations.length > 0);
  assert.equal(cncCitations[0].docNumber, "SOP-CNC-07");
  assert.ok(cncCitations.some((c) => c.section.includes("§4.1")));

  // Test 3: Conveyor bearing vibration cites SOP-MNT-04
  const convCitations = await searchKnowledgeRAG("conveyor drive bearing vibration 6205 replacement", "OPERATOR");
  assert.ok(convCitations.length > 0);
  assert.equal(convCitations[0].docNumber, "SOP-MNT-04");
  assert.ok(convCitations.some((c) => c.section.includes("§3.0") || c.section.includes("§1.2")));

  // Test 4: Role-based filtering (Chemical handling SOP-CHM-01 is restricted to TECHNICIAN/SUPERVISOR)
  const operatorDocs = await getDocuments("OPERATOR");
  const techDocs = await getDocuments("TECHNICIAN");
  assert.ok(!operatorDocs.some((d) => d.docNumber === "SOP-CHM-01"));
  assert.ok(techDocs.some((d) => d.docNumber === "SOP-CHM-01"));

  // Test 5: Refusal contract for unknown equipment
  const unknownCitations = await searchKnowledgeRAG("quantum plasma laser core frequency", "OPERATOR");
  assert.equal(unknownCitations.length, 0);

  const refusalResp = await generateFrontlineResponse({
    userQuery: "How do I align the laser optics on the plasma cutter?",
    citations: unknownCitations,
  });
  assert.ok(refusalResp.replyText.includes("No verified company procedure"));
});

test("Frontline Work Orders: Lifecycle Transitions, Routing, and Duplicate Prevention", async () => {
  // Test 1: Create work order with automated routing to hydraulics team
  const createRes = await createWorkOrder({
    equipmentId: "PRESS-03",
    equipmentName: "Hydraulic Stamping Press #3",
    title: "Inspect cooling solenoid for Press-03",
    description: "Thermal drift alert test",
    severity: "HIGH",
    supportingEvidence: ["Z=2.36σ oil temp drift"],
    recommendedAction: "Flush heat exchanger per SOP-HYD-11 §3.2",
    sourceReferences: ["SOP-HYD-11 §3.2"],
  });

  assert.equal(createRes.isDuplicate, false);
  const wo = createRes.workOrder;
  assert.equal(wo.assignedTeam, "Mechanical / Hydraulics Team");
  assert.equal(wo.priority, "P2");
  assert.ok(wo.cmmsReferenceId?.startsWith("CMMS-INT-"));

  // Test 2: Duplicate prevention check
  const duplicateRes = await createWorkOrder({
    equipmentId: "PRESS-03",
    equipmentName: "Hydraulic Stamping Press #3",
    title: "Inspect cooling solenoid for Press-03",
    description: "Another duplicate attempt",
    severity: "HIGH",
  });
  assert.equal(duplicateRes.isDuplicate, true);
  assert.equal(duplicateRes.workOrder.id, wo.id);

  // Test 3: Lifecycle transitions (IN_PROGRESS -> COMPLETED -> VERIFIED)
  const inProgressWo = await updateWorkOrderStatus(wo.id, "IN_PROGRESS", "Devin K.", "Commencing work");
  assert.ok(inProgressWo);
  assert.equal(inProgressWo.status, "IN_PROGRESS");

  const completedWo = await updateWorkOrderStatus(wo.id, "COMPLETED", "Devin K.", "Work finished");
  assert.ok(completedWo);
  assert.equal(completedWo.status, "COMPLETED");
  assert.ok(completedWo.completedAt);

  const verifiedWo = await updateWorkOrderStatus(wo.id, "VERIFIED", "Marcus V.", "Supervisor verified");
  assert.ok(verifiedWo);
  assert.equal(verifiedWo.status, "VERIFIED");
  assert.ok(verifiedWo.verifiedAt);
  assert.ok(verifiedWo.auditLog.length >= 4);
});

test("Frontline Escalations: Safety Critical Protocols and Acknowledgement", async () => {
  // Test 1: Safety-critical emergency triggers SOP-SFT-02
  const esc = await triggerEscalation({
    equipmentId: "PRESS-03",
    severity: "CRITICAL",
    reason: "Hydraulic reservoir temperature exceeded 75°C thermal runaway threshold",
    evidence: "Oil temp sensor = 75.8°C",
    safetyCritical: true,
  });

  assert.equal(esc.escalation.safetyCritical, true);
  assert.equal(esc.escalation.severity, "CRITICAL");
  assert.ok(esc.escalation.siteProcedureCitation?.includes("SOP-SFT-02"));
  assert.equal(esc.escalation.acknowledged, false);

  // Test 2: Supervisor acknowledgement
  const ack = await acknowledgeEscalation(
    esc.escalation.id,
    "Marcus V. (Shift Supervisor)",
    "Pressed E-Stop and locked out power disconnect M-101."
  );
  assert.ok(ack);
  assert.equal(ack.acknowledged, true);
  assert.equal(ack.acknowledgedBy, "Marcus V. (Shift Supervisor)");
  assert.ok(ack.acknowledgedAt);
});

test("Frontline Tribal Knowledge: Authoring, Review, and Technician Confirmation", async () => {
  // Test 1: Create technician knowledge record
  const kb = await createKnowledgeRecord({
    equipmentId: "CONV-02",
    equipmentName: "Main Transfer Conveyor #2",
    title: "Conveyor Drive Shaft Misalignment Causing Harmonic Bearing Vibration",
    symptoms: ["Drive bearing vibration spiking to 4.8 mm/s RMS", "Unusual squeal during acceleration"],
    probableCauses: ["Bearing raceway spalling", "Motor-gantry coupling angular misalignment"],
    diagnosticSteps: ["Measured vibration frequency spectrum", "Laser aligned motor shaft to reducer shaft"],
    actualRootCause: "Coupling rubber element perished causing 1.8mm angular misalignment",
    repairPerformed: "Replaced spider element and realigned with laser tool",
    partsUsed: ["Jaw coupling spider element N-Flex 95A"],
    downtimeMinutes: 40,
    verificationResults: "Vibration dropped to 1.9 mm/s RMS (within ISO Class II nominal band)",
    authorName: "Mike T.",
    authorRole: "Senior Millwright",
    isTechnicianConfirmed: true,
  });

  assert.equal(kb.isTechnicianConfirmed, true);
  assert.equal(kb.status, "UNDER_REVIEW");
  assert.equal(kb.version, 1);

  // Test 2: Supervisor approval
  const approved = await approveKnowledgeRecord(kb.id, "Marcus V. (Maintenance Supervisor)");
  assert.ok(approved);
  assert.equal(approved.status, "APPROVED");
  assert.equal(approved.approvedBy, "Marcus V. (Maintenance Supervisor)");

  // Test 3: Search knowledge
  const searchResults = await searchTribalKnowledge("coupling spider vibration misalignment");
  assert.ok(searchResults.length > 0);
  assert.ok(searchResults.some((r) => r.id === kb.id));
});

test("Frontline BigQuery Analytics: Telemetry Time-Series and Reliability KPIs", async () => {
  // Test 1: Telemetry history with anomaly calculation
  const points = await getTelemetryHistory("PRESS-03", "Hydraulic Oil Temp", 24);
  assert.ok(points.length >= 10);
  assert.equal(points[0].equipmentId, "PRESS-03");
  assert.equal(points[0].isDemoData, true); // Transparently flagged
  assert.ok(points.some((p) => p.isAnomaly));

  // Test 2: Equipment reliability KPIs (MTBF, MTTR, Availability)
  const kpis = await getEquipmentKpis("PRESS-03");
  assert.ok(kpis);
  assert.equal(kpis.equipmentId, "PRESS-03");
  assert.ok(kpis.mtbfHours > 0);
  assert.ok(kpis.mttrMinutes > 0);
  assert.ok(kpis.availabilityPercent >= 80 && kpis.availabilityPercent <= 100);

  // Test 3: Plant overview aggregates
  const overview = await getPlantOverviewAnalytics();
  assert.ok(overview.length >= 3);
  assert.ok(overview.some((k) => k.equipmentId === "PRESS-03"));
  assert.equal(overview[0].isDemoAnalytics, true);
});

test("Frontline REST APIs: Endpoints return structured JSON and correct HTTP status", async () => {
  // 1. GET /api/frontline/equipment
  const eqReq = new NextRequest("http://localhost:3000/api/frontline/equipment");
  const eqRes = await handleEquipmentGet(eqReq);
  assert.equal(eqRes.status, 200);
  const eqJson = await eqRes.json();
  assert.ok(eqJson.equipment.length >= 5);

  // 2. GET & POST /api/frontline/work-orders
  const woGetReq = new NextRequest("http://localhost:3000/api/frontline/work-orders");
  const woGetRes = await handleWorkOrdersGet(woGetReq);
  assert.equal(woGetRes.status, 200);

  const woPostReq = new NextRequest("http://localhost:3000/api/frontline/work-orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      equipmentId: "CNC-04",
      equipmentName: "5-Axis Milling Machine #4",
      title: "Clean 50-micron strainer mesh",
      severity: "MEDIUM",
    }),
  });
  const woPostRes = await handleWorkOrdersPost(woPostReq);
  assert.ok(woPostRes.status === 200 || woPostRes.status === 201);

  // 3. GET /api/frontline/knowledge
  const kbGetReq = new NextRequest("http://localhost:3000/api/frontline/knowledge?query=strainer");
  const kbGetRes = await handleKnowledgeGet(kbGetReq);
  assert.equal(kbGetRes.status, 200);

  // 4. GET /api/frontline/analytics
  const anGetReq = new NextRequest("http://localhost:3000/api/frontline/analytics?equipmentId=PRESS-03&metric=Hydraulic%20Oil%20Temp");
  const anGetRes = await handleAnalyticsGet(anGetReq);
  assert.equal(anGetRes.status, 200);
  const anJson = await anGetRes.json();
  assert.ok(anJson.telemetry.length > 0);
  assert.ok(anJson.kpis);
});
