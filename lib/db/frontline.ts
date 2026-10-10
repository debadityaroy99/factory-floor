import { getFirestoreClient } from "../gcp/firestore";
import {
  FloorHistoryRecord,
  OperatorTrainingRecord,
  ToolCribInventoryItem,
} from "../types";

const HISTORY_COLLECTION = "frontline_history";
const INVENTORY_COLLECTION = "frontline_inventory";
const TRAINING_COLLECTION = "frontline_training";

// Baseline seed data
const initialHistory: FloorHistoryRecord[] = [
  {
    id: "hist-1",
    title: "Conveyor 3 bearing failure",
    sub: "Replace 6205-2RS · resolved by Mike T.",
    date: "Today",
    equipmentId: "CONV-03",
    sopCitation: "SOP-MNT-04",
  },
  {
    id: "hist-2",
    title: "CNC-3 coolant PSI drop",
    sub: "Check pump seal · cited SOP-CNC-07 p3",
    date: "Apr 14",
    equipmentId: "CNC-03",
    sopCitation: "SOP-CNC-07 p3",
  },
  {
    id: "hist-3",
    title: "Forklift battery rotation",
    sub: "Bank A → C every Tues · per Mike",
    date: "Apr 11",
    equipmentId: "FORK-02",
  },
  {
    id: "hist-4",
    title: "Allen-Bradley fault E-04",
    sub: "Reset sequence + photo · per Devin",
    date: "Apr 06",
    equipmentId: "PLC-AB-01",
  },
  {
    id: "hist-5",
    title: "Hydraulic press oil change",
    sub: "ISO 46 · every 500 hrs · Cage D",
    date: "Apr 02",
    equipmentId: "PRESS-03",
    sopCitation: "SOP-HYD-11",
    highlight: true,
  },
];

const initialInventory: ToolCribInventoryItem[] = [
  {
    id: "inv-cnmg-432",
    item: "CNMG 432 inserts",
    supplier: "MSC Industrial · net-30",
    location: "TOOL CRIB B",
    reorderPoint: 12,
    onHand: 3,
    unit: "pcs",
  },
  {
    id: "inv-6205-bearing",
    item: "6205-2RS deep groove ball bearings",
    supplier: "Applied Industrial",
    location: "CAGE D",
    reorderPoint: 8,
    onHand: 14,
    unit: "pcs",
  },
  {
    id: "inv-iso-46-oil",
    item: "ISO 46 Hydraulic Oil (5-gal)",
    supplier: "Mobil / Grainger",
    location: "CAGE D",
    reorderPoint: 4,
    onHand: 2,
    unit: "pails",
  },
];

const initialTraining: OperatorTrainingRecord[] = [
  {
    id: "train-priya-s",
    name: "Priya S.",
    role: "CNC operator · station 4",
    shift: "Monday · second shift",
    station: "Station 4",
    certifications: [
      { name: "Forklift basics", certified: true },
      { name: "Lockout/tagout", certified: true },
      { name: "Chemical handling", certified: false },
    ],
    missingModules: ["Chemical handling"],
  },
];

// In-memory caches for offline/dev fallback
const historyCache = new Map<string, FloorHistoryRecord>(
  initialHistory.map((h) => [h.id, h])
);
const inventoryCache = new Map<string, ToolCribInventoryItem>(
  initialInventory.map((i) => [i.id, i])
);
const trainingCache = new Map<string, OperatorTrainingRecord>(
  initialTraining.map((t) => [t.id, t])
);

export async function getFloorHistory(): Promise<FloorHistoryRecord[]> {
  const db = getFirestoreClient();
  if (db) {
    try {
      const snap = await db.collection(HISTORY_COLLECTION).get();
      if (!snap.empty) {
        return snap.docs.map((doc) => doc.data() as FloorHistoryRecord);
      }
    } catch (err) {
      console.error("[Firestore] getFloorHistory failed:", err);
    }
  }
  return Array.from(historyCache.values());
}

export async function getInventory(): Promise<ToolCribInventoryItem[]> {
  const db = getFirestoreClient();
  if (db) {
    try {
      const snap = await db.collection(INVENTORY_COLLECTION).get();
      if (!snap.empty) {
        return snap.docs.map((doc) => doc.data() as ToolCribInventoryItem);
      }
    } catch (err) {
      console.error("[Firestore] getInventory failed:", err);
    }
  }
  return Array.from(inventoryCache.values());
}

export async function updateInventoryOnHand(
  id: string,
  newOnHand: number
): Promise<ToolCribInventoryItem | null> {
  const item = inventoryCache.get(id);
  if (item) {
    item.onHand = newOnHand;
    inventoryCache.set(id, item);
  }

  const db = getFirestoreClient();
  if (db) {
    try {
      await db.collection(INVENTORY_COLLECTION).doc(id).set({ onHand: newOnHand }, { merge: true });
    } catch (err) {
      console.error("[Firestore] updateInventoryOnHand failed:", err);
    }
  }

  return item || null;
}

export async function getTrainingRecords(): Promise<OperatorTrainingRecord[]> {
  const db = getFirestoreClient();
  if (db) {
    try {
      const snap = await db.collection(TRAINING_COLLECTION).get();
      if (!snap.empty) {
        return snap.docs.map((doc) => doc.data() as OperatorTrainingRecord);
      }
    } catch (err) {
      console.error("[Firestore] getTrainingRecords failed:", err);
    }
  }
  return Array.from(trainingCache.values());
}

