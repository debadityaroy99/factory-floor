import { BigQuery } from "@google-cloud/bigquery";
import { config } from "../config";
import { EquipmentKpiSummary, TelemetryPoint } from "../types";

let bigqueryClient: BigQuery | null = null;

export function getBigQueryClient(): BigQuery | null {
  if (config.useMockGcp) {
    return null;
  }
  if (!bigqueryClient) {
    try {
      bigqueryClient = new BigQuery({
        projectId: config.projectId,
      });
    } catch (err) {
      console.warn("[BigQuery] Client initialization failed, using analytics fallback engine:", err);
      bigqueryClient = null;
    }
  }
  return bigqueryClient;
}

// =========================================================================
// IN-MEMORY TELEMETRY & ANALYTICS ENGINE (Used in local dev / fallback)
// =========================================================================

// Generate 24 hours of demo telemetry with realistic drift
function generateBaselineTelemetry(): TelemetryPoint[] {
  const points: TelemetryPoint[] = [];
  const now = Date.now();
  const oneHour = 3600 * 1000;

  // 1. PRESS-03: Hydraulic temperature drifting up over the past 8 hours
  for (let i = 24; i >= 0; i--) {
    const time = new Date(now - i * oneHour).toISOString();
    // Baseline is 65°C ± 2°C; in the last 8 hours, it drifts up to 78°C
    let temp = 65 + (Math.sin(i) * 1.5);
    let isAnomaly = false;
    if (i <= 8) {
      const drift = (8 - i) * 1.625; // drifts from 0 to 13°C over baseline
      temp += drift;
      if (temp > 75) isAnomaly = true;
    }

    points.push({
      equipmentId: "PRESS-03",
      timestamp: time,
      metricName: "hydraulic_oil_temp",
      metricValue: Math.round(temp * 10) / 10,
      unit: "°C",
      baselineMean: 65.0,
      baselineStddev: 5.0,
      isAnomaly,
      isDemoData: true,
    });
  }

  // 2. CNC-04: Coolant Pressure dipping
  for (let i = 24; i >= 0; i--) {
    const time = new Date(now - i * oneHour).toISOString();
    let psi = 45.0 + (Math.cos(i) * 1.2);
    let isAnomaly = false;
    if (i <= 4) {
      psi -= 16.0; // drops to ~29 PSI (warning threshold 35 PSI)
      isAnomaly = true;
    }
    points.push({
      equipmentId: "CNC-04",
      timestamp: time,
      metricName: "coolant_pressure",
      metricValue: Math.round(psi * 10) / 10,
      unit: "PSI",
      baselineMean: 45.0,
      baselineStddev: 3.5,
      isAnomaly,
      isDemoData: true,
    });
  }

  // 3. CONV-02: Vibration Spike
  for (let i = 24; i >= 0; i--) {
    const time = new Date(now - i * oneHour).toISOString();
    let vib = 1.8 + (Math.sin(i * 2) * 0.2);
    let isAnomaly = false;
    if (i === 1) {
      vib = 4.2; // spike above 3.5 mm/s threshold
      isAnomaly = true;
    }
    points.push({
      equipmentId: "CONV-02",
      timestamp: time,
      metricName: "bearing_vibration",
      metricValue: Math.round(vib * 100) / 100,
      unit: "mm/s RMS",
      baselineMean: 1.8,
      baselineStddev: 0.4,
      isAnomaly,
      isDemoData: true,
    });
  }

  return points;
}

const memoryTelemetryStore: TelemetryPoint[] = generateBaselineTelemetry();

const memoryKpis: Record<string, EquipmentKpiSummary> = {
  "PRESS-03": {
    equipmentId: "PRESS-03",
    equipmentName: "Hydraulic Press 3 · Line 2",
    mtbfHours: 480,
    mttrMinutes: 65,
    availabilityPercent: 96.4,
    totalDowntimeHours24h: 1.2,
    failureCount30d: 2,
    repeatFailureRate: 0.15,
    lastCalculatedAt: new Date().toISOString(),
    isDemoAnalytics: true,
  },
  "CNC-04": {
    equipmentId: "CNC-04",
    equipmentName: "CNC Machining Center · Station 4",
    mtbfHours: 320,
    mttrMinutes: 90,
    availabilityPercent: 93.8,
    totalDowntimeHours24h: 3.5,
    failureCount30d: 3,
    repeatFailureRate: 0.33,
    lastCalculatedAt: new Date().toISOString(),
    isDemoAnalytics: true,
  },
  "CONV-02": {
    equipmentId: "CONV-02",
    equipmentName: "Main Conveyor Assembly · Line 1",
    mtbfHours: 720,
    mttrMinutes: 45,
    availabilityPercent: 98.7,
    totalDowntimeHours24h: 0.0,
    failureCount30d: 1,
    repeatFailureRate: 0.0,
    lastCalculatedAt: new Date().toISOString(),
    isDemoAnalytics: true,
  },
};

// =========================================================================
// BIGQUERY REPOSITORIES & QUERIES
// =========================================================================

/**
 * Fetch time-series telemetry points for a given equipment and metric.
 * Uses parameterized queries to avoid SQL injection and bounded time windows for cost control.
 */
