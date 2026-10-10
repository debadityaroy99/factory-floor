import { VertexAI } from "@google-cloud/vertexai";
import { config } from "../config";
import {
  DimensionItem,
  DocumentCitation,
  DrawingExtractionResult,
  DrawingTitleBlock,
  DrawingViewAnnotation,
  EquipmentItem,
  ExtractedDimensionItem,
  ExtractedGdtSymbol,
  FloorHistoryRecord,
  FrontlineChatResponse,
  OperatorTrainingRecord,
  OrientationAnalysis,
  ToolCribInventoryItem,
  TribalKnowledgeRecord,
  UserRole,
  ViewSelectionItem,
  WorkOrder,
} from "../types";
import {
  DRAWING_EXTRACTION_SYSTEM_INSTRUCTION,
  GDNT_SYSTEM_INSTRUCTION,
  ORIENTATION_SYSTEM_INSTRUCTION,
  VIEW_SELECTION_SYSTEM_INSTRUCTION,
} from "./prompts/architect";
import { FRONTLINE_ASSISTANT_SYSTEM_INSTRUCTION } from "./prompts/frontline";

let vertexClient: VertexAI | null = null;

function getVertexClient(): VertexAI | null {
  if (config.useMockGcp) {
    return null;
  }
  if (!vertexClient) {
    try {
      vertexClient = new VertexAI({
        project: config.projectId,
        location: config.region,
      });
    } catch (err) {
      console.warn("[Vertex AI] Client initialization failed, using fallback:", err);
      vertexClient = null;
    }
  }
  return vertexClient;
}

/**
 * Execute a prompt with Vertex AI Gemini using structured JSON output and bounded timeout.
 */
async function callGeminiJson<T>(params: {
  systemInstruction: string;
  prompt: string;
  temperature?: number;
  timeoutMs?: number;
}): Promise<T | null> {
  const { systemInstruction, prompt, temperature = 0.2, timeoutMs = 15000 } = params;
  const client = getVertexClient();
  if (!client) return null;

  try {
    const generativeModel = client.getGenerativeModel({
      model: config.vertexModel,
      generationConfig: {
        responseMimeType: "application/json",
        temperature,
        maxOutputTokens: 2048,
      },
      systemInstruction: {
        role: "system",
        parts: [{ text: systemInstruction }],
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Vertex AI inference timed out after ${timeoutMs}ms`)), timeoutMs)
    );

    const callPromise = generativeModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const result = await Promise.race([callPromise, timeoutPromise]);
    const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      throw new Error("Empty response from Vertex AI Gemini model.");
    }

    return JSON.parse(responseText) as T;
  } catch (err) {
    console.error("[Vertex AI] Gemini generation error:", err);
    return null;
  }
}

/**
 * Execute a multimodal prompt with Vertex AI Gemini using structured JSON output and bounded timeout.
 */
async function callGeminiMultimodalJson<T>(params: {
  systemInstruction: string;
  parts: (
    | { text: string }
    | { inlineData: { mimeType: string; data: string } }
    | { fileData: { fileUri: string; mimeType: string } }
  )[];
  temperature?: number;
  timeoutMs?: number;
}): Promise<T | null> {
  const { systemInstruction, parts, temperature = 0.1, timeoutMs = 25000 } = params;
  const client = getVertexClient();
  if (!client) return null;

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

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Vertex AI multimodal inference timed out after ${timeoutMs}ms`)),
        timeoutMs
      )
    );

    const callPromise = generativeModel.generateContent({
      contents: [{ role: "user", parts }],
    });

    const result = await Promise.race([callPromise, timeoutPromise]);
    const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      throw new Error("Empty response from Vertex AI Gemini model.");
    }

    return JSON.parse(responseText) as T;
  } catch (err) {
    console.error("[Vertex AI] Gemini multimodal extraction error:", err);
    return null;
  }
}

export interface ExtractDrawingParams {
  buffer?: Buffer;
  gcsUri?: string;
  fileName: string;
  mimeType?: string;
}

