import { NextRequest, NextResponse } from "next/server";
import {
  approveKnowledgeRecord,
  createKnowledgeRecord,
  getKnowledgeById,
  getKnowledgeRecords,
  searchTribalKnowledge,
} from "@/lib/db/knowledge";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const query = searchParams.get("query");
    const equipmentId = searchParams.get("equipmentId");

    if (id) {
      const record = await getKnowledgeById(id);
      if (!record) {
        return NextResponse.json({ error: `Knowledge record ${id} not found.` }, { status: 404 });
      }
      return NextResponse.json(record);
    }

    if (query) {
      const results = await searchTribalKnowledge(query);
      return NextResponse.json({ knowledge: results });
    }

    const records = await getKnowledgeRecords(equipmentId || undefined);
    return NextResponse.json({ knowledge: records });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Failed to fetch tribal knowledge." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || "create";

    if (action === "approve") {
      const { id, approvedBy } = body;
      if (!id || !approvedBy) {
        return NextResponse.json(
          { error: "Knowledge record id and approvedBy name are required." },
          { status: 400 }
        );
      }
      const approved = await approveKnowledgeRecord(id, approvedBy);
      if (!approved) {
        return NextResponse.json({ error: `Knowledge record ${id} not found.` }, { status: 404 });
      }
      return NextResponse.json({ record: approved });
    }

    const {
      equipmentId,
      equipmentName,
      title,
      symptoms,
      probableCauses,
      diagnosticSteps,
      actualRootCause,
      repairPerformed,
      partsUsed,
      downtimeMinutes,
      verificationResults,
      authorName,
      authorRole,
      linkedWorkOrderIds,
      linkedDocCitations,
      isTechnicianConfirmed,
      aiGeneratedSuggestion,
    } = body;

    if (!equipmentId || !title || !actualRootCause) {
      return NextResponse.json(
        { error: "equipmentId, title, and actualRootCause are required." },
        { status: 400 }
      );
    }

    const record = await createKnowledgeRecord({
      equipmentId,
      equipmentName: equipmentName || equipmentId,
      title,
      symptoms: Array.isArray(symptoms) ? symptoms : [symptoms || ""],
      probableCauses: Array.isArray(probableCauses) ? probableCauses : [probableCauses || ""],
      diagnosticSteps: Array.isArray(diagnosticSteps) ? diagnosticSteps : [diagnosticSteps || ""],
      actualRootCause,
      repairPerformed: repairPerformed || "",
      partsUsed: Array.isArray(partsUsed) ? partsUsed : [partsUsed || ""],
      downtimeMinutes: Number(downtimeMinutes) || 0,
      verificationResults: verificationResults || "",
      authorName: authorName || "Technician",
      authorRole: authorRole || "Shopfloor Specialist",
      linkedWorkOrderIds,
      linkedDocCitations,
      isTechnicianConfirmed: isTechnicianConfirmed !== undefined ? !!isTechnicianConfirmed : true,
      aiGeneratedSuggestion: !!aiGeneratedSuggestion,
    });

    return NextResponse.json({ record }, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Failed to process knowledge record." },
      { status: 500 }
    );
  }
}

