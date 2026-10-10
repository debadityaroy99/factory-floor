import { NextRequest, NextResponse } from "next/server";
import { getRunRecord, listRunRecords } from "@/lib/db/runs";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const runId = searchParams.get("id");

    if (runId) {
      const run = await getRunRecord(runId);
      if (!run) {
        return NextResponse.json(
          { error: `Run with id '${runId}' not found.` },
          { status: 404 }
        );
      }
      return NextResponse.json({ run });
    }

    const runs = await listRunRecords();
    return NextResponse.json({ runs });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[Runs API] Error fetching runs:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch runs." },
      { status: 500 }
    );
  }
}