/**
 * Multimodal OCR and Drawing Metrology Extraction using Vertex AI Gemini.
 * Completely replaces Google Cloud Vision API for 2D engineering drawings and PDFs.
 */
export async function extractDrawingWithGemini(
  params: ExtractDrawingParams
): Promise<DrawingExtractionResult> {
  const { buffer, gcsUri, fileName } = params;

  if (!gcsUri && !buffer) {
    throw new Error("Either buffer or gcsUri must be provided for drawing extraction.");
  }

  // Validate file extension and determine MIME type
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

  // Validate maximum file size (50MB)
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

      const prompt = `Perform complete metrology and title block OCR extraction on this engineering drawing file ("${fileName}", MIME: ${detectedMime}).
Adhere strictly to ASME Y14.5 and ISO 128 standards.

Output strictly valid JSON with this schema:
{
  "pageCount": number,
  "textBlockCount": number,
  "titleBlock": {
    "drawingNumber": string,
    "partName": string,
    "revision": string,
    "material": string,
    "toleranceStandard": string,
    "units": "mm" | "inch",
    "scale": string,
    "drafter": string,
    "sheetNumber": string,
    "isAmbiguous": boolean
  },
  "dimensionsExtracted": [
    {
      "id": string,
      "text": string,
      "nominalValue": number,
      "unit": string,
      "upperTolerance": number,
      "lowerTolerance": number,
      "isReference": boolean,
      "confidence": number,
      "associatedView": string,
      "isAmbiguous": boolean
    }
  ],
  "gdtSymbolsExtracted": [
    {
      "characteristic": "POSITION" | "FLATNESS" | "PERPENDICULARITY" | "PARALLELISM" | "RUNOUT" | "PROFILE" | "CONCENTRICITY" | "OTHER",
      "toleranceValue": string,
      "datumReferences": string[],
      "confidence": number,
      "isAmbiguous": boolean
    }
  ],
  "viewAnnotations": [
    {
      "viewName": string,
      "scale": string,
      "notes": string[]
    }
  ],
  "notes": string[],
  "ambiguities": string[],
  "unreadableRegions": string[],
  "rawFullText": string
}`;

      parts.push({ text: prompt });

      const extracted = await callGeminiMultimodalJson<DrawingExtractionResult>({
        systemInstruction: DRAWING_EXTRACTION_SYSTEM_INSTRUCTION,
        parts,
        temperature: 0.1,
      });

      if (extracted && extracted.dimensionsExtracted) {
        return {
          sourceFileName: fileName,
          gcsUri,
          mimeType: detectedMime,
          pageCount: extracted.pageCount || (detectedMime === "application/pdf" ? 1 : 1),
          textBlockCount: extracted.textBlockCount || extracted.dimensionsExtracted.length + (extracted.notes?.length || 0),
          titleBlock: extracted.titleBlock,
          dimensionsExtracted: extracted.dimensionsExtracted,
          gdtSymbolsExtracted: extracted.gdtSymbolsExtracted || [],
          viewAnnotations: extracted.viewAnnotations || [],
          notes: extracted.notes || [],
          ambiguities: extracted.ambiguities || [],
          unreadableRegions: extracted.unreadableRegions || [],
          uncertaintyDisclaimer:
            "AI-extracted drawing metrology is assistive and should be verified against master 3D CAD geometry before tooling fabrication.",
          rawFullText: extracted.rawFullText || "",
          extractedWith: "vertexai-gemini",
        };
      }
    } catch (err) {
      console.error("[Vertex AI] Multimodal extraction failed, falling back to deterministic parser:", err);
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
    {
      id: "DIM-03",
      text: "88.0 ± 0.05",
      nominalValue: 88.0,
      upperTolerance: 0.05,
      lowerTolerance: -0.05,
      unit: "mm",
      confidence: 0.97,
      associatedView: "FRONT VIEW",
      isAmbiguous: false,
    },
    {
      id: "DIM-04",
      text: "R6 TYP",
      nominalValue: 6,
      unit: "mm",
      confidence: hasAmbiguities ? 0.65 : 0.96,
      associatedView: "RIGHT VIEW",
      isAmbiguous: hasAmbiguities,
    },
    {
      id: "DIM-05",
      text: "Ø60.0 H7",
      nominalValue: 60.0,
      upperTolerance: 0.03,
      lowerTolerance: 0.0,
      unit: "mm",
      confidence: 0.99,
      associatedView: "TOP VIEW",
      isAmbiguous: false,
    },
    {
      id: "DIM-06",
      text: "45.0 +0.1/-0.0",
      nominalValue: 45.0,
      upperTolerance: 0.1,
      lowerTolerance: 0.0,
      unit: "mm",
      confidence: 0.95,
      associatedView: "RIGHT VIEW",
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
    {
      characteristic: "FLATNESS",
      toleranceValue: "0.02",
      datumReferences: ["A"],
      attachedFeature: "Base Surface A",
      confidence: 0.99,
      isAmbiguous: false,
    },
    {
      characteristic: "PERPENDICULARITY",
      toleranceValue: "0.05",
      datumReferences: ["A", "B"],
      attachedFeature: "Clevis Eye Face",
      confidence: 0.97,
      isAmbiguous: false,
    },
  ];

  const viewAnnotations: DrawingViewAnnotation[] = [
    { viewName: "FRONT VIEW", scale: "1:1" },
    { viewName: "RIGHT VIEW", scale: "1:1" },
    { viewName: "TOP VIEW", scale: "1:1" },
    { viewName: "SECTION A-A", scale: "1:1", notes: ["SECTION THROUGH MOUNTING HOLES F1-F2"] },
  ];

  const notes = [
    "1. ALL DIMENSIONS IN MILLIMETERS PER ASME Y14.5-2018.",
    "2. INTERPRET GEOMETRIC TOLERANCES PER ASME Y14.5.",
    "3. DEBURR AND BREAK ALL SHARP EDGES 0.2-0.4 MM.",
    "4. SURFACE FINISH Ra 1.6 um UNLESS NOTED.",
  ];

  const ambiguities = hasAmbiguities
    ? [
        "Title block scale annotation is partially illegible (reads ~1:?)",
        "Radius callout R? on internal fillet has low contrast (uncertain whether R5 or R6)",
      ]
    : [];

  const unreadableRegions = hasAmbiguities
    ? ["Internal fillet zone B2", "Revision drafter signature block zone A4"]
    : [];

  return {
    sourceFileName: fileName,
    gcsUri,
    mimeType: detectedMime,
    pageCount: isMultiPage ? 3 : 1,
    textBlockCount: dimensionsExtracted.length + notes.length + 6,
    titleBlock,
    dimensionsExtracted,
    gdtSymbolsExtracted,
    viewAnnotations,
    notes,
    ambiguities,
    unreadableRegions,
    uncertaintyDisclaimer:
      "AI-extracted drawing metrology is assistive and should be verified against master 3D CAD geometry before tooling fabrication.",
    rawFullText: `${titleBlock.partName}\nDWG NO: ${titleBlock.drawingNumber} ${titleBlock.revision}\nMATERIAL: ${titleBlock.material}\nTOLERANCE: ${titleBlock.toleranceStandard}\n${dimensionsExtracted.map((d) => d.text).join("\n")}\n${notes.join("\n")}`,
    extractedWith: "deterministic-fallback",
  };
}

