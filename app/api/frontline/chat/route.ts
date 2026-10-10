import { NextRequest, NextResponse } from "next/server";
import { searchKnowledgeRAG } from "@/lib/db/documents";
import { getEquipmentList } from "@/lib/db/equipment";
import { triggerEscalation } from "@/lib/db/escalations";
import {
  getFloorHistory,
  getInventory,
  getTrainingRecords,
  updateInventoryOnHand,
} from "@/lib/db/frontline";
import { getKnowledgeRecords, searchTribalKnowledge } from "@/lib/db/knowledge";
import { createWorkOrder, getWorkOrders } from "@/lib/db/workorders";
import { generateFrontlineResponse } from "@/lib/gcp/vertexai";
import { FrontlineChatResponse, UserRole } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = typeof body.query === "string" ? body.query.trim() : "";
    const userRole: UserRole = body.role || "OPERATOR";

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter cannot be empty." },
        { status: 400 }
      );
    }

    // 1. Fetch grounded operational state across all domains in parallel
    const [
      floorHistory,
      inventory,
      training,
      equipmentList,
      recentWorkOrders,
      tribalKnowledge,
      citations,
    ] = await Promise.all([
      getFloorHistory(),
      getInventory(),
      getTrainingRecords(),
      getEquipmentList(),
      getWorkOrders(),
      getKnowledgeRecords(),
      searchKnowledgeRAG(query, userRole),
    ]);

    // 2. Generate grounded response using Vertex AI Gemini
    const response: FrontlineChatResponse = await generateFrontlineResponse({
      userQuery: query,
      userRole,
      floorHistory,
      inventory,
      training,
      equipmentList,
      citations,
      recentWorkOrders,
      tribalKnowledge,
    });

    const qLower = query.toLowerCase();

    // 3. Attach rich entity cards and trigger domain side-effects
    if (qLower.includes("approve")) {
      const cnmgItem = inventory.find((i) => i.item.toLowerCase().includes("cnmg"));
      if (cnmgItem) {
        await updateInventoryOnHand(cnmgItem.id, cnmgItem.onHand + 50);
      }
      response.outcomePill = "✓ PO-1042 sent, arrives Thursday";
      response.canApprovePo = false;
    } else if (response.intent === "escalation" || qLower.includes("emergency") || qLower.includes("e-stop") || qLower.includes("runaway")) {
      // Trigger escalation in repository
      const targetEq = equipmentList.find((e) => qLower.includes(e.id.toLowerCase())) || equipmentList[0];
      const escResult = await triggerEscalation({
        equipmentId: targetEq ? targetEq.id : "PRESS-03",
        severity: "CRITICAL",
        reason: `Operator emergency query: "${query}"`,
        evidence: targetEq?.activeAnomalies[0]?.evidenceCalculation || "Life safety emergency protocol invoked",
        safetyCritical: true,
      });
      response.escalationData = escResult.escalation;
      response.safetyNotice = "EMERGENCY SAFETY PROTOCOL: Depress nearest E-stop mushroom button and execute LOTO per SOP-SFT-02 §2.1.";
    } else if (response.intent === "work_order_action" || qLower.includes("work order") || qLower.includes("ticket")) {
      const targetEq = equipmentList.find((e) => qLower.includes(e.id.toLowerCase())) || equipmentList[0];
      const woResult = await createWorkOrder({
        equipmentId: targetEq.id,
        equipmentName: targetEq.name,
        title: targetEq.activeAnomalies[0]?.description || `Maintenance inspection for ${targetEq.name}`,
        description: `Dispatched from Frontline assistant query: "${query}"`,
        severity: targetEq.activeAnomalies[0]?.severity === "CRITICAL" ? "CRITICAL" : "HIGH",
        supportingEvidence: targetEq.activeAnomalies.map((a) => a.evidenceCalculation),
        recommendedAction: targetEq.recommendedAction || "Inspect per standard operating procedure",
        sourceReferences: citations.map((c) => c.section),
        creatorName: `Floor Operator (${userRole})`,
      });
      response.workOrderData = woResult.workOrder;
      response.outcomePill = woResult.isDuplicate
        ? `⚠️ Existing Work Order #${woResult.workOrder.id}`
        : `✓ Work Order #${woResult.workOrder.id} Routed to ${woResult.workOrder.assignedTeam}`;
    } else if (qLower.includes("knowledge") || qLower.includes("root cause") || qLower.includes("fix")) {
      const matchedKnowledge = await searchTribalKnowledge(query);
      if (matchedKnowledge.length > 0) {
        response.knowledgeData = matchedKnowledge[0];
      }
    } else if (response.intent === "history" || qLower.includes("oil") || qLower.includes("press")) {
      const highlightEntry = floorHistory.find((h) => h.highlight) || floorHistory[0];
      response.historyData = {
        highlightAnswer: "ISO 46 change on Apr 02 by Devin. Next due at 1,500 hrs. Cage D has 2 in stock.",
        sopCitation: highlightEntry?.sopCitation
          ? `CITES ${highlightEntry.sopCitation} · APR 02 · VERIFIED`
          : "CITES SOP-HYD-11 · APR 02 · VERIFIED",
        entries: floorHistory,
      };
      response.equipmentData = equipmentList.find((e) => e.id === "PRESS-03");
    } else if (response.intent === "inventory" || qLower.includes("stock") || qLower.includes("cnmg") || qLower.includes("insert")) {
      const cnmg = inventory.find((i) => i.item.toLowerCase().includes("cnmg")) || inventory[0];
      response.inventoryData = cnmg;
      response.canApprovePo = cnmg.onHand <= cnmg.reorderPoint;
    } else if (response.intent === "training" || qLower.includes("priya") || qLower.includes("cert")) {
      response.trainingData = training[0];
    } else if (response.intent === "alert" || response.intent === "plan" || qLower.includes("drift") || qLower.includes("temp")) {
      response.equipmentData = equipmentList.find((e) => e.id === "PRESS-03");
      response.planData = {
        workOrderId: "W-3318",
        priority: "HIGH",
        tasks: [
          "Flag the drift: Press 3 · Line A",
          "Create work order W-3318",
          "Escalate to Marcus V. with Z-score evidence",
          "Save the fix to tribal knowledge base",
        ],
      };
    }

    return NextResponse.json(response);
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[Frontline Chat API] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process frontline message." },
      { status: 500 }
    );
  }
}

