import { NextRequest, NextResponse } from "next/server";
import { getRunRecord, listRunRecords } from "../../../../lib/db/runs";
import { logError } from "../../../../lib/logger";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 20;

    if (id) {
      const run = await getRunRecord(id);
      if (!run) {
        return NextResponse.json({ error: `Run with ID '${id}' not found.` }, { status: 404 });
      }
      return NextResponse.json({ run });
    }

    const runs = await listRunRecords(limit);
    return NextResponse.json({ runs });
  } catch (error) {
    logError("GET /api/architect/runs failed", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to retrieve pipeline runs",
      },
      { status: 500 }
    );
  }
}