export async function getTelemetryHistory(
  equipmentId: string,
  metricName?: string,
  hours = 24
): Promise<TelemetryPoint[]> {
  const bq = getBigQueryClient();

  if (bq) {
    try {
      const query = `
        SELECT
          equipment_id AS equipmentId,
          CAST(timestamp AS STRING) AS timestamp,
          metric_name AS metricName,
          metric_value AS metricValue,
          unit,
          baseline_mean AS baselineMean,
          baseline_stddev AS baselineStddev,
          is_anomaly AS isAnomaly,
          FALSE AS isDemoData
        FROM \`${config.projectId}.${config.bigqueryDataset}.sensor_telemetry\`
        WHERE equipment_id = @equipmentId
          ${metricName ? "AND metric_name = @metricName" : ""}
          AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL @hours HOUR)
        ORDER BY timestamp ASC
        LIMIT 500
      `;

      const options = {
        query,
        params: {
          equipmentId,
          ...(metricName ? { metricName } : {}),
          hours,
        },
      };

      const [rows] = await bq.query(options);
      if (rows && rows.length > 0) {
        return rows as TelemetryPoint[];
      }
    } catch (err) {
      console.warn("[BigQuery] getTelemetryHistory query failed, falling back to analytics store:", err);
    }
  }

  // Fallback to memory store with bounded filter
  const cutoff = Date.now() - hours * 3600 * 1000;
  const targetMetric = metricName ? metricName.toLowerCase().replace(/[^a-z0-9]/g, "") : null;

  return memoryTelemetryStore
    .filter(
      (p) =>
        p.equipmentId.toUpperCase() === equipmentId.toUpperCase() &&
        (!targetMetric || p.metricName.toLowerCase().replace(/[^a-z0-9]/g, "") === targetMetric) &&
        new Date(p.timestamp).getTime() >= cutoff
    )
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

/**
 * Fetch calculated MTBF, MTTR, Availability, and Repeat Failure KPIs for equipment.
 */
export async function getEquipmentKpis(
  equipmentId: string
): Promise<EquipmentKpiSummary | null> {
  const bq = getBigQueryClient();

  if (bq) {
    try {
      const query = `
        SELECT
          equipment_id AS equipmentId,
          ANY_VALUE(equipment_name) AS equipmentName,
          ROUND(AVG(mtbf_hours), 1) AS mtbfHours,
          ROUND(AVG(mttr_minutes), 1) AS mttrMinutes,
          ROUND(AVG(availability_pct), 1) AS availabilityPercent,
          ROUND(SUM(downtime_hours_24h), 1) AS totalDowntimeHours24h,
          COUNT(event_id) AS failureCount30d,
          ROUND(COUNTIF(is_repeat) / NULLIF(COUNT(event_id), 0), 2) AS repeatFailureRate,
          CAST(CURRENT_TIMESTAMP() AS STRING) AS lastCalculatedAt,
          FALSE AS isDemoAnalytics
        FROM \`${config.projectId}.${config.bigqueryDataset}.equipment_kpi_summary\`
        WHERE equipment_id = @equipmentId
        GROUP BY equipment_id
        LIMIT 1
      `;

      const [rows] = await bq.query({ query, params: { equipmentId } });
      if (rows && rows.length > 0) {
        return rows[0] as EquipmentKpiSummary;
      }
    } catch (err) {
      console.warn("[BigQuery] getEquipmentKpis query failed, falling back to analytics store:", err);
    }
  }

  return memoryKpis[equipmentId] || null;
}

/**
 * Returns plant-wide overview metrics across all monitored equipment.
 */
export async function getPlantOverviewAnalytics(): Promise<EquipmentKpiSummary[]> {
  const bq = getBigQueryClient();

  if (bq) {
    try {
      const query = `
        SELECT
          equipment_id AS equipmentId,
          ANY_VALUE(equipment_name) AS equipmentName,
          ROUND(AVG(mtbf_hours), 1) AS mtbfHours,
          ROUND(AVG(mttr_minutes), 1) AS mttrMinutes,
          ROUND(AVG(availability_pct), 1) AS availabilityPercent,
          ROUND(SUM(downtime_hours_24h), 1) AS totalDowntimeHours24h,
          COUNT(event_id) AS failureCount30d,
          ROUND(COUNTIF(is_repeat) / NULLIF(COUNT(event_id), 0), 2) AS repeatFailureRate,
          CAST(CURRENT_TIMESTAMP() AS STRING) AS lastCalculatedAt,
          FALSE AS isDemoAnalytics
        FROM \`${config.projectId}.${config.bigqueryDataset}.equipment_kpi_summary\`
        GROUP BY equipment_id
        LIMIT 20
      `;

      const [rows] = await bq.query({ query });
      if (rows && rows.length > 0) {
        return rows as EquipmentKpiSummary[];
      }
    } catch (err) {
      console.warn("[BigQuery] getPlantOverviewAnalytics query failed, using analytics store:", err);
    }
  }

  return Object.values(memoryKpis);
}

/**
 * Ingests a batch of telemetry data points into BigQuery (and memory store).
 */
export async function insertTelemetryBatch(points: TelemetryPoint[]): Promise<void> {
  // Always update memory store
  memoryTelemetryStore.push(...points);

  const bq = getBigQueryClient();
  if (bq) {
    try {
      const table = bq.dataset(config.bigqueryDataset).table("sensor_telemetry");
      const rows = points.map((p) => ({
        equipment_id: p.equipmentId,
        timestamp: p.timestamp,
        metric_name: p.metricName,
        metric_value: p.metricValue,
        unit: p.unit,
        baseline_mean: p.baselineMean,
        baseline_stddev: p.baselineStddev,
        is_anomaly: p.isAnomaly,
      }));
      await table.insert(rows);
    } catch (err) {
      console.error("[BigQuery] insertTelemetryBatch failed:", err);
    }
  }
}
