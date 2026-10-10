import { NextRequest, NextResponse } from "next/server";
import { formatFrontlinePlainText } from "@/lib/frontline/format";
import { classifyFrontlineIntent } from "@/lib/frontline/router";
import { retrieveMockRecords } from "@/lib/frontline/retriever";
import { FRONTLINE_SUMMARY_SYSTEM_INSTRUCTION } from "@/lib/gcp/prompts/frontline";
import { callGeminiText } from "@/lib/gcp/vertexai";
import { FRONTLINE_GUARDRAIL_MESSAGE } from "@/lib/mock/frontlineData";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const query = typeof body?.query === "string" ? body.query.trim() : "";
    const personaId = typeof body?.personaId === "string" ? body.personaId : undefined;
    const canApprovePo = Boolean(body?.canApprovePo);

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter cannot be empty." },
        { status: 400 }
      );
    }

    // Enforce message length limit
    if (query.length > 2000) {
      return NextResponse.json(
        { error: "Query exceeds maximum allowed length of 2000 characters." },
        { status: 400 }
      );
    }

    // 1. Classify route intent
    const decision = classifyFrontlineIntent(query, {
      canApprovePo,
      currentPersonaId: personaId,
    });

    // Path A: Canned interaction
    if (decision.path === "PATH_A") {
      return NextResponse.json({
        path: "PATH_A",
        scenario: decision.scenario,
      });
    }

    // Path C: Out of scope / guardrail
    if (decision.path === "PATH_C") {
      return NextResponse.json({
        path: "PATH_C",
        text: decision.guardrailText || FRONTLINE_GUARDRAIL_MESSAGE,
      });
    }

    // Path B: Analytical reasoning / multi-record summary over mock operational data
    const operationalData = retrieveMockRecords(query, personaId);

    const userPrompt = `MOCK OPERATIONAL RECORDS (SOLE SOURCE OF TRUTH):
${JSON.stringify(operationalData.records, null, 2)}

OPERATOR QUESTION:
"${query}"

INSTRUCTIONS:
1. Output strictly plain text. Do NOT use any Markdown formatting: no asterisks for bold (** or *), no hash symbols (# or ##), no backticks (\`), and no Markdown tables.
2. Directly answer the operator's specific question instead of reproducing the entire mock dataset. Include only records relevant to the question.
3. Do NOT begin with conversational preambles or filler like "Here's a summary of the current shift based on the provided records:" or "Based on the records:". Begin immediately with the operational facts.
4. Use clean section titles (e.g. Priority Issues: or Equipment Drift:) followed by standard bullet points (• ) and readable line breaks.
5. Keep equipment IDs, work-order numbers, quantities, units, and timestamps exact and accurate.
6. Ensure all bullet points and sections are completely finished.`;

    const { text, error, latencyMs } = await callGeminiText({
      systemInstruction: FRONTLINE_SUMMARY_SYSTEM_INSTRUCTION,
      prompt: userPrompt,
      temperature: 0.15,
      stageName: "frontline-mock-summary",
    });

    if (error || !text) {
      return NextResponse.json(
        {
          error: "Vertex AI is unavailable to generate operational summary.",
          details: error || "No response received from model endpoint.",
        },
        { status: 503 }
      );
    }

    // Server-side safety filter: strip any lingering Markdown syntax without altering data
    const cleanedText = formatFrontlinePlainText(text);

    return NextResponse.json({
      path: "PATH_B",
      text: cleanedText,
      category: operationalData.category,
      recordCount: operationalData.recordCount,
      latencyMs,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[Frontline Chat Route] Unexpected error:", err);
    return NextResponse.json(
      {
        error: "Internal server error while processing frontline message.",
        details: err.message,
      },
      { status: 500 }
    );
  }
}

