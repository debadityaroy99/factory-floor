import { NextRequest, NextResponse } from "next/server";
import { extractDrawingWithGemini } from "@/lib/gcp/vertexai";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json(
          { error: "No file was provided in the request." },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const analysis = await extractDrawingWithGemini({
        buffer,
        fileName: file.name,
      });

      return NextResponse.json({ success: true, analysis });
    }

    const body = await req.json();
    const { gcsUri, fileName = "blueprint.png" } = body;

    if (!gcsUri) {
      return NextResponse.json(
        { error: "gcsUri or file form upload is required." },
        { status: 400 }
      );
    }

    const analysis = await extractDrawingWithGemini({
      gcsUri,
      fileName,
    });

    return NextResponse.json({ success: true, analysis });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[Vision API Route] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to analyze document with Vision AI." },
      { status: 500 }
    );
  }
}