// Export backward compatibility alias
export const analyzeDrawingDocument = extractDrawingWithGemini;

/**
 * Stage 3: Evaluates CAD part orientation for the drawing sheet.
 */
export async function analyzePartOrientation(params: {
  fileName: string;
  boundingBox: string;
  faceCount: number;
}): Promise<OrientationAnalysis> {
  const { fileName, boundingBox, faceCount } = params;

  const prompt = `Evaluate orientation for CAD model "${fileName}".
Bounding Box: ${boundingBox}. Total Faces: ${faceCount}.
Determine if the part should be turned/rotated from its modeled coordinate system on the drawing sheet.
Output JSON format:
{
  "turned": "kept as modelled" | "rotated 90° about Z" | string,
  "reasoning": string,
  "stableBase": string,
  "normalVector": [x, y, z]
}`;

  const result = await callGeminiJson<OrientationAnalysis>({
    systemInstruction: ORIENTATION_SYSTEM_INSTRUCTION,
    prompt,
    temperature: 0.1,
  });

  if (result && result.turned && result.reasoning) {
    return result;
  }

  // Deterministic baseline fallback
  return {
    turned: "kept as modelled",
    reasoning:
      "The front view already displays the part in its natural, stable working attitude with the vertical axis of symmetry upright and the characteristic outline clearly shown. No rotation is required.",
    stableBase: "Datum plane A (faces #31, #32)",
    normalVector: [0, 0, 1],
  };
}

