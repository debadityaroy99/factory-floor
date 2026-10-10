/**
 * Mock Data Retriever for Manufy Frontline Mode.
 *
 * Retrieves only the relevant mock operational records based on query intent,
 * supplying them as the sole factual source of truth to Vertex AI Gemini.
 */

import {
  MOCK_EQUIPMENT_STATUS,
  MOCK_INVENTORY,
  MOCK_MAINTENANCE_HISTORY,
  MOCK_TRAINING_RECORDS,
  MOCK_VERIFIED_OIL_SERVICE,
  PERSONAS,
  Ticket,
} from "../mock/frontlineData";

export interface RetrievedOperationalContext {
  category: "shift" | "maintenance" | "inventory" | "training" | "equipment" | "factory_overview";
  recordCount: number;
  records: Record<string, unknown>;
}

/**
 * Extract active tickets across all worker personas or for a specific persona.
 */
export function getActiveTickets(personaId?: string): Array<Ticket & { assignedWorker: string; shift: string }> {
  const targetPersonas = personaId
    ? PERSONAS.filter((p) => p.id === personaId)
    : PERSONAS;

  const result: Array<Ticket & { assignedWorker: string; shift: string }> = [];
  for (const p of targetPersonas) {
    for (const t of p.tickets) {
      result.push({
        ...t,
        assignedWorker: p.name,
        shift: p.shift,
      });
    }
  }
  return result;
}

/**
 * Retrieve relevant mock operational records for an analytical or summary query.
 */
export function retrieveMockRecords(
  query: string,
  personaId?: string
): RetrievedOperationalContext {
  const q = query.toLowerCase();

  // 1. Tooling & Inventory Reasoning
  if (
    q.includes("inventory") ||
    q.includes("stock") ||
    q.includes("tool") ||
    q.includes("reorder") ||
    q.includes("insert") ||
    q.includes("bearing")
  ) {
    return {
      category: "inventory",
      recordCount: MOCK_INVENTORY.length,
      records: {
        inventoryItems: MOCK_INVENTORY.map((item) => ({
          item: item.item,
          location: item.location,
          supplier: item.supplier,
          onHand: item.onHand,
          reorderPoint: item.reorderPoint,
          unit: item.unit,
          isBelowReorder: item.onHand < item.reorderPoint,
          unitsUnderReorder: Math.max(0, item.reorderPoint - item.onHand),
          pendingPurchaseOrder: item.pendingPo || null,
        })),
        storesLead: PERSONAS.find((p) => p.id === "dana")?.name || "Dana K.",
      },
    };
  }

  // 2. Training & Certification Reasoning
  if (
    q.includes("training") ||
    q.includes("cert") ||
    q.includes("qualification") ||
    q.includes("priya") ||
    q.includes("chemical")
  ) {
    return {
      category: "training",
      recordCount: MOCK_TRAINING_RECORDS.length,
      records: {
        operatorTrainingRecords: MOCK_TRAINING_RECORDS,
        pendingTickets: getActiveTickets().filter((t) => t.code.startsWith("T-")),
      },
    };
  }

  // 3. Maintenance History & Equipment Incidents (e.g. Press 3, Conveyor, bearings)
  if (
    q.includes("maintenance") ||
    q.includes("incident") ||
    q.includes("oil") ||
    q.includes("press") ||
    q.includes("conveyor") ||
    q.includes("history") ||
    q.includes("repair")
  ) {
    const isPressSpecific = q.includes("press");
    const filteredHistory = isPressSpecific
      ? MOCK_MAINTENANCE_HISTORY.filter(
          (h) => h.equipment.toLowerCase().includes("press") || h.title.toLowerCase().includes("press")
        )
      : MOCK_MAINTENANCE_HISTORY;

    const filteredTickets = getActiveTickets().filter((t) =>
      isPressSpecific ? t.title.toLowerCase().includes("press") : true
    );

    return {
      category: "maintenance",
      recordCount: filteredHistory.length + filteredTickets.length,
      records: {
        maintenanceLog: filteredHistory,
        verifiedOilService: MOCK_VERIFIED_OIL_SERVICE,
        activeMaintenanceTickets: filteredTickets,
        equipmentStatus: isPressSpecific
          ? MOCK_EQUIPMENT_STATUS.filter((e) => e.name.toLowerCase().includes("press"))
          : MOCK_EQUIPMENT_STATUS,
      },
    };
  }

  // 4. Shift Handover, Outstanding Work Orders, or Overall Plant Status
  const allTickets = getActiveTickets(personaId);
  const openOrHighTickets = allTickets.filter(
    (t) => t.status === "HIGH" || t.status === "IN PROGRESS" || t.status === "WAITING PARTS"
  );

  return {
    category: "shift",
    recordCount: allTickets.length + MOCK_EQUIPMENT_STATUS.length,
    records: {
      activeShiftPersonas: PERSONAS.map((p) => ({
        name: p.name,
        role: p.role,
        shift: p.shift,
      })),
      allWorkOrders: allTickets,
      priorityIssues: openOrHighTickets,
      equipmentDriftAndHealth: MOCK_EQUIPMENT_STATUS,
      recentMaintenanceResolved: MOCK_MAINTENANCE_HISTORY.slice(0, 2),
      criticalStockIssues: MOCK_INVENTORY.filter((i) => i.onHand < i.reorderPoint),
    },
  };
}

