import { getFirestoreClient } from "../gcp/firestore";
import { TribalKnowledgeRecord } from "../types";

const KNOWLEDGE_COLLECTION = "frontline_knowledge";

const initialKnowledge: TribalKnowledgeRecord[] = [
  {
    id: "kb-301",
    equipmentId: "PRESS-03",
    equipmentName: "Hydraulic Stamping Press #3",
    title: "Thermal Drift Caused by Shell-and-Tube Heat Exchanger Mineral Scale",
    symptoms: [
      "Hydraulic reservoir temperature climbs above 65°C during continuous 3-shift operation",
      "Proportional valve manifold feels unusually warm",
      "No hydraulic fluid leakage or pressure relief valve bypass audible",
    ],
    probableCauses: [
      "Cooling tower water supply valve partially throttled",
      "Mineral scale buildup inside shell-and-tube water heat exchanger",
      "Proportional relief valve spool sticking",
    ],
    diagnosticSteps: [
      "Measured heat exchanger water inlet vs outlet temperature: differential was only 2.1°C (nominal >= 6.5°C)",
      "Checked cooling water flow differential pressure: read 0.9 bar (nominal >= 1.2 bar)",
      "Bypassed auxiliary cooling loop to isolate primary tube bundle",
    ],
    actualRootCause:
      "Hard water mineral scaling inside heat exchanger copper tube bundle reduced thermal transfer coefficient by ~45%, causing oil temperature drift under heavy press duty cycles.",
    repairPerformed:
      "Isolated water supply, performed 30-minute closed-loop citric acid descaling circulation flush, rinsed with DI water, and verified 18 GPM coolant flow.",
    partsUsed: ["Citric acid descaling flush kit (5-gal)", "EPDM gasket kit 4-inch"],
    downtimeMinutes: 45,
    verificationResults:
      "Ran press at 100% duty cycle for 90 minutes. Reservoir temperature stabilized at 49.8°C (within baseline control bounds).",
    authorName: "Devin K.",
    authorRole: "Lead Hydraulic Technician",
    status: "APPROVED",
    approvedBy: "Marcus V. (Maintenance Supervisor)",
    approvedAt: "2026-03-12T14:30:00Z",
    version: 1,
    linkedWorkOrderIds: ["wo-089"],
    linkedDocCitations: ["SOP-HYD-11 §3.2"],
    isTechnicianConfirmed: true,
    aiGeneratedSuggestion: false,
    createdAt: "2026-03-12T11:00:00Z",
    updatedAt: "2026-03-12T14:30:00Z",
  },
  {
    id: "kb-302",
    equipmentId: "CNC-04",
    equipmentName: "5-Axis Milling Machine #4",
    title: "Through-Spindle Pressure Drop Due to Aluminum Chip Packing in 50µm Mesh",
    symptoms: [
      "Controller warning: Coolant delivery below 20 psi during roughing",
      "Coolant foaming in chip conveyor trough",
    ],
    probableCauses: [
      "Intake mesh blocked with aluminum fines",
      "Cavitation in high-pressure delivery pump",
      "Worn shaft mechanical seal",
    ],
    diagnosticSteps: [
      "Inspected sump level: oil/water emulsion level was normal (85%)",
      "Pulled intake strainer assembly from tank bottom",
    ],
    actualRootCause:
      "Fine 6061-T6 aluminum chips bypassed primary chip conveyor screen and formed a compressed cake on the 50-micron stainless suction strainer.",
    repairPerformed:
      "Removed strainer, ultrasonic-cleaned stainless mesh, inspected pump intake impeller, and reinstalled with new O-ring.",
    partsUsed: ["Buna-N O-ring 75mm"],
    downtimeMinutes: 30,
    verificationResults:
      "Restored steady through-spindle pressure of 28.4 psi across full 12,000 RPM cycle.",
    authorName: "Priya S.",
    authorRole: "Precision Machining Specialist",
    status: "APPROVED",
    approvedBy: "Devin K. (Lead Tech)",
    approvedAt: "2026-04-14T16:00:00Z",
    version: 1,
    linkedWorkOrderIds: ["wo-094"],
    linkedDocCitations: ["SOP-CNC-07 §4.1"],
    isTechnicianConfirmed: true,
    aiGeneratedSuggestion: false,
    createdAt: "2026-04-14T15:00:00Z",
    updatedAt: "2026-04-14T16:00:00Z",
  },
];

const knowledgeCache = new Map<string, TribalKnowledgeRecord>(
  initialKnowledge.map((k) => [k.id, k])
);