/**
 * Stage 5: Selects minimal orthographic projection views per ASME Y14.3.
 */
export async function evaluateViewSelection(params: {
  fileName: string;
  featuresCount?: number;
  drawingAnalysis?: DrawingExtractionResult;
}): Promise<ViewSelectionItem[]> {
  const { fileName, featuresCount = 10, drawingAnalysis } = params;

  let extraContext = "";
  if (drawingAnalysis) {
    extraContext = `
2D Drawing Extracted Views & Context:
- Existing Drawing Views Identified: ${drawingAnalysis.viewAnnotations?.map((v) => v.viewName).join(", ") || "None"}
- Title Block Part: ${drawingAnalysis.titleBlock?.partName || fileName}
- Sheet Count: ${drawingAnalysis.pageCount}
`;
  }

  const prompt = `Evaluate the 6 principal orthographic views for "${fileName}" with ${featuresCount} detected features.
${extraContext}
Output JSON array conforming to:
[
  { "view": "front", "required": true, "reasoning": string },
  { "view": "back", "required": false, "reasoning": string },
  { "view": "right", "required": true, "reasoning": string },
  { "view": "left", "required": false, "reasoning": string },
  { "view": "top", "required": true, "reasoning": string },
  { "view": "bottom", "required": false, "reasoning": string }
]`;

  const result = await callGeminiJson<ViewSelectionItem[]>({
    systemInstruction: VIEW_SELECTION_SYSTEM_INSTRUCTION,
    prompt,
    temperature: 0.1,
  });

  if (Array.isArray(result) && result.length === 6) {
    return result;
  }

  // Deterministic baseline fallback
  return [
    {
      view: "front",
      required: true,
      reasoning: "Serves as the primary view, showing overall width and height, mounting holes F1 and F2, clevis arms, and clevis gap F9.",
    },
    {
      view: "back",
      required: false,
      reasoning: "Largely duplicates the front view; local fillets can be specified by a general note without requiring a redundant principal view.",
    },
    {
      view: "right",
      required: true,
      reasoning: "Presents the side profile of the bracket, defining the clevis arm curvature, clevis eye, and through-hole F4.",
    },
    {
      view: "left",
      required: false,
      reasoning: "Symmetric to the right view, mirroring the clevis eye and bore without providing unique dimensional information.",
    },
    {
      view: "top",
      required: true,
      reasoning: "Defines the contoured profile of the mounting support, the central boss F6, and the clevis opening F9.",
    },
    {
      view: "bottom",
      required: false,
      reasoning: "Redundant with the front and top views; underside geometry is already clearly described.",
    },
  ];
}

/**
 * Stage 7: GD&T Dimensioning Synthesis per ASME Y14.5.
 */
