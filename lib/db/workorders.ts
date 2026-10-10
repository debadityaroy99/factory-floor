import { getFirestoreClient } from "../gcp/firestore";
import {
  WorkOrder,
  WorkOrderPriority,
  WorkOrderSeverity,
  WorkOrderStatus,
} from "../types";

const WORKORDERS_COLLECTION = "frontline_work_orders";

/**
 * Interface for future enterprise CMMS (SAP PM / IBM Maximo) integration.
 */
export interface CMMSAdapter {
  syncWorkOrder(
    workOrder: WorkOrder
  ): Promise<{ success: boolean; externalTicketId?: string; message: string }>;
}

export class InternalCMMSAdapter implements CMMSAdapter {
  async syncWorkOrder(
    workOrder: WorkOrder
  ): Promise<{ success: boolean; externalTicketId?: string; message: string }> {
    // Internal Firestore backed adapter
    // Explicitly states internal mode to avoid falsely claiming external SAP/Maximo tickets
    const internalRef = `CMMS-INT-${workOrder.id.slice(-6).toUpperCase()}`;
    return {
      success: true,
      externalTicketId: internalRef,
      message: `Work order recorded in internal operations queue (${internalRef}). External enterprise CMMS webhook is in pass-through mode.`,
    };
  }
}

const cmmsAdapter = new InternalCMMSAdapter();

const initialWorkOrders: WorkOrder[] = [
  {
    id: "wo-101",
    equipmentId: "PRESS-03",
    equipmentName: "Hydraulic Stamping Press #3",
    title: "Inspect heat exchanger & proportional cooling valve for thermal drift",
    description: "Hydraulic oil temperature drifted to 68.4°C (Z=2.36σ). Check cooling coil and water flow per SOP-HYD-11 §3.2 before 75°C threshold.",
    severity: "HIGH",
    priority: "P2",
    status: "IN_PROGRESS",
    assignedTeam: "Mechanical / Hydraulics Team",
    assignedTechnician: "Devin K. (Lead Hydraulic Tech)",
    supportingEvidence: [
      "Telemetry oil temp = 68.4°C vs baseline 50.0°C",
      "Calculated Z-score = 2.36σ across 12 rolling cycles",
      "Cooling differential pressure = 0.95 bar (below 1.2 bar nominal)",
    ],
    recommendedAction: "Flush heat exchanger tube bundle and verify 15 GPM cooling water flow rate.",
    sourceReferences: ["SOP-HYD-11 §3.2", "SOP-HYD-11 §1.1"],
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    auditLog: [
      {
        action: "CREATED",
        actor: "Operator Priya S.",
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
        note: "Auto-generated from telemetry drift anomaly trigger",
      },
      {
        action: "ASSIGNED",
        actor: "Supervisor Marcus V.",
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        note: "Assigned to Devin K. based on hydraulics skill matrix",
      },
      {
        action: "STATUS_CHANGE",
        actor: "Devin K.",
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        note: "Status updated to IN_PROGRESS. Commenced water flow differential inspection.",
      },
    ],
    escalated: false,
    cmmsReferenceId: "CMMS-INT-WO0101",
  },
  {
    id: "wo-102",
    equipmentId: "CNC-04",
    equipmentName: "5-Axis Milling Machine #4",
    title: "Clear intake strainer mesh & inspect spindle coolant pump seal",
    description: "Coolant pressure dropped to 18.2 psi (Z=2.53σ). Clean 50-micron stainless strainer per SOP-CNC-07 §4.1.",
    severity: "MEDIUM",
    priority: "P3",
    status: "OPEN",
    assignedTeam: "Tooling & Spindle Maintenance Team",
    assignedTechnician: "Unassigned",
    supportingEvidence: [
      "Coolant delivery pressure = 18.2 psi vs baseline 28.0 psi",
      "Calculated Z-score = 2.53σ",
    ],
    recommendedAction: "Clean sump intake filter mesh and inspect pump mechanical seal lip.",
    sourceReferences: ["SOP-CNC-07 §4.1"],
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    auditLog: [
      {
        action: "CREATED",
        actor: "System Anomaly Monitor",
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        note: "Created following pressure drop detection during roughing cycle",
      },
    ],
    escalated: false,
    cmmsReferenceId: "CMMS-INT-WO0102",
  },
  {
    id: "wo-103",
    equipmentId: "CONV-02",
    equipmentName: "Main Transfer Conveyor #2",
    title: "Replace 6205-2RS Drive Bearing on Transmission Gantry",
    description: "Bearing vibration reached 4.8 mm/s RMS (Z=3.09σ). Inner raceway fatigue indicated per SOP-MNT-04.",
    severity: "HIGH",
    priority: "P2",
    status: "ASSIGNED",
    assignedTeam: "Transmission & Drive Team",
    assignedTechnician: "Mike T. (Senior Millwright)",
    supportingEvidence: [
      "Vibration RMS = 4.8 mm/s vs baseline 2.1 mm/s",
      "Calculated Z-score = 3.09σ",
      "Cage D inventory verified: 14 pcs 6205-2RS available",
    ],
    recommendedAction: "Execute LOTO on Motor M-201 and replace bearing with induction heater per SOP-MNT-04 §3.0.",
    sourceReferences: ["SOP-MNT-04 §3.0", "SOP-MNT-04 §1.2"],
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    auditLog: [
      {
        action: "CREATED",
        actor: "Operator Priya S.",
        timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
      },
      {
        action: "ASSIGNED",
        actor: "Supervisor Marcus V.",
        timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
        note: "Scheduled for upcoming shift changeover",
      },
    ],
    escalated: false,
    cmmsReferenceId: "CMMS-INT-WO0103",
  },
];

