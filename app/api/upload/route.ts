import { NextRequest, NextResponse } from "next/server";
import { createRunRecord } from "../../../lib/db/runs";
import { uploadFileToStorage } from "../../../lib/gcp/storage";
import { extractDrawingWithGemini } from "../../../lib/gcp/vertexai";
import { logError, logInfo } from "../../../lib/logger";
import { PipelineRun } from "../../../lib/types";

export async function POST(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") || `req-${Date.now()}`;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Missing required 'file' parameter in multipart form." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name || "part.step";
    const contentType = file.type || "application/octet-stream";
    const dotIndex = fileName.lastIndexOf(".");
    const ext = dotIndex >= 0 ? fileName.toLowerCase().substring(dotIndex) : "";

    const timestamp = Date.now();
    const runId = `run-${timestamp}`;
    const basePartName = fileName.replace(/\.[^/.]+$/, "");

    logInfo(`Initiating drawing/STEP upload for Architect Mode`, {
      requestId,
      runId,
      fileName,
      fileSizeBytes: buffer.length,
      contentType,
    });

    // 1. Upload source file to Cloud Storage
    const storageResult = await uploadFileToStorage({
      buffer,
      fileName,
      contentType,
      runId,
      category: "source",
    });

    // 2. Multimodal drawing extraction if input is 2D blueprint (PDF or Image)
    const is2dDrawing = [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".svg"].includes(ext);
    let drawingAnalysis;
    if (is2dDrawing) {
      try {
        drawingAnalysis = await extractDrawingWithGemini({
          buffer,
          gcsUri: storageResult.storageUri.startsWith("gs://") ? storageResult.storageUri : undefined,
          fileName,
          mimeType: contentType,
          requestId,
        });
      } catch (geminiErr) {
        logError("Gemini drawing extraction failed during upload", geminiErr, { requestId, runId });
      }
    }

    // 3. Initialize PipelineRun record
    const dateFormatted = new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const newRun: PipelineRun = {
      id: runId,
      name: basePartName,
      fileName,
      fileType: ext,
      fileSizeBytes: buffer.length,
      contentType,
      sourceStorageUri: storageResult.storageUri,
      timestamp: dateFormatted,
      createdAt: timestamp,
      updatedAt: timestamp,
      currentStage: 1,
      stagesCompleted: "1/8 stages",
      status: "running",
      isAssembly: fileName.toLowerCase().includes("assembly"),
      stageOutputs: {},
      ...(drawingAnalysis ? { drawingAnalysis } : {}),
      artifacts: [
        {
          id: `art-source-${timestamp}`,
          name: fileName,
          stageId: 1,
          contentType,
          storageUri: storageResult.storageUri,
          fileSizeBytes: buffer.length,
          createdAt: new Date().toISOString(),
        },
      ],
      logs: [
        {
          timestamp: new Date().toISOString(),
          level: "info",
          stageId: 1,
          stageName: "Source Ingestion",
          message: `Uploaded ${fileName} (${buffer.length} bytes) to ${storageResult.storageUri}`,
        },
      ],
    };

    // 4. Persist run document in Firestore
    await createRunRecord(newRun);

    return NextResponse.json(
      {
        success: true,
        run: newRun,
        storage: storageResult,
        drawingAnalysis,
      },
      { status: 201 }
    );
  } catch (error) {
    logError("POST /api/upload failed", error, { requestId });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error during upload",
      },
      { status: 500 }
    );
  }
}

