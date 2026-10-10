import { NextRequest, NextResponse } from "next/server";
import { getEquipmentById, getEquipmentList } from "@/lib/db/equipment";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const item = await getEquipmentById(id);
      if (!item) {
        return NextResponse.json({ error: `Equipment ${id} not found.` }, { status: 404 });
      }
      return NextResponse.json(item);
    }

    const list = await getEquipmentList();
    return NextResponse.json({ equipment: list });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || "Failed to fetch equipment." }, { status: 500 });
  }
}

