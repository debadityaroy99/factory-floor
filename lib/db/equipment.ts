import { getFirestoreClient } from "../gcp/firestore";
import { EquipmentAnomaly, EquipmentItem } from "../types";

const EQUIPMENT_COLLECTION = "frontline_equipment";

const initialEquipment: EquipmentItem[] = [
  {
    id: "PRESS-03",
    name: "Hydraulic Stamping Press #3",
    line: "Line A - Heavy Stamping",
    bay: "Bay 1",
    status: "WARNING",
    type: "PRESS",
    criticality: "A",
    lastMaintenanceDate: "2026-04-02",
    healthScore: 64,
    metrics: [
      { name: "Hydraulic Oil Temp", value: 68.4, unit: "°C", baseline: 50.0, stddev: 2.5, status: "WARNING" },
      { name: "System Pressure", value: 215, unit: "bar", baseline: 210, stddev: 5.0, status: "NORMAL" },
      { name: "Cycle Time", value: 4.8, unit: "sec", baseline: 4.5, stddev: 0.1, status: "NORMAL" },
    ],
    activeAnomalies: [
      {
        id: "anom-press-01",
        equipmentId: "PRESS-03",
        metricName: "Hydraulic Oil Temp",
        measuredValue: 68.4,
        baselineMean: 50.0,
        deviationDelta: 18.4,
        zScore: 2.36,
        severity: "WARNING",
        type: "DRIFT",
        description: "Continuous thermal upward drift across last 12 rolling cycles",
        isConfirmedFailure: false, // Distinguish measured anomaly from confirmed failure
        timestamp: new Date().toISOString(),
        evidenceCalculation: "Z = (68.4 - 50.0) / 2.5 = 2.36σ (exceeds 2.0σ warning threshold)",
        preventiveRecommendation: "Inspect proportional valve cooling coil and verify heat exchanger circulation per SOP-HYD-11 §3.2 before thermal trip (75°C).",
      },
    ],
    recommendedAction: "Verify heat exchanger oil circulation; do not shut down line unless temp exceeds 75°C.",
    isDemoAsset: true,
  },
  {
    id: "CNC-04",
    name: "5-Axis Milling Machine #4",
    line: "Line B - Precision Machining",
    bay: "Bay 2",
    status: "WARNING",
    type: "CNC",
    criticality: "A",
    lastMaintenanceDate: "2026-04-14",
    healthScore: 71,
    metrics: [
      { name: "Through-Spindle Coolant Pressure", value: 18.2, unit: "psi", baseline: 28.0, stddev: 1.8, status: "WARNING" },
      { name: "Spindle Vibration (RMS)", value: 1.1, unit: "mm/s", baseline: 0.9, stddev: 0.2, status: "NORMAL" },
      { name: "Spindle Temp", value: 42.1, unit: "°C", baseline: 40.0, stddev: 1.5, status: "NORMAL" },
    ],
    activeAnomalies: [
      {
        id: "anom-cnc-01",
        equipmentId: "CNC-04",
        metricName: "Through-Spindle Coolant Pressure",
        measuredValue: 18.2,
        baselineMean: 28.0,
        deviationDelta: -9.8,
        zScore: 2.53,
        severity: "WARNING",
        type: "PRESSURE_DROP",
        description: "Step-function delivery pressure drop during roughing passes",
        isConfirmedFailure: false,
        timestamp: new Date().toISOString(),
        evidenceCalculation: "Z = |18.2 - 28.0| / 1.8 = 2.53σ (exceeds 2.0σ warning threshold)",
        preventiveRecommendation: "Check delivery line pump seal and intake strainer mesh for chip buildup per SOP-CNC-07 §4.1.",
      },
    ],
    recommendedAction: "Inspect coolant intake strainer mesh and pump mechanical seal for chip clogging.",
    isDemoAsset: true,
  },
  {
    id: "CONV-02",
    name: "Main Transfer Conveyor #2",
    line: "Line A - Transfer Gantry",
    bay: "Bay 1",
    status: "WARNING",
    type: "CONVEYOR",
    criticality: "B",
    lastMaintenanceDate: "2026-03-20",
    healthScore: 78,
    metrics: [
      { name: "Drive Bearing Vibration (DE)", value: 4.8, unit: "mm/s", baseline: 2.1, stddev: 0.35, status: "WARNING" },
      { name: "Motor Surface Temp", value: 58.2, unit: "°C", baseline: 55.0, stddev: 2.0, status: "NORMAL" },
      { name: "Belt Tension", value: 92, unit: "%", baseline: 95, stddev: 3.0, status: "NORMAL" },
    ],
    activeAnomalies: [
      {
        id: "anom-conv-01",
        equipmentId: "CONV-02",
        metricName: "Drive Bearing Vibration (DE)",
        measuredValue: 4.8,
        baselineMean: 2.1,
        deviationDelta: 2.7,
        zScore: 3.09,
        severity: "WARNING",
        type: "VIBRATION_SPIKE",
        description: "Harmonic high-frequency acceleration peak on drive-end bearing",
        isConfirmedFailure: false,
        timestamp: new Date().toISOString(),
        evidenceCalculation: "Z = (4.8 - 2.1) / 0.35 = 3.09σ (statistical outlier above 3.0σ)",
        preventiveRecommendation: "Schedule replacement of 6205-2RS bearing during next changeover (Cage D inventory available) per SOP-MNT-04.",
      },
    ],
    recommendedAction: "Grease DE bearing and schedule 6205-2RS replacement during next scheduled shift change.",
    isDemoAsset: true,
  },
  {
    id: "PUMP-01",
    name: "Coolant Recirculation Pump #1",
    line: "Central Utilities",
    bay: "Bay 3",
    status: "NORMAL",
    type: "PUMP",
    criticality: "B",
    lastMaintenanceDate: "2026-04-08",
    healthScore: 96,
    metrics: [
      { name: "Discharge Pressure", value: 65.0, unit: "psi", baseline: 65.0, stddev: 2.0, status: "NORMAL" },
      { name: "Motor Current", value: 14.2, unit: "A", baseline: 14.0, stddev: 0.5, status: "NORMAL" },
    ],
    activeAnomalies: [],
    recommendedAction: "Operating nominally within baseline control bounds.",
    isDemoAsset: true,
  },
  {
    id: "PLC-AB-01",
    name: "Allen-Bradley GuardLogix Line Controller",
    line: "Line A - Master Automation",
    bay: "Bay 1",
    status: "NORMAL",
    type: "PLC",
    criticality: "A",
    lastMaintenanceDate: "2026-04-06",
    healthScore: 99,
    metrics: [
      { name: "Scan Time", value: 12.4, unit: "ms", baseline: 12.0, stddev: 0.4, status: "NORMAL" },
      { name: "Safety Loop Impedance", value: 4.1, unit: "Ω", baseline: 4.0, stddev: 0.1, status: "NORMAL" },
    ],
    activeAnomalies: [],
    recommendedAction: "Safety loops synchronized. No fault codes registered.",
    isDemoAsset: true,
  },
];

