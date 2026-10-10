import { NextRequest, NextResponse } from "next/server";
import { addRunToProject, ProjectItem } from "@/lib/db/projects";
import { logError, logInfo } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      projectId,
      moduleName,
      moduleCode,
      runTitle,
      fileName,
      result,
      resultType,
      runId,
      sampleStep,
      isDemo,
      details,
    } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "Missing required parameter: projectId" },
        { status: 400 }
      );
    }

    if (!moduleCode || !moduleName) {
      return NextResponse.json(
        { error: "Missing required parameters: moduleCode and moduleName" },
        { status: 400 }
      );
    }

    logInfo("Recording module run for project in Firestore and Cloud Storage", {
      service: "firestore",
      projectId,
      moduleCode,
      runTitle,
    });

    const updatedProject: ProjectItem = await addRunToProject({
      projectId,
      moduleName,
      moduleCode,
      runTitle: runTitle || `${moduleName} Execution`,
      fileName: fileName || "model.step",
      result: result || "COMPLETED",
      resultType: resultType || "clear",
      runId,
      sampleStep,
      isDemo: !!isDemo,
      details,
    });

    return NextResponse.json({ success: true, project: updatedProject }, { status: 200 });
  } catch (error) {
    logError("POST /api/architect/projects/runs failed", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to record run to project",
      },
      { status: 500 }
    );
  }
}