const workOrdersCache = new Map<string, WorkOrder>(
  initialWorkOrders.map((wo) => [wo.id, wo])
);

/**
 * Determine team and priority routing based on equipment and severity.
 */
export function determineRoutingRules(
  equipmentId: string,
  severity: WorkOrderSeverity
): { assignedTeam: string; priority: WorkOrderPriority; suggestedTech: string } {
  let assignedTeam = "General Maintenance";
  let suggestedTech = "Unassigned";

  if (equipmentId.startsWith("PRESS")) {
    assignedTeam = "Mechanical / Hydraulics Team";
    suggestedTech = "Devin K. (Lead Hydraulic Tech)";
  } else if (equipmentId.startsWith("CNC")) {
    assignedTeam = "Tooling & Spindle Maintenance Team";
    suggestedTech = "Priya S. (Precision Machining)";
  } else if (equipmentId.startsWith("CONV")) {
    assignedTeam = "Transmission & Drive Team";
    suggestedTech = "Mike T. (Senior Millwright)";
  } else if (equipmentId.startsWith("PLC") || equipmentId.startsWith("ELEC")) {
    assignedTeam = "Controls & Electrical Engineering";
    suggestedTech = "Elena R. (Automation Specialist)";
  }

  let priority: WorkOrderPriority = "P3";
  if (severity === "CRITICAL") priority = "P1";
  else if (severity === "HIGH") priority = "P2";
  else if (severity === "MEDIUM") priority = "P3";
  else priority = "P4";

  return { assignedTeam, priority, suggestedTech };
}

