/**
 * Google Cloud Vertex AI Gemini Client & Service Layer for Manufy Architect Mode.
 *
 * Configured for project `builder-cup` in region `asia-south1` with `gemini-2.5-flash`.
 * Implements robust JSON parsing, transient-error retries, fallback tracking,
 * and structured observability.
 */

import { VertexAI } from "@google-cloud/vertexai";
import { config } from "../config";
import { logError, logInfo, logWarn } from "../logger";
import {
  DimensionItem,
  DrawingExtractionResult,
  DrawingTitleBlock,
  DrawingViewAnnotation,
  ExtractedDimensionItem,
  ExtractedGdtSymbol,
  OrientationAnalysis,
  ViewSelectionItem,
} from "../types";
import {
  DRAWING_EXTRACTION_SYSTEM_INSTRUCTION,
  GDNT_SYSTEM_INSTRUCTION,
  ORIENTATION_SYSTEM_INSTRUCTION,
  VIEW_SELECTION_SYSTEM_INSTRUCTION,
} from "./prompts/architect";

let vertexClientInstance: VertexAI | null = null;

export function getVertexClient(): VertexAI | null {
  if (config.useMockServices) {
    return null;
  }
  if (!vertexClientInstance) {
    try {
      vertexClientInstance = new VertexAI({
        project: config.projectId,
        location: config.region,
      });
    } catch (err) {
      logWarn("Vertex AI client initialization failed", {
        service: "vertexai",
        error: String(err),
      });
      vertexClientInstance = null;
    }
  }
  return vertexClientInstance;
}

/**
 * Robust JSON extraction from LLM responses:
 * Strips markdown code fences (```json ... ```) and extracts outermost JSON substring.
 */
export function cleanJsonString(raw: string): string {
  if (!raw || typeof raw !== "string") return "";

  let cleaned = raw.trim();

  // Strip leading and trailing markdown code fences
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "").trim();
  }

  // If text contains surrounding prose with a JSON block inside
  const firstCurly = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");

  if (firstBracket !== -1 && (firstCurly === -1 || firstBracket < firstCurly)) {
    const lastBracket = cleaned.lastIndexOf("]");
    if (lastBracket !== -1 && lastBracket > firstBracket) {
      cleaned = cleaned.substring(firstBracket, lastBracket + 1);
    }
  } else if (firstCurly !== -1) {
    const lastCurly = cleaned.lastIndexOf("}");
    if (lastCurly !== -1 && lastCurly > firstCurly) {
      cleaned = cleaned.substring(firstCurly, lastCurly + 1);
    }
  }

  return cleaned;
}

/**
 * Determine if an error is transient and eligible for retry.
 */
function isTransientError(err: unknown): boolean {
  if (!err) return false;
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("429") ||
    msg.includes("503") ||
    msg.includes("504") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("UNAVAILABLE") ||
    msg.includes("timeout") ||
    msg.includes("ETIMEDOUT") ||
    msg.includes("ECONNRESET")
  );
}

/**
 * Executes a Gemini request with bounded retries on transient network/quota failures.
 */
async function executeWithRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; stageName: string; requestId?: string }
): Promise<T> {
  const maxRetries = options.maxRetries ?? 2;
  let attempt = 0;
  let delayMs = 500;

  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt > maxRetries || !isTransientError(err)) {
        throw err;
      }
      logWarn(`Vertex AI transient error on attempt ${attempt}/${maxRetries}. Retrying in ${delayMs}ms...`, {
        service: "vertexai",
        stageName: options.stageName,
        requestId: options.requestId,
        error: String(err),
      });
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      delayMs *= 2; // exponential backoff
    }
  }
}

/**
 * Execute a structured JSON prompt with Vertex AI Gemini.
 */
