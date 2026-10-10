import { NextRequest, NextResponse } from "next/server";
import {
  getEquipmentKpis,
  getPlantOverviewAnalytics,
  getTelemetryHistory,
} from "@/lib/gcp/bigquery";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const equipmentId = searchParams.get("equipmentId");
    const metricName = searchParams.get("metric");
    const hours = Number(searchParams.get("hours")) || 24;

    if (equipmentId && metricName) {
      // Historical telemetry series
      const telemetry = await getTelemetryHistory(equipmentId, metricName, hours);
      const kpis = await getEquipmentKpis(equipmentId);
      return NextResponse.json({
        equipmentId,
        metricName,
        hours,
        telemetry,
        kpis,
      });
    }

    if (equipmentId) {
      const kpis = await getEquipmentKpis(equipmentId);
      return NextResponse.json({ kpis });
    }

    // Default: Plant-wide overview
    const overview = await getPlantOverviewAnalytics();
    return NextResponse.json(overview);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Failed to fetch analytics." },
      { status: 500 }
    );
  }
}

