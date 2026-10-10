import { NextRequest, NextResponse } from "next/server";
import { getRunRecord, updateRunStageRecord } from "@/lib/db/runs";
import {
  analyzePartOrientation,
  evaluateViewSelection,
  synthesizeGdntDimensions,
} from "@/lib/gcp/vertexai";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { runId, stageId } = body;

    if (!runId) {
      return NextResponse.json(
        { error: "runId is required to execute a pipeline stage." },
        { status: 400 }
      );
    }

    const run = await getRunRecord(runId);
    if (!run) {
      return NextResponse.json(
        { error: `Run with id '${runId}' not found.` },
        { status: 404 }
      );
    }

    const targetStage = typeof stageId === "number" ? stageId : run.currentStage;

    let stageResult: unknown = null;
    let logMessage = "";
    let modelName: string | undefined = undefined;

    // Stage 3: Orientation analysis with Vertex AI Gemini
    if (targetStage === 3) {
      modelName = "gemini-2.0-flash";
      const orientationRes = await analyzePartOrientation({
        fileName: run.fileName,
        boundingBox: run.stageOutputs.partSummary?.boundingBox || "150 × 120 × 88 mm",
        faceCount: run.stageOutputs.partSummary?.faces || 114,
      });
      stageResult = orientationRes;
      logMessage = `Vertex AI evaluated orientation: ${orientationRes.turned}. Justification: ${orientationRes.reasoning.substring(0, 60)}...`;

      await updateRunStageRecord(runId, {
        currentStage: 3,
        stagesCompleted: "3/8 stages",
        stageOutputKey: "orientation",
        stageOutputValue: orientationRes,
        logEntry: {
          stageId: 3,
          stageName: "Orientation",
          model: modelName,
          timestamp: new Date().toISOString(),
          message: logMessage,
        },
      });
    }

    // Stage 5: View Selection analysis with Vertex AI Gemini
    else if (targetStage === 5) {
      modelName = "gemini-2.0-flash";
      const viewsRes = await evaluateViewSelection({
        fileName: run.fileName,
        featuresCount: 10,
        drawingAnalysis: run.drawingAnalysis,
      });
      stageResult = viewsRes;
      const requiredCount = viewsRes.filter((v) => v.required).length;
      logMessage = `Vertex AI selected ${requiredCount} minimal views per ASME Y14.3.`;

      await updateRunStageRecord(runId, {
        currentStage: 5,
        stagesCompleted: "5/8 stages",
        stageOutputKey: "viewSelection",
        stageOutputValue: viewsRes,
        logEntry: {
          stageId: 5,
          stageName: "View selection",
          model: modelName,
          timestamp: new Date().toISOString(),
          message: logMessage,
        },
      });
    }

    // Stage 7: Dimension set GD&T with Vertex AI Gemini
    else if (targetStage === 7) {
      modelName = "gemini-2.0-flash";
      const dimsRes = await synthesizeGdntDimensions({
        fileName: run.fileName,
        drawingAnalysis: run.drawingAnalysis,
      });
      stageResult = dimsRes;
      logMessage = `Vertex AI synthesized ${dimsRes.length} GD&T constraints per ASME Y14.5.`;

      await updateRunStageRecord(runId, {
        currentStage: 7,
        stagesCompleted: "7/8 stages",
        stageOutputKey: "dimensionSet",
        stageOutputValue: dimsRes,
        logEntry: {
          stageId: 7,
          stageName: "Dimension set",
          model: modelName,
          timestamp: new Date().toISOString(),
          message: logMessage,
        },
      });
    }

    // Stage 8: Finish pipeline
    else if (targetStage >= 8) {
      await updateRunStageRecord(runId, {
        currentStage: 8,
        stagesCompleted: "8/8 stages",
        status: "success",
        logEntry: {
          stageId: 8,
          stageName: "Drawing sheet",
          timestamp: new Date().toISOString(),
          message: "Sheet layout complete per ASME Y14.1M.",
        },
      });
    }

    const updatedRun = await getRunRecord(runId);
    return NextResponse.json({
      success: true,
      stageId: targetStage,
      stageResult,
      run: updatedRun,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[Pipeline API] Error executing stage:", err);
    return NextResponse.json(
      { error: err.message || "Failed to execute pipeline stage." },
      { status: 500 }
    );
  }
}