export async function callGeminiJson<T>(params: {
  systemInstruction: string;
  prompt: string;
  temperature?: number;
  timeoutMs?: number;
  stageName?: string;
  requestId?: string;
}): Promise<{ data: T | null; rawResponse?: string; latencyMs: number; error?: string }> {
  const {
    systemInstruction,
    prompt,
    temperature = 0.15,
    timeoutMs = 25000,
    stageName = "gemini-json",
    requestId,
  } = params;

  const client = getVertexClient();
  if (!client) {
    return { data: null, latencyMs: 0, error: "Vertex AI client not initialized (mock mode or missing credentials)" };
  }

  const startTime = Date.now();

  try {
    const generativeModel = client.getGenerativeModel({
      model: config.vertexModel,
      generationConfig: {
        responseMimeType: "application/json",
        temperature,
        maxOutputTokens: 4096,
      },
      systemInstruction: {
        role: "system",
        parts: [{ text: systemInstruction }],
      },
    });

    const result = await executeWithRetry(
      async () => {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Vertex AI timed out after ${timeoutMs}ms`)), timeoutMs)
        );
        const callPromise = generativeModel.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        });
        return Promise.race([callPromise, timeoutPromise]);
      },
      { stageName, requestId }
    );

    const latencyMs = Date.now() - startTime;
    const rawText = result.response?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error("Empty response returned by Vertex AI Gemini model.");
    }

    const cleanedJson = cleanJsonString(rawText);
    const parsed = JSON.parse(cleanedJson) as T;

    logInfo(`Vertex AI stage completed successfully`, {
      service: "vertexai",
      stageName,
      requestId,
      model: config.vertexModel,
      latencyMs,
      status: "SUCCESS",
    });

    return { data: parsed, rawResponse: rawText, latencyMs };
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    const errorMsg = err instanceof Error ? err.message : String(err);
    logError(`Vertex AI execution failed for ${stageName}`, err, {
      service: "vertexai",
      stageName,
      requestId,
      model: config.vertexModel,
      latencyMs,
      status: "FAILED",
    });
    return { data: null, latencyMs, error: errorMsg };
  }
}

/**
 * Execute a multimodal prompt with Vertex AI Gemini (Images/PDFs + Text).
 */
export async function callGeminiMultimodalJson<T>(params: {
  systemInstruction: string;
  parts: (
    | { text: string }
    | { inlineData: { mimeType: string; data: string } }
    | { fileData: { fileUri: string; mimeType: string } }
  )[];
  temperature?: number;
  timeoutMs?: number;
  stageName?: string;
  requestId?: string;
}): Promise<{ data: T | null; rawResponse?: string; latencyMs: number; error?: string }> {
  const {
    systemInstruction,
    parts,
    temperature = 0.1,
    timeoutMs = 30000,
    stageName = "gemini-multimodal",
    requestId,
  } = params;

  const client = getVertexClient();
  if (!client) {
    return { data: null, latencyMs: 0, error: "Vertex AI client not initialized (mock mode or missing credentials)" };
  }

  const startTime = Date.now();

  try {
    const generativeModel = client.getGenerativeModel({
      model: config.vertexModel,
      generationConfig: {
        responseMimeType: "application/json",
        temperature,
        maxOutputTokens: 4096,
      },
      systemInstruction: {
        role: "system",
        parts: [{ text: systemInstruction }],
      },
    });

    const result = await executeWithRetry(
      async () => {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Vertex AI multimodal timed out after ${timeoutMs}ms`)), timeoutMs)
        );
        const callPromise = generativeModel.generateContent({
          contents: [{ role: "user", parts }],
        });
        return Promise.race([callPromise, timeoutPromise]);
      },
      { stageName, requestId }
    );

    const latencyMs = Date.now() - startTime;
    const rawText = result.response?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error("Empty multimodal response returned by Vertex AI Gemini model.");
    }

    const cleanedJson = cleanJsonString(rawText);
    const parsed = JSON.parse(cleanedJson) as T;

    logInfo(`Vertex AI multimodal completed successfully`, {
      service: "vertexai",
      stageName,
      requestId,
      model: config.vertexModel,
      latencyMs,
      status: "SUCCESS",
    });

    return { data: parsed, rawResponse: rawText, latencyMs };
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    const errorMsg = err instanceof Error ? err.message : String(err);
    logError(`Vertex AI multimodal execution failed for ${stageName}`, err, {
      service: "vertexai",
      stageName,
      requestId,
      model: config.vertexModel,
      latencyMs,
      status: "FAILED",
    });
    return { data: null, latencyMs, error: errorMsg };
  }
}

// ---------------------------------------------------------------------------
// ARCHITECT STAGE 3: Orientation Analysis
// ---------------------------------------------------------------------------

