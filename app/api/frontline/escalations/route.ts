import { NextRequest, NextResponse } from "next/server";
import {
  acknowledgeEscalation,
  getEscalations,
  triggerEscalation,
} from "@/lib/db/escalations";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const equipmentId = searchParams.get("equipmentId");
    const list = await getEscalations(equipmentId || undefined);
    return NextResponse.json({ escalations: list });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Failed to fetch escalations." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || "trigger";

    if (action === "acknowledge") {
      const { id, acknowledgedBy, outcome } = body;
      if (!id || !acknowledgedBy) {
        return NextResponse.json(
          { error: "Escalation id and acknowledgedBy are required." },
          { status: 400 }
        );
      }
      const updated = await acknowledgeEscalation(id, acknowledgedBy, outcome);
      if (!updated) {
        return NextResponse.json({ error: `Escalation ${id} not found.` }, { status: 404 });
      }
      return NextResponse.json({ escalation: updated });
    }

    const { workOrderId, equipmentId, severity, reason, evidence, safetyCritical } = body;
    if (!equipmentId || !reason) {
      return NextResponse.json(
        { error: "equipmentId and reason are required to trigger an escalation." },
        { status: 400 }
      );
    }

    const result = await triggerEscalation({
      workOrderId,
      equipmentId,
      severity: severity || "HIGH",
      reason,
      evidence: evidence || "Operational drift threshold exceeded",
      safetyCritical: !!safetyCritical,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Failed to trigger escalation." },
      { status: 500 }
    );
  }
}

