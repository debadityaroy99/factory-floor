import { NextRequest, NextResponse } from "next/server";
import {
  createProjectRecord,
  deleteProjectRecord,
  listProjectRecords,
  ProjectItem,
} from "../../../../lib/db/projects";
import { logError, logInfo } from "../../../../lib/logger";

export async function GET() {
  try {
    const projects = await listProjectRecords();
    return NextResponse.json({ projects });
  } catch (error) {
    logError("GET /api/architect/projects failed", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to retrieve projects from Firestore",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let name = "Untitled project";
    let dwg = "DWG UNTITLED · REV —";
    let thumb: "sheet" | "plate" | "probe" | "bom" | "blank" | undefined;
    let status: "IN REVIEW" | "ISSUES OPEN" | "RELEASED" | "DRAFT" | undefined;
    let chipType: string | undefined;
    let filePayload: { buffer: Buffer; fileName: string; contentType: string } | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      name = (formData.get("name") as string) || "Untitled project";
      if (formData.get("dwg")) dwg = formData.get("dwg") as string;
      if (formData.get("thumb")) thumb = formData.get("thumb") as any;
      if (formData.get("status")) status = formData.get("status") as any;
      if (formData.get("chipType")) chipType = formData.get("chipType") as string;

      const file = formData.get("file") as File | null;
      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        filePayload = {
          buffer,
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
        };
      }
    } else {
      const body = await req.json().catch(() => ({}));
      if (body.name) name = body.name;
      if (body.dwg) dwg = body.dwg;
      if (body.thumb) thumb = body.thumb;
      if (body.status) status = body.status;
      if (body.chipType) chipType = body.chipType;
    }

    logInfo("Creating new project with Firestore and Cloud Storage backing", {
      service: "firestore",
      name,
      hasFile: !!filePayload,
      chipType,
    });

    const project: ProjectItem = await createProjectRecord({
      name,
      dwg,
      thumb,
      status,
      chipType,
      file: filePayload,
    });

    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (error) {
    logError("POST /api/architect/projects failed", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to persist project",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");

    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) {
      return NextResponse.json(
        { error: "Missing required 'id' parameter for project deletion." },
        { status: 400 }
      );
    }

    logInfo(`Deleting project '${id}' from Firestore and Cloud Storage`, {
      service: "firestore",
      projectId: id,
    });

    await deleteProjectRecord(id);

    return NextResponse.json({ success: true, id }, { status: 200 });
  } catch (error) {
    logError("DELETE /api/architect/projects failed", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete project",
      },
      { status: 500 }
    );
  }
}
