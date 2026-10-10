import { getFirestoreClient } from "../gcp/firestore";
import { EscalationRecord } from "../types";

const ESCALATIONS_COLLECTION = "frontline_escalations";

const initialEscalations: EscalationRecord[] = [
  {
    id: "esc-201",
    workOrderId: "wo-101",
    equipmentId: "PRESS-03",
    severity: "HIGH",
    reason: "Continuous hydraulic thermal drift (68.4°C) approaching 75.0°C thermal shutdown limit without resolution in >3 hours.",
    evidence: "Z-score 2.36σ; cooling water differential pressure 0.95 bar indicates tube bundle fouling.",
    destination: "Maintenance Manager Marcus V. (Ops Radio Ch 2 / Slack #plant-maintenance)",
    timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    acknowledged: true,
    acknowledgedBy: "Marcus V. (Shift Supervisor)",
    acknowledgedAt: new Date(Date.now() - 3600000 * 1.2).toISOString(),
    safetyCritical: false,
    siteProcedureCitation: "SOP-HYD-11 §3.2",
    outcome: "Dispatched Devin K. to inspect heat exchanger flow.",
  },
];

const escalationsCache = new Map<string, EscalationRecord>(
  initialEscalations.map((e) => [e.id, e])
);

export interface TriggerEscalationParams {
  workOrderId?: string;
  equipmentId: string;
  severity: "HIGH" | "CRITICAL";
  reason: string;
  evidence: string;
  safetyCritical?: boolean;
}

export async function getEscalations(equipmentFilter?: string): Promise<EscalationRecord[]> {
  const db = getFirestoreClient();
  let list = Array.from(escalationsCache.values());

  if (db) {
    try {
      const snap = await db.collection(ESCALATIONS_COLLECTION).get();
      if (!snap.empty) {
        list = snap.docs.map((d) => d.data() as EscalationRecord);
      }
    } catch (err) {
      console.warn("[Firestore] getEscalations fallback:", err);
    }
  }

  if (equipmentFilter) {
    list = list.filter((e) => e.equipmentId.toUpperCase() === equipmentFilter.toUpperCase());
  }

  return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function triggerEscalation(
  params: TriggerEscalationParams
): Promise<{ escalation: EscalationRecord; message: string }> {
  const id = `esc-${Date.now().toString().slice(-5)}`;
  const now = new Date().toISOString();

  let destination = "Maintenance Supervisor Desk (Ext 4102 / Ops Slack #floor-critical)";
  let siteProcedure = "SOP-HYD-11 §3.2";

  if (params.safetyCritical || params.severity === "CRITICAL") {
    destination = "Plant Operations Emergency Response & Shift Supervisor (Ops Radio Ch 1)";
    siteProcedure = "SOP-SFT-02 §2.1 (Plant Emergency E-Stop & LOTO Protocol)";
  }

  const record: EscalationRecord = {
    id,
    workOrderId: params.workOrderId,
    equipmentId: params.equipmentId.toUpperCase(),
    severity: params.severity,
    reason: params.reason,
    evidence: params.evidence,
    destination,
    timestamp: now,
    acknowledged: false,
    safetyCritical: !!params.safetyCritical,
    siteProcedureCitation: siteProcedure,
  };

  escalationsCache.set(id, record);

  const db = getFirestoreClient();
  if (db) {
    try {
      await db.collection(ESCALATIONS_COLLECTION).doc(id).set(record);
    } catch (err) {
      console.warn("[Firestore] triggerEscalation persist error:", err);
    }
  }

  return {
    escalation: record,
    message: `Escalation #${id} dispatched to ${destination}. Safety protocol ${siteProcedure} surfaced.`,
  };
}

export async function acknowledgeEscalation(
  id: string,
  acknowledgedBy: string,
  outcome?: string
): Promise<EscalationRecord | null> {
  const record = escalationsCache.get(id);
  if (!record) return null;

  record.acknowledged = true;
  record.acknowledgedBy = acknowledgedBy;
  record.acknowledgedAt = new Date().toISOString();
  if (outcome) record.outcome = outcome;

  escalationsCache.set(id, record);

  const db = getFirestoreClient();
  if (db) {
    try {
      await db.collection(ESCALATIONS_COLLECTION).doc(id).set(record, { merge: true });
    } catch (err) {
      console.warn(`[Firestore] acknowledgeEscalation(${id}) persist error:`, err);
    }
  }

  return record;
}