export async function getKnowledgeRecords(equipmentFilter?: string): Promise<TribalKnowledgeRecord[]> {
  const db = getFirestoreClient();
  let records = Array.from(knowledgeCache.values());

  if (db) {
    try {
      const snap = await db.collection(KNOWLEDGE_COLLECTION).get();
      if (!snap.empty) {
        records = snap.docs.map((d) => d.data() as TribalKnowledgeRecord);
      }
    } catch (err) {
      console.warn("[Firestore] getKnowledgeRecords fallback:", err);
    }
  }

  if (equipmentFilter) {
    records = records.filter((r) => r.equipmentId.toUpperCase() === equipmentFilter.toUpperCase());
  }

  return records.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getKnowledgeById(id: string): Promise<TribalKnowledgeRecord | null> {
  const db = getFirestoreClient();
  if (db) {
    try {
      const doc = await db.collection(KNOWLEDGE_COLLECTION).doc(id).get();
      if (doc.exists) {
        return doc.data() as TribalKnowledgeRecord;
      }
    } catch (err) {
      console.warn(`[Firestore] getKnowledgeById(${id}) fallback:`, err);
    }
  }
  return knowledgeCache.get(id) || null;
}

export interface CreateKnowledgeParams {
  equipmentId: string;
  equipmentName: string;
  title: string;
  symptoms: string[];
  probableCauses: string[];
  diagnosticSteps: string[];
  actualRootCause: string;
  repairPerformed: string;
  partsUsed: string[];
  downtimeMinutes: number;
  verificationResults: string;
  authorName: string;
  authorRole: string;
  linkedWorkOrderIds?: string[];
  linkedDocCitations?: string[];
  isTechnicianConfirmed?: boolean;
  aiGeneratedSuggestion?: boolean;
}

export async function createKnowledgeRecord(
  params: CreateKnowledgeParams
): Promise<TribalKnowledgeRecord> {
  const id = `kb-${Date.now().toString().slice(-5)}`;
  const now = new Date().toISOString();

  const record: TribalKnowledgeRecord = {
    id,
    equipmentId: params.equipmentId.toUpperCase(),
    equipmentName: params.equipmentName,
    title: params.title,
    symptoms: params.symptoms,
    probableCauses: params.probableCauses,
    diagnosticSteps: params.diagnosticSteps,
    actualRootCause: params.actualRootCause,
    repairPerformed: params.repairPerformed,
    partsUsed: params.partsUsed,
    downtimeMinutes: params.downtimeMinutes,
    verificationResults: params.verificationResults,
    authorName: params.authorName,
    authorRole: params.authorRole,
    status: params.isTechnicianConfirmed ? "UNDER_REVIEW" : "DRAFT",
    version: 1,
    linkedWorkOrderIds: params.linkedWorkOrderIds || [],
    linkedDocCitations: params.linkedDocCitations || [],
    isTechnicianConfirmed: !!params.isTechnicianConfirmed,
    aiGeneratedSuggestion: !!params.aiGeneratedSuggestion,
    createdAt: now,
    updatedAt: now,
  };

  knowledgeCache.set(id, record);

  const db = getFirestoreClient();
  if (db) {
    try {
      await db.collection(KNOWLEDGE_COLLECTION).doc(id).set(record);
    } catch (err) {
      console.warn("[Firestore] createKnowledgeRecord persist error:", err);
    }
  }

  return record;
}

export async function approveKnowledgeRecord(
  id: string,
  approvedBy: string
): Promise<TribalKnowledgeRecord | null> {
  const record = knowledgeCache.get(id);
  if (!record) return null;

  record.status = "APPROVED";
  record.approvedBy = approvedBy;
  record.approvedAt = new Date().toISOString();
  record.isTechnicianConfirmed = true;
  record.updatedAt = new Date().toISOString();

  knowledgeCache.set(id, record);

  const db = getFirestoreClient();
  if (db) {
    try {
      await db.collection(KNOWLEDGE_COLLECTION).doc(id).set(record, { merge: true });
    } catch (err) {
      console.warn(`[Firestore] approveKnowledgeRecord(${id}) persist error:`, err);
    }
  }

  return record;
}

export async function searchTribalKnowledge(query: string): Promise<TribalKnowledgeRecord[]> {
  const records = await getKnowledgeRecords();
  const qTerms = query
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/\s+/)
    .filter((t) => t.length > 2);

  if (qTerms.length === 0) return records;

  return records.filter((r) => {
    const text = `${r.title} ${r.equipmentId} ${r.equipmentName} ${r.actualRootCause} ${r.symptoms.join(" ")} ${r.probableCauses.join(" ")}`.toLowerCase();
    return qTerms.some((t) => text.includes(t));
  });
}