export async function getWorkOrders(equipmentFilter?: string): Promise<WorkOrder[]> {
  const db = getFirestoreClient();
  let orders = Array.from(workOrdersCache.values());

  if (db) {
    try {
      const snap = await db.collection(WORKORDERS_COLLECTION).get();
      if (!snap.empty) {
        orders = snap.docs.map((d) => d.data() as WorkOrder);
      }
    } catch (err) {
      console.warn("[Firestore] getWorkOrders fallback:", err);
    }
  }

  if (equipmentFilter) {
    const eqKey = equipmentFilter.toUpperCase();
    orders = orders.filter((o) => o.equipmentId.toUpperCase() === eqKey);
  }

  // Sort by updatedAt descending
  return orders.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getWorkOrderById(id: string): Promise<WorkOrder | null> {
  const db = getFirestoreClient();
  if (db) {
    try {
      const doc = await db.collection(WORKORDERS_COLLECTION).doc(id).get();
      if (doc.exists) {
        return doc.data() as WorkOrder;
      }
    } catch (err) {
      console.warn(`[Firestore] getWorkOrderById(${id}) fallback:`, err);
    }
  }
  return workOrdersCache.get(id) || null;
}

export interface CreateWorkOrderParams {
  equipmentId: string;
  equipmentName: string;
  title: string;
  description: string;
  severity: WorkOrderSeverity;
  supportingEvidence?: string[];
  recommendedAction?: string;
  sourceReferences?: string[];
  creatorName?: string;
  assignedTechnician?: string;
}

export async function createWorkOrder(params: CreateWorkOrderParams): Promise<{
  workOrder: WorkOrder;
  isDuplicate: boolean;
  message: string;
}> {
  const orders = await getWorkOrders(params.equipmentId);

  // Duplicate prevention check: Check if an active (non-completed/verified) work order exists with similar title
  const activeOrders = orders.filter((o) => o.status !== "COMPLETED" && o.status !== "VERIFIED");
  const normalizedTitle = params.title.toLowerCase().trim();

  const duplicate = activeOrders.find(
    (o) =>
      o.title.toLowerCase().includes(normalizedTitle.slice(0, 20)) ||
      normalizedTitle.includes(o.title.toLowerCase().slice(0, 20))
  );

  if (duplicate) {
    return {
      workOrder: duplicate,
      isDuplicate: true,
      message: `Active work order #${duplicate.id} (${duplicate.status}) already exists for ${duplicate.equipmentName}.`,
    };
  }

  const routing = determineRoutingRules(params.equipmentId, params.severity);
  const newId = `wo-${Date.now().toString().slice(-5)}`;
  const now = new Date().toISOString();

  const newOrder: WorkOrder = {
    id: newId,
    equipmentId: params.equipmentId.toUpperCase(),
    equipmentName: params.equipmentName,
    title: params.title,
    description: params.description,
    severity: params.severity,
    priority: routing.priority,
    status: params.assignedTechnician ? "ASSIGNED" : "OPEN",
    assignedTeam: routing.assignedTeam,
    assignedTechnician: params.assignedTechnician || routing.suggestedTech,
    supportingEvidence: params.supportingEvidence || [],
    recommendedAction: params.recommendedAction || "Follow standard maintenance procedure.",
    sourceReferences: params.sourceReferences || [],
    createdAt: now,
    updatedAt: now,
    auditLog: [
      {
        action: "CREATED",
        actor: params.creatorName || "Operator",
        timestamp: now,
        note: `Work order logged. Routed to ${routing.assignedTeam}.`,
      },
    ],
    escalated: false,
  };

  // Sync through CMMS adapter
  const syncResult = await cmmsAdapter.syncWorkOrder(newOrder);
  newOrder.cmmsReferenceId = syncResult.externalTicketId;

  workOrdersCache.set(newOrder.id, newOrder);

  const db = getFirestoreClient();
  if (db) {
    try {
      await db.collection(WORKORDERS_COLLECTION).doc(newOrder.id).set(newOrder);
    } catch (err) {
      console.warn("[Firestore] createWorkOrder persist error:", err);
    }
  }

  return {
    workOrder: newOrder,
    isDuplicate: false,
    message: `Work order #${newOrder.id} successfully created and routed to ${newOrder.assignedTeam}.`,
  };
}

export async function updateWorkOrderStatus(
  id: string,
  newStatus: WorkOrderStatus,
  actor: string,
  note?: string
): Promise<WorkOrder | null> {
  const order = await getWorkOrderById(id);
  if (!order) return null;

  const now = new Date().toISOString();
  order.status = newStatus;
  order.updatedAt = now;

  if (newStatus === "COMPLETED") {
    order.completedAt = now;
  } else if (newStatus === "VERIFIED") {
    order.verifiedAt = now;
  }

  order.auditLog.push({
    action: `STATUS_${newStatus}`,
    actor,
    timestamp: now,
    note: note || `Work order status changed to ${newStatus}.`,
  });

  workOrdersCache.set(order.id, order);

  const db = getFirestoreClient();
  if (db) {
    try {
      await db.collection(WORKORDERS_COLLECTION).doc(order.id).set(order, { merge: true });
    } catch (err) {
      console.warn(`[Firestore] updateWorkOrderStatus(${id}) persist error:`, err);
    }
  }

  return order;
}