export async function analyzePartOrientation(params: {
  fileName: string;
  bRepSummary?: string;
  requestId?: string;
}): Promise<OrientationAnalysis> {
  const { fileName, bRepSummary = "Standard CNC bracket geometry with base mounting holes.", requestId } = params;

  const prompt = `CAD Part File: "${fileName}"
B-Rep Geometric Topology:
${bRepSummary}

Analyze principal orientation and datum reference planes for standard drafting per ASME Y14.3.`;

  const { data, error } = await callGeminiJson<OrientationAnalysis>({
    systemInstruction: ORIENTATION_SYSTEM_INSTRUCTION,
    prompt,
    temperature: 0.1,
    stageName: "Stage 3 - Orientation",
    requestId,
  });

  if (data && data.primaryDatumPlane && data.recommendedOrientation) {
    return {
      primaryDatumPlane: data.primaryDatumPlane,
      secondaryDatumPlane: data.secondaryDatumPlane || "Perpendicular side bore axis",
      reasoning: data.reasoning || "Front view selected to maximize characteristic profile and minimize hidden features.",
      stabilityScore: typeof data.stabilityScore === "number" ? data.stabilityScore : 0.94,
      recommendedOrientation: data.recommendedOrientation,
      aiModel: config.vertexModel,
      fallbackUsed: false,
    };
  }

  // Deterministic fallback if Gemini fails or mock mode is active
  logWarn("Using deterministic fallback for Stage 3 orientation", {
    service: "vertexai",
    stageName: "Stage 3 - Orientation",
    requestId,
    reason: error || "No response data",
  });

  return {
    primaryDatumPlane: "Planar Face F5 (Mounting Base)",
    secondaryDatumPlane: "Cylindrical Bore F4 Axis",
    reasoning:
      "Deterministic CAD Fallback: Selected mounting base as primary datum plane; provides maximum contact surface area and aligns with CNC setup fixture.",
    stabilityScore: 0.92,
    recommendedOrientation: [0, 0, 1],
    aiModel: "deterministic-cad-heuristic",
    fallbackUsed: true,
    fallbackReason: error || "Vertex AI response unavailable",
  };
}

// ---------------------------------------------------------------------------
// ARCHITECT STAGE 5: View Selection per ASME Y14.3
// ---------------------------------------------------------------------------

export async function evaluateViewSelection(params: {
  fileName: string;
  bRepFaceCount: number;
  drawingAnalysis?: DrawingExtractionResult;
  requestId?: string;
}): Promise<ViewSelectionItem[]> {
  const { fileName, bRepFaceCount, drawingAnalysis, requestId } = params;

  let extraContext = "";
  if (drawingAnalysis) {
    extraContext = `
Existing 2D Drawing Metrology Context:
- Extracted Views: ${drawingAnalysis.viewAnnotations?.map((v) => v.viewName).join(", ") || "None"}
- Title Block Tolerance Standard: ${drawingAnalysis.titleBlock?.toleranceStandard || "ASME Y14.5"}
- Number of Linear Dimensions: ${drawingAnalysis.dimensionsExtracted?.length || 0}`;
  }

  const prompt = `CAD Part File: "${fileName}"
B-Rep Face Count: ${bRepFaceCount} faces
${extraContext}

Evaluate all 6 principal views (front, back, right, left, top, bottom) for drafting necessity.`;

  const { data, error } = await callGeminiJson<ViewSelectionItem[]>({
    systemInstruction: VIEW_SELECTION_SYSTEM_INSTRUCTION,
    prompt,
    temperature: 0.15,
    stageName: "Stage 5 - View Selection",
    requestId,
  });

  if (Array.isArray(data) && data.length >= 6) {
    return data.map((item) => ({
      ...item,
      fallbackUsed: false,
    }));
  }

  logWarn("Using deterministic fallback for Stage 5 view selection", {
    service: "vertexai",
    stageName: "Stage 5 - View Selection",
    requestId,
    reason: error || "Model returned invalid views list",
  });

  // Deterministic baseline per ASME Y14.3
  return [
    {
      view: "front",
      required: true,
      reasoning: "Serves as the primary view, showing overall width and height, mounting holes F1 and F2, clevis arms, and clevis gap F9.",
      fallbackUsed: true,
      fallbackReason: error || "Deterministic ASME rule",
    },
    {
      view: "back",
      required: false,
      reasoning: "Largely duplicates the front view; local fillets can be specified by a general note without requiring a redundant principal view.",
      fallbackUsed: true,
      fallbackReason: error || "Deterministic ASME rule",
    },
    {
      view: "right",
      required: true,
      reasoning: "Presents the side profile of the bracket, defining the clevis arm curvature, clevis eye, and through-hole F4.",
      fallbackUsed: true,
      fallbackReason: error || "Deterministic ASME rule",
    },
    {
      view: "left",
      required: false,
      reasoning: "Symmetric to the right view, mirroring the clevis eye and bore without providing unique dimensional information.",
      fallbackUsed: true,
      fallbackReason: error || "Deterministic ASME rule",
    },
    {
      view: "top",
      required: true,
      reasoning: "Defines the contoured profile of the mounting support, the central boss F6, and the clevis opening F9.",
      fallbackUsed: true,
      fallbackReason: error || "Deterministic ASME rule",
    },
    {
      view: "bottom",
      required: false,
      reasoning: "Redundant with the front and top views; underside geometry is already clearly described.",
      fallbackUsed: true,
      fallbackReason: error || "Deterministic ASME rule",
    },
  ];
}