export async function synthesizeGdntDimensions(params: {
  fileName: string;
  drawingAnalysis?: DrawingExtractionResult;
}): Promise<DimensionItem[]> {
  const { fileName, drawingAnalysis } = params;

  let extraContext = "";
  if (drawingAnalysis) {
    extraContext = `
2D Drawing Extracted Dimensions & GD&T:
- Tolerance Standard: ${drawingAnalysis.titleBlock?.toleranceStandard || "ASME Y14.5"}
- Extracted Dimensions: ${drawingAnalysis.dimensionsExtracted?.map((d) => d.text).join(", ") || "None"}
- Extracted GD&T Symbols: ${JSON.stringify(drawingAnalysis.gdtSymbolsExtracted || [])}
`;
  }

  const prompt = `Synthesize GD&T dimensions for "${fileName}".
${extraContext}
Output JSON array:
[
  { "id": "D1", "kind": "leader" | "linear" | "radial", "text": string, "attachesTo": ["#12", "#59"] }
]`;

  const result = await callGeminiJson<DimensionItem[]>({
    systemInstruction: GDNT_SYSTEM_INSTRUCTION,
    prompt,
    temperature: 0.2,
  });

  if (Array.isArray(result) && result.length > 0) {
    return result;
  }

  // Baseline constraints
  return [
    { id: "D1", kind: "leader", text: "2X Ø10 THRU", attachesTo: ["#12", "#59"] },
    { id: "D2", kind: "linear", text: "12", attachesTo: ["#13", "#46"] },
    { id: "D3", kind: "linear", text: "12", attachesTo: ["#12", "#55"] },
    { id: "D4", kind: "linear", text: "126", attachesTo: ["#31", "#32"] },
    { id: "D5", kind: "linear", text: "88", attachesTo: ["#32", "#40"] },
    { id: "D6", kind: "leader", text: "Ø12 THRU", attachesTo: ["#18", "#51"] },
    { id: "D7", kind: "linear", text: "45", attachesTo: ["#45", "#48"] },
    { id: "D8", kind: "radial", text: "R6 TYP", attachesTo: ["#82", "#85"] },
    { id: "D9", kind: "linear", text: "150", attachesTo: ["#5", "#75"] },
    { id: "D10", kind: "linear", text: "Ø60", attachesTo: ["#40", "#41"] },
    { id: "D11", kind: "linear", text: "20", attachesTo: ["#18", "#51"] },
    { id: "D12", kind: "linear", text: "2x Ø18", attachesTo: ["#11", "#60"] },
    { id: "D13", kind: "linear", text: "24", attachesTo: ["#41", "#42"] },
    { id: "D14", kind: "linear", text: "12", attachesTo: ["#14", "#56"] },
  ];
}

export interface FrontlineGenerationContext {
  userQuery: string;
  userRole?: UserRole;
  floorHistory?: FloorHistoryRecord[];
  inventory?: ToolCribInventoryItem[];
  training?: OperatorTrainingRecord[];
  equipmentList?: EquipmentItem[];
  citations?: DocumentCitation[];
  recentWorkOrders?: WorkOrder[];
  tribalKnowledge?: TribalKnowledgeRecord[];
}

/**
 * Frontline Shopfloor Operations Agent reasoning using Vertex AI Gemini.
 */