const equipmentCache = new Map<string, EquipmentItem>(
  initialEquipment.map((eq) => [eq.id, eq])
);

export async function getEquipmentList(): Promise<EquipmentItem[]> {
  const db = getFirestoreClient();
  if (db) {
    try {
      const snap = await db.collection(EQUIPMENT_COLLECTION).get();
      if (!snap.empty) {
        return snap.docs.map((doc) => doc.data() as EquipmentItem);
      }
    } catch (err) {
      console.warn("[Firestore] getEquipmentList fallback to cache:", err);
    }
  }
  return Array.from(equipmentCache.values());
}

export async function getEquipmentById(id: string): Promise<EquipmentItem | null> {
  const normalizedId = id.toUpperCase().trim();
  const db = getFirestoreClient();
  if (db) {
    try {
      const doc = await db.collection(EQUIPMENT_COLLECTION).doc(normalizedId).get();
      if (doc.exists) {
        return doc.data() as EquipmentItem;
      }
    } catch (err) {
      console.warn(`[Firestore] getEquipmentById(${normalizedId}) fallback to cache:`, err);
    }
  }
  return equipmentCache.get(normalizedId) || null;
}

export async function updateEquipmentAnomaly(
  equipmentId: string,
  anomaly: EquipmentAnomaly
): Promise<EquipmentItem | null> {
  const item = equipmentCache.get(equipmentId.toUpperCase());
  if (!item) return null;

  // Add or update anomaly
  const existingIdx = item.activeAnomalies.findIndex((a) => a.id === anomaly.id);
  if (existingIdx >= 0) {
    item.activeAnomalies[existingIdx] = anomaly;
  } else {
    item.activeAnomalies.push(anomaly);
  }

  // Adjust health score
  if (anomaly.severity === "CRITICAL") {
    item.status = "CRITICAL";
    item.healthScore = Math.max(30, item.healthScore - 30);
  } else if (item.status !== "CRITICAL") {
    item.status = "WARNING";
    item.healthScore = Math.max(50, item.healthScore - 15);
  }

  equipmentCache.set(item.id, item);

  const db = getFirestoreClient();
  if (db) {
    try {
      await db.collection(EQUIPMENT_COLLECTION).doc(item.id).set(item, { merge: true });
    } catch (err) {
      console.warn("[Firestore] updateEquipmentAnomaly persist error:", err);
    }
  }

  return item;
}