// ---------------------------------------------------------------------------
// ARCHITECT STAGE 7: GD&T Dimensioning Synthesis per ASME Y14.5
// ---------------------------------------------------------------------------

export async function synthesizeGdntDimensions(params: {
  fileName: string;
  drawingAnalysis?: DrawingExtractionResult;
  requestId?: string;
}): Promise<DimensionItem[]> {
  const { fileName, drawingAnalysis, requestId } = params;

  let extraContext = "";
  if (drawingAnalysis) {
    extraContext = `
2D Drawing Extracted Dimensions & GD&T:
- Tolerance Standard: ${drawingAnalysis.titleBlock?.toleranceStandard || "ASME Y14.5"}
- Extracted Dimensions: ${drawingAnalysis.dimensionsExtracted?.map((d) => d.text).join(", ") || "None"}
- Extracted GD&T: ${drawingAnalysis.gdtSymbolsExtracted?.map((g) => `${g.characteristic} ${g.toleranceValue}`).join(", ") || "None"}`;
  }

  const prompt = `CAD Part File: "${fileName}"
${extraContext}

Synthesize a complete set of linear, radial, and leader dimension callouts conforming to ASME Y14.5-2018.
Attach dimensions to specific feature identifiers (e.g. #12, #59).`;

  const { data, error } = await callGeminiJson<DimensionItem[]>({
    systemInstruction: GDNT_SYSTEM_INSTRUCTION,
    prompt,
    temperature: 0.15,
    stageName: "Stage 7 - GD&T Synthesis",
    requestId,
  });

  if (Array.isArray(data) && data.length > 0) {
    return data.map((dim) => ({
      ...dim,
      fallbackUsed: false,
    }));
  }

  logWarn("Using deterministic fallback for Stage 7 GD&T synthesis", {
    service: "vertexai",
    stageName: "Stage 7 - GD&T Synthesis",
    requestId,
    reason: error || "Model output empty or invalid",
  });

  // Deterministic baseline GD&T set
  return [
    { id: "D1", kind: "leader", text: "2X Ø10 THRU", attachesTo: ["#12", "#59"], toleranceStandard: "ASME Y14.5-2018", fallbackUsed: true, fallbackReason: error },
    { id: "D2", kind: "linear", text: "12 ± 0.05", attachesTo: ["#13", "#46"], toleranceStandard: "ASME Y14.5-2018", fallbackUsed: true, fallbackReason: error },
    { id: "D3", kind: "linear", text: "12", attachesTo: ["#12", "#55"], toleranceStandard: "ASME Y14.5-2018", fallbackUsed: true, fallbackReason: error },
    { id: "D4", kind: "linear", text: "126 ± 0.1", attachesTo: ["#31", "#32"], toleranceStandard: "ASME Y14.5-2018", fallbackUsed: true, fallbackReason: error },
    { id: "D5", kind: "linear", text: "88", attachesTo: ["#32", "#40"], toleranceStandard: "ASME Y14.5-2018", fallbackUsed: true, fallbackReason: error },
    { id: "D6", kind: "leader", text: "Ø12 THRU", attachesTo: ["#18", "#51"], toleranceStandard: "ASME Y14.5-2018", fallbackUsed: true, fallbackReason: error },
    { id: "D7", kind: "linear", text: "45 +0.1/-0.0", attachesTo: ["#45", "#48"], toleranceStandard: "ASME Y14.5-2018", fallbackUsed: true, fallbackReason: error },
    { id: "D8", kind: "radial", text: "R6 TYP", attachesTo: ["#82", "#85"], toleranceStandard: "ASME Y14.5-2018", fallbackUsed: true, fallbackReason: error },
    { id: "D9", kind: "linear", text: "150", attachesTo: ["#5", "#75"], toleranceStandard: "ASME Y14.5-2018", fallbackUsed: true, fallbackReason: error },
    { id: "D10", kind: "linear", text: "Ø60", attachesTo: ["#40", "#41"], toleranceStandard: "ASME Y14.5-2018", fallbackUsed: true, fallbackReason: error },
  ];
}

