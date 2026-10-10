import { NextRequest, NextResponse } from "next/server";
import {
  createWorkOrder,
  getWorkOrderById,
  getWorkOrders,
  updateWorkOrderStatus,
} from "@/lib/db/workorders";
import { WorkOrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const equipmentId = searchParams.get("equipmentId");

    if (id) {
      const order = await getWorkOrderById(id);
      if (!order) {
        return NextResponse.json({ error: `Work order ${id} not found.` }, { status: 404 });
      }
      return NextResponse.json(order);
    }

    const orders = await getWorkOrders(equipmentId || undefined);
    return NextResponse.json({ workOrders: orders });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || "Failed to fetch work orders." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || "create";

    if (action === "update_status") {
      const { id, status, actor, note } = body;
      if (!id || !status) {
        return NextResponse.json(
          { error: "Work order id and status are required for status update." },
          { status: 400 }
        );
      }
      const updated = await updateWorkOrderStatus(
        id,
        status as WorkOrderStatus,
        actor || "Technician",
        note
      );
      if (!updated) {
        return NextResponse.json({ error: `Work order ${id} not found.` }, { status: 404 });
      }
      return NextResponse.json({ workOrder: updated });
    }

    // Default: create work order
    const {
      equipmentId,
      equipmentName,
      title,
      description,
      severity,
      supportingEvidence,
      recommendedAction,
      sourceReferences,
      creatorName,
      assignedTechnician,
    } = body;

    if (!equipmentId || !title) {
      return NextResponse.json(
        { error: "equipmentId and title are required to create a work order." },
        { status: 400 }
      );
    }

    const result = await createWorkOrder({
      equipmentId,
      equipmentName: equipmentName || equipmentId,
      title,
      description: description || title,
      severity: severity || "MEDIUM",
      supportingEvidence,
      recommendedAction,
      sourceReferences,
      creatorName,
      assignedTechnician,
    });

    return NextResponse.json(result, { status: result.isDuplicate ? 200 : 201 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Failed to process work order request." },
      { status: 500 }
    );
  }
}