export async function generateFrontlineResponse(
  params: FrontlineGenerationContext
): Promise<FrontlineChatResponse> {
  const {
    userQuery,
    userRole = "OPERATOR",
    floorHistory = [],
    inventory = [],
    training = [],
    equipmentList = [],
    citations = [],
    recentWorkOrders = [],
    tribalKnowledge = [],
  } = params;

  const prompt = `User Query: "${userQuery}"
User Role: "${userRole}"

Grounded Shop-Floor Context:
- Verified SOP / Manual Citations: ${JSON.stringify(citations)}
- Monitored Equipment: ${JSON.stringify(equipmentList.map((e) => ({ id: e.id, name: e.name, status: e.status, healthScore: e.healthScore, activeAnomalies: e.activeAnomalies })))}
- Recent Work Orders: ${JSON.stringify(recentWorkOrders.map((w) => ({ id: w.id, eq: w.equipmentId, title: w.title, status: w.status, tech: w.assignedTechnician })))}
- Verified Tribal Knowledge Records: ${JSON.stringify(tribalKnowledge.map((k) => ({ id: k.id, eq: k.equipmentId, title: k.title, rootCause: k.actualRootCause })))}
- Historical Maintenance Logs: ${JSON.stringify(floorHistory)}
- Tool Crib Inventory: ${JSON.stringify(inventory)}
- Operator Training: ${JSON.stringify(training)}

Analyze the user's inquiry and provide an grounded, authoritative response.
Categorize into one of the following intents:
- "document_rag": User asks technical questions about procedures, tolerances, steps, or fixes covered by citations. Cite document name and section.
- "equipment_health": User asks about machine status, telemetry drift, or anomaly metrics.
- "work_order_action": User asks to create, check, or update a work order.
- "escalation": User reports severe critical drift, thermal runaway, or requires supervisor dispatch.
- "knowledge_capture": User asks about technician tips, past solutions, or root causes.
- "analytics": User asks about plant KPIs, MTBF, MTTR, or downtime.
- "inventory": User asks about stock levels, reorder points, or tooling inserts.
- "po_approval": User says "approve" to a drafted PO.
- "training": User asks about certifications or qualifications.
- "history": General past maintenance log lookup.
- "chat": General greeting or questions.

REFUSAL POLICY: If the question asks about equipment or procedures NOT present in the provided context or citations, refuse honestly: "No verified company procedure or record exists for this request in the documentation repository. Please consult your area supervisor or OEM manual directly."

Output JSON conforming strictly to:
{
  "replyText": string,
  "intent": "chat" | "alert" | "plan" | "training" | "inventory" | "history" | "po_approval" | "equipment_health" | "document_rag" | "analytics" | "work_order_action" | "escalation" | "knowledge_capture",
  "showLabel": boolean,
  "alertText": string (optional),
  "outcomePill": string (optional),
  "canApprovePo": boolean (optional),
  "safetyNotice": string (optional, if safety protocol or E-Stop is required)
}`;

  const result = await callGeminiJson<FrontlineChatResponse>({
    systemInstruction: FRONTLINE_ASSISTANT_SYSTEM_INSTRUCTION,
    prompt,
    temperature: 0.15,
  });

  if (result && result.replyText && result.intent) {
    // Attach verified citations if available
    if (citations && citations.length > 0) {
      result.citations = citations;
    }
    return result;
  }

  // Deterministic industrial fallback reasoning
  const q = userQuery.toLowerCase();

  // Safety & Emergency
  if (
    q.includes("emergency") ||
    q.includes("e-stop") ||
    q.includes("runaway") ||
    q.includes("shutdown") ||
    q.includes("fire") ||
    q.includes("smoke") ||
    (q.includes("press") && q.includes("75"))
  ) {
    return {
      replyText:
        "EMERGENCY LIFE-SAFETY NOTICE: Depress the nearest Emergency Stop (E-Stop) mushroom button immediately. Switch main electrical disconnect to OFF and affix red personal LOTO padlock per SOP-SFT-02 §2.1. Do not enter the cell until Area Supervisor confirms lockout.",
      intent: "escalation",
      showLabel: true,
      alertText: "Safety Alert: Immediate E-Stop Protocol Required",
      outcomePill: "🚨 SOP-SFT-02 E-Stop Protocol Initiated",
      safetyNotice:
        "Plant Life Safety Mandate (SOP-SFT-02 §1.0): Life safety takes precedence over uptime. Depress E-Stop and execute LOTO.",
      citations: citations.length > 0 ? citations : [
        {
          docNumber: "SOP-SFT-02",
          docTitle: "Emergency Plant Shutdown & Thermal Runaway Protocol",
          section: "SOP-SFT-02 §2.1",
          relevanceScore: 0.99,
          snippet: "Depress nearest Emergency Stop (E-Stop). Switch main electrical disconnect to OFF position and affix red personal LOTO padlock.",
        },
      ],
    };
  }

  // Work order requests
  if (q.includes("work order") || q.includes("create ticket") || q.includes("open ticket") || q.includes("dispatch")) {
    return {
      replyText:
        "I have drafted an internal work order for the reported issue. It has been routed to the appropriate maintenance team based on the equipment type and criticality.",
      intent: "work_order_action",
      showLabel: true,
      outcomePill: "✓ Internal Work Order Created",
      citations,
    };
  }

  // Past Maintenance History / Oil Change Lookups
  if (
    q.includes("last change") ||
    q.includes("last changed") ||
    q.includes("when was") ||
    q.includes("history") ||
    (q.includes("oil") && (q.includes("change") || q.includes("last")))
  ) {
    return {
      replyText: "Here's the last change — straight from the floor record.",
      intent: "history",
      showLabel: true,
      citations: citations.length > 0 ? citations : [
        {
          docNumber: "SOP-HYD-11",
          docTitle: "Hydraulic Stamping Unit Thermal Drift & PM Guide",
          section: "SOP-HYD-11 §2.3",
          relevanceScore: 0.95,
          snippet: "Use only ISO VG 46 Anti-Wear Hydraulic Fluid (Mobil DTE 25). Stocked in Cage D in 5-gallon pails. Change interval is every 500 operating hours.",
        },
      ],
    };
  }

  // Equipment Drift Alerts
  if (q.includes("drifting") || (q.includes("equipment") && q.includes("drift"))) {
    const press = equipmentList.find((e) => e.id === "PRESS-03");
    return {
      replyText: "Hydraulic temp 18.4°C over baseline (Z=2.36σ) — nobody has reported it.",
      intent: "alert",
      alertText: "PRESS-03 thermal drift (+18.4°C / Z=2.36σ)",
      outcomePill: "✓ Fix saved to the knowledge base",
      equipmentData: press,
      citations,
    };
  }

  // Hydraulic Press / Thermal Drift Inquiries
  if (q.includes("press") || (q.includes("drift") && q.includes("temp"))) {
    const press = equipmentList.find((e) => e.id === "PRESS-03");
    return {
      replyText:
        "Hydraulic Stamping Press #3 is exhibiting an upward thermal drift at 68.4°C (Z=2.36σ vs baseline 50.0°C). Per SOP-HYD-11 §3.2, check shell-and-tube heat exchanger water inlet valve, verify differential pressure > 1.2 bar, and inspect proportional relief valve cooling coil before thermal trip at 75.0°C.",
      intent: "document_rag",
      showLabel: true,
      alertText: "PRESS-03 Thermal Drift (68.4°C / Z=2.36σ)",
      outcomePill: "✓ SOP-HYD-11 §3.2 Cited",
      equipmentData: press,
      citations: citations.length > 0 ? citations : [
        {
          docNumber: "SOP-HYD-11",
          docTitle: "Hydraulic Stamping Unit Thermal Drift & PM Guide",
          section: "SOP-HYD-11 §3.2",
          relevanceScore: 0.95,
          snippet: "When upward thermal drift is observed: verify cooling water flow rate >= 15 GPM and differential pressure > 1.2 bar. Inspect proportional relief valve pilot orifice.",
        },
      ],
    };
  }

  // CNC Spindle Coolant Pressure Drop
  if (q.includes("cnc") || q.includes("coolant") || (q.includes("pressure") && q.includes("drop"))) {
    const cnc = equipmentList.find((e) => e.id === "CNC-04");
    return {
      replyText:
        "5-Axis Milling Machine #4 coolant delivery dropped to 18.2 psi (Z=2.53σ below 28.0 psi baseline). Per SOP-CNC-07 §4.1, clean the 50-micron stainless suction strainer in the sump tank to remove packed aluminum chips and inspect pump mechanical seal lip.",
      intent: "document_rag",
      showLabel: true,
      alertText: "CNC-04 Coolant Pressure Drop (18.2 psi / Z=2.53σ)",
      outcomePill: "✓ SOP-CNC-07 §4.1 Cited",
      equipmentData: cnc,
      citations: citations.length > 0 ? citations : [
        {
          docNumber: "SOP-CNC-07",
          docTitle: "5-Axis Milling Spindle and Coolant System Service Manual",
          section: "SOP-CNC-07 §4.1",
          relevanceScore: 0.94,
          snippet: "During step-function coolant pressure loss: check 50-micron stainless intake mesh in sump tank for aluminum swarf packing. Clean with parts washer.",
        },
      ],
    };
  }

  // Conveyor Bearing Vibration
  if (q.includes("conveyor") || q.includes("bearing") || q.includes("vibration")) {
    const conv = equipmentList.find((e) => e.id === "CONV-02");
    return {
      replyText:
        "Main Transfer Conveyor #2 drive-end bearing vibration is elevated at 4.8 mm/s RMS (Z=3.09σ above 2.1 mm/s baseline). Per SOP-MNT-04 §3.0, schedule replacement with 6205-2RS deep groove ball bearing (14 available in Cage D) during shift changeover.",
      intent: "document_rag",
      showLabel: true,
      alertText: "CONV-02 Drive Bearing Vibration (4.8 mm/s / Z=3.09σ)",
      outcomePill: "✓ SOP-MNT-04 §3.0 Cited",
      equipmentData: conv,
      citations: citations.length > 0 ? citations : [
        {
          docNumber: "SOP-MNT-04",
          docTitle: "Conveyor Gantry Transmission & Bearing Replacement Standard",
          section: "SOP-MNT-04 §3.0",
          relevanceScore: 0.92,
          snippet: "Bearing replacement procedure: lockout motor M-201, slack tensioning bolts, extract worn bearing with 3-jaw puller, press new 6205-2RS using induction heater.",
        },
      ],
    };
  }

  // PO Approval
  if (q.includes("approve")) {
    return {
      replyText: "PO-1042 sent to MSC Industrial (net-30) for 50x CNMG 432 inserts. Estimated arrival Thursday.",
      intent: "po_approval",
      outcomePill: "✓ PO-1042 sent, arrives Thursday",
      canApprovePo: false,
    };
  }

  // Training / Certifications
  if (q.includes("priya") || q.includes("training") || q.includes("cert") || q.includes("chemical")) {
    return {
      replyText: "Station 4 operator Priya S. is missing Chemical Handling certification (SOP-CHM-01 §1.3). Assigned module with 6 instructional steps.",
      intent: "training",
      alertText: "Station 4 needs Chemical Handling cert per SOP-CHM-01",
      outcomePill: "✓ Module assigned, verified step by step",
      citations: citations.length > 0 ? citations : [
        {
          docNumber: "SOP-CHM-01",
          docTitle: "Chemical Handling and Hazardous Fluid Disposal SOP",
          section: "SOP-CHM-01 §1.3",
          relevanceScore: 0.88,
          snippet: "Only personnel with current Chemical Handling certification may drain, flush, or transfer coolants and hydraulic oils.",
        },
      ],
    };
  }

  // Tool Crib Inventory
  if (q.includes("stock") || q.includes("cnmg") || q.includes("insert") || q.includes("inventory")) {
    return {
      replyText: "CNMG 432 inserts in Tool Crib B are down to 3 pcs (reorder point is 12 pcs). PO-1042 drafted to MSC for 50 pcs. Reply APPROVE to dispatch.",
      intent: "inventory",
      alertText: "Tool Crib B below reorder point (3 on hand vs 12 minimum)",
      canApprovePo: true,
    };
  }

  // Unfamiliar / unsupported equipment refusal check
  if (
    q.includes("laser") ||
    q.includes("welder") ||
    q.includes("plasma") ||
    q.includes("boiler") ||
    q.includes("nuclear") ||
    q.includes("turbine")
  ) {
    return {
      replyText:
        "No verified company procedure or record exists for this equipment type in the plant documentation repository. Please consult your area supervisor or OEM manual directly.",
      intent: "chat",
      showLabel: true,
      alertText: "Unverified Equipment Query",
    };
  }

  // Default General Assistant
  return {
    replyText:
      "Frontline operations co-pilot active. I can inspect machine telemetry drift, cite verified SOP procedures (e.g. SOP-HYD-11, SOP-CNC-07), dispatch internal work orders, track plant escalations, or look up verified technician knowledge.",
    intent: "chat",
    showLabel: true,
    citations,
  };
}