// ---------------------------------------------------------------------------
// 2D DRAWING & PDF MULTIMODAL EXTRACTION
// ---------------------------------------------------------------------------

export interface ExtractDrawingParams {
  buffer?: Buffer;
  gcsUri?: string;
  fileName: string;
  mimeType?: string;
  requestId?: string;
}

export async function extractDrawingWithGemini(
  params: ExtractDrawingParams
): Promise<DrawingExtractionResult> {
  const { buffer, gcsUri, fileName, requestId } = params;

  if (!gcsUri && !buffer) {
    throw new Error("Either buffer or gcsUri must be provided for drawing extraction.");
  }

  // Validate format
  const dotIndex = fileName.lastIndexOf(".");
  const ext = dotIndex >= 0 ? fileName.toLowerCase().substring(dotIndex) : "";
  const validMimes: Record<string, string> = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
  };

  const detectedMime = params.mimeType || validMimes[ext];
  if (!detectedMime) {
    throw new Error(`Unsupported drawing format: "${ext}". Supported formats: PDF, PNG, JPG, WEBP, SVG.`);
  }

  if (buffer && buffer.length > config.maxUploadSizeBytes) {
    throw new Error(`File size (${buffer.length} bytes) exceeds maximum allowable limit of 50MB.`);
  }

  const client = getVertexClient();
  if (client) {
    try {
      const parts: (
        | { text: string }
        | { inlineData: { mimeType: string; data: string } }
        | { fileData: { fileUri: string; mimeType: string } }
      )[] = [];

      if (buffer) {
        parts.push({
          inlineData: {
            mimeType: detectedMime,
            data: buffer.toString("base64"),
          },
        });
      } else if (gcsUri) {
        parts.push({
          fileData: {
            fileUri: gcsUri,
            mimeType: detectedMime,
          },
        });
      }

      const prompt = `Perform complete technical metrology and title block OCR extraction on this engineering drawing file ("${fileName}", MIME: ${detectedMime}).
Adhere strictly to ASME Y14.5 and ISO 128 standards.`;

      parts.push({ text: prompt });

      const { data, rawResponse } = await callGeminiMultimodalJson<DrawingExtractionResult>({
        systemInstruction: DRAWING_EXTRACTION_SYSTEM_INSTRUCTION,
        parts,
        temperature: 0.1,
        stageName: "Multimodal Drawing Extraction",
        requestId,
      });

      if (data && data.titleBlock) {
        return {
          sourceFileName: fileName,
          storageUri: gcsUri,
          mimeType: detectedMime,
          pageCount: data.pageCount || 1,
          textBlockCount: data.textBlockCount || (data.dimensionsExtracted?.length || 0) + (data.notes?.length || 0),
          titleBlock: data.titleBlock,
          dimensionsExtracted: data.dimensionsExtracted || [],
          gdtSymbolsExtracted: data.gdtSymbolsExtracted || [],
          viewAnnotations: data.viewAnnotations || [],
          notes: data.notes || [],
          ambiguities: data.ambiguities || [],
          unreadableRegions: data.unreadableRegions || [],
          uncertaintyDisclaimer:
            "AI-extracted drawing metrology is assistive and should be verified against master 3D CAD geometry before tooling fabrication.",
          rawFullText: data.rawFullText || rawResponse || "",
          extractedWith: "vertexai-gemini",
          fallbackUsed: false,
        };
      }
    } catch (err) {
      logWarn("Multimodal drawing extraction failed, using deterministic fallback parser", {
        service: "vertexai",
        fileName,
        requestId,
        error: String(err),
      });
    }
  }

  // Deterministic Metrology Parser / Mock Fallback
  const lowerName = fileName.toLowerCase();
  const isMultiPage = detectedMime === "application/pdf" && (lowerName.includes("multi") || lowerName.includes("assembly"));
  const hasAmbiguities = lowerName.includes("ambiguous") || lowerName.includes("blurry") || lowerName.includes("low_res") || lowerName.includes("scanned");

  const titleBlock: DrawingTitleBlock = {
    drawingNumber: `DWG-${fileName.replace(/\.[^/.]+$/, "").toUpperCase()}-001`,
    partName: fileName.replace(/\.[^/.]+$/, "").toUpperCase(),
    revision: "REV-C",
    material: "AISI 4140 ALLOY STEEL",
    toleranceStandard: "ASME Y14.5-2018",
    units: "mm",
    scale: "1:1",
    drafter: "AUTODRAFT_CORE",
    sheetNumber: isMultiPage ? "1 OF 3" : "1 OF 1",
    isAmbiguous: hasAmbiguities,
  };

  const dimensionsExtracted: ExtractedDimensionItem[] = [
    {
      id: "DIM-01",
      text: "2X Ø10 THRU",
      nominalValue: 10,
      unit: "mm",
      confidence: hasAmbiguities ? 0.72 : 0.99,
      associatedView: "FRONT VIEW",
      isAmbiguous: hasAmbiguities,
    },
    {
      id: "DIM-02",
      text: "126.0 ± 0.05",
      nominalValue: 126.0,
      upperTolerance: 0.05,
      lowerTolerance: -0.05,
      unit: "mm",
      confidence: 0.98,
      associatedView: "FRONT VIEW",
      isAmbiguous: false,
    },
  ];

  const gdtSymbolsExtracted: ExtractedGdtSymbol[] = [
    {
      characteristic: "POSITION",
      toleranceValue: "Ø 0.05 Ⓜ",
      datumReferences: ["A", "B", "C"],
      attachedFeature: "Hole Pattern F1-F2",
      confidence: 0.98,
      isAmbiguous: false,
    },
  ];

  const viewAnnotations: DrawingViewAnnotation[] = [
    { viewName: "FRONT VIEW", scale: "1:1" },
    { viewName: "RIGHT VIEW", scale: "1:1" },
    { viewName: "TOP VIEW", scale: "1:1" },
  ];

  return {
    sourceFileName: fileName,
    storageUri: gcsUri,
    mimeType: detectedMime,
    pageCount: isMultiPage ? 3 : 1,
    textBlockCount: dimensionsExtracted.length + 4,
    titleBlock,
    dimensionsExtracted,
    gdtSymbolsExtracted,
    viewAnnotations,
    notes: [
      "1. ALL DIMENSIONS IN MILLIMETERS PER ASME Y14.5-2018.",
      "2. INTERPRET GEOMETRIC TOLERANCES PER ASME Y14.5.",
    ],
    ambiguities: hasAmbiguities ? ["Drawing scan contrast in title block is low"] : [],
    unreadableRegions: hasAmbiguities ? ["Revision block zone A4"] : [],
    uncertaintyDisclaimer:
      "AI-extracted drawing metrology is assistive and should be verified against master 3D CAD geometry before tooling fabrication.",
    extractedWith: "deterministic-fallback",
    fallbackUsed: true,
    fallbackReason: "Mock mode or Vertex AI unavailable",
  };
}

// ---------------------------------------------------------------------------
// HEALTH CHECK: Vertex AI
// ---------------------------------------------------------------------------

export async function checkVertexAiHealth(): Promise<{
  status: "healthy" | "unavailable" | "mocked";
  details: string;
  latencyMs?: number;
}> {
  if (config.useMockServices) {
    return { status: "mocked", details: "USE_MOCK_SERVICES=true (Mock mode active)" };
  }

  const client = getVertexClient();
  if (!client) {
    return { status: "unavailable", details: "Unable to initialize Vertex AI client (ADC or GCP project missing)" };
  }

  const startTime = Date.now();
  try {
    const generativeModel = client.getGenerativeModel({
      model: config.vertexModel,
      generationConfig: { maxOutputTokens: 10 },
    });
    const res = await generativeModel.generateContent({
      contents: [{ role: "user", parts: [{ text: "ping" }] }],
    });
    const text = res.response?.candidates?.[0]?.content?.parts?.[0]?.text;
    const latencyMs = Date.now() - startTime;

    if (text) {
      return {
        status: "healthy",
        details: `Connected to ${config.vertexModel} in ${config.region} on project ${config.projectId}`,
        latencyMs,
      };
    }
    return { status: "unavailable", details: "Empty response from Vertex AI model" };
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    return {
      status: "unavailable",
      details: `Vertex AI ping failed: ${err instanceof Error ? err.message : String(err)}`,
      latencyMs,
    };
  }
}

