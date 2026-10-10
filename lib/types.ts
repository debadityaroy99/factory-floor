/**
 * Domain contracts and type definitions for Manufy Architect Mode.
 * Covers pipeline runs, CAD geometry stages, Vertex AI Gemini metrology,
 * Cloud Storage object metadata, and Firestore persistence schemas.
 */

export type RunStatus = "running" | "success" | "warning" | "partial" | "failed";

export interface StoredFileMetadata {
  fileName: string;
  fileSizeBytes: number;
  contentType: string;
  storageUri: string;
  publicUrl?: string;
  checksum?: string;
  uploadedAt: string;
  isMock: boolean;
}

export interface PipelineArtifact {
  id: string;
  name: string;
  stageId: number;
  contentType: string;
  storageUri: string;
  fileSizeBytes?: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// 2D Drawing / PDF Multimodal Extraction Types (Vertex AI Gemini)
// ---------------------------------------------------------------------------

export interface DrawingTitleBlock {
  drawingNumber: string;
  partName: string;
  revision: string;
  material: string;
  toleranceStandard: string;
  units: "mm" | "inch";
  scale: string;
  drafter: string;
  sheetNumber: string;
  isAmbiguous: boolean;
}

export interface ExtractedDimensionItem {
  id: string;
  text: string;
  nominalValue: number;
  unit: string;
  upperTolerance?: number;
  lowerTolerance?: number;
  isReference?: boolean;
  confidence: number;
  associatedView?: string;
  isAmbiguous?: boolean;
}

export interface ExtractedGdtSymbol {
  characteristic:
    | "POSITION"
    | "FLATNESS"
    | "PERPENDICULARITY"
    | "PARALLELISM"
    | "RUNOUT"
    | "PROFILE"
    | "CONCENTRICITY"
    | "OTHER";
  toleranceValue: string;
  datumReferences: string[];
  attachedFeature?: string;
  confidence: number;
  isAmbiguous: boolean;
}

export interface DrawingViewAnnotation {
  viewName: string;
  scale?: string;
  notes?: string[];
}

export interface DrawingExtractionResult {
  sourceFileName: string;
  storageUri?: string;
  mimeType: string;
  pageCount: number;
  textBlockCount: number;
  titleBlock: DrawingTitleBlock;
  dimensionsExtracted: ExtractedDimensionItem[];
  gdtSymbolsExtracted: ExtractedGdtSymbol[];
  viewAnnotations: DrawingViewAnnotation[];
  notes: string[];
  ambiguities: string[];
  unreadableRegions: string[];
  uncertaintyDisclaimer: string;
  rawFullText?: string;
  extractedWith: "vertexai-gemini" | "deterministic-fallback";
  fallbackUsed?: boolean;
  fallbackReason?: string;
}

// Backward compatibility alias
export type VisionDrawingAnalysis = DrawingExtractionResult;

// ---------------------------------------------------------------------------
// Architect Pipeline Stage Outputs
// ---------------------------------------------------------------------------

// Stage 1: Load STEP & Part Summary
export interface PartSummaryOutput {
  fileName: string;
  fileSizeBytes: number;
  fileType: string;
  bRepFaceCount: number;
  edgeCount: number;
  volumeMm3: number;
  boundingBox: {
    xMm: number;
    yMm: number;
    zMm: number;
  };
  materialGuess?: string;
}

// Stage 2: Six Views Projections
export interface SixViewsOutput {
  projectionSystem: "Third-Angle (ASME Y14.3)" | "First-Angle (ISO 128)";
  generatedViews: string[];
  renderResolution: string;
  viewArtifactUris?: Record<string, string>;
}

// Stage 3: Orientation Analysis (Vertex AI AI Stage)
export interface OrientationAnalysis {
  primaryDatumPlane: string;
  secondaryDatumPlane: string;
  reasoning: string;
  stabilityScore: number;
  recommendedOrientation: [number, number, number];
  aiModel?: string;
  fallbackUsed?: boolean;
  fallbackReason?: string;
}

// Stage 4: Feature Tree Extraction (Deterministic CAD B-Rep)
export interface FeatureTreeRow {
  id: string;
  type: string;
  faces: string[];
  dims: string;
  notes: string;
}

export interface FeatureTreeOutput {
  features: FeatureTreeRow[];
  totalFeaturesCount: number;
}

// Stage 5: View Selection (Vertex AI AI Stage per ASME Y14.3)
export interface ViewSelectionItem {
  view: "front" | "back" | "right" | "left" | "top" | "bottom";
  required: boolean;
  reasoning: string;
  fallbackUsed?: boolean;
  fallbackReason?: string;
}

// Stage 6: Derived Views (Deterministic)
export interface DerivedViewsOutput {
  sectionViews: Array<{
    name: string;
    parentView: string;
    cuttingPlane: string;
    reason: string;
  }>;
  detailViews: Array<{
    name: string;
    parentView: string;
    scale: string;
    centerFeature: string;
  }>;
}

// Stage 7: GD&T Dimensioning Synthesis (Vertex AI AI Stage per ASME Y14.5)
export interface DimensionItem {
  id: string;
  kind: "leader" | "linear" | "radial";
  text: string;
  attachesTo: string[];
  toleranceStandard?: string;
  fallbackUsed?: boolean;
  fallbackReason?: string;
}

// Stage 8: Drawing Sheet Layout (Deterministic)
export interface DrawingSheetOutput {
  sheetSize: "A3" | "A4" | "B" | "C";
  sheetScale: string;
  sheetDrawingUri?: string;
  placedViewsCount: number;
  placedDimensionsCount: number;
}

// Combined Stage Outputs Map
export interface StageExecutionOutput {
  stage1?: PartSummaryOutput;
  stage2?: SixViewsOutput;
  stage3?: OrientationAnalysis;
  stage4?: FeatureTreeOutput;
  stage5?: ViewSelectionItem[];
  stage6?: DerivedViewsOutput;
  stage7?: DimensionItem[];
  stage8?: DrawingSheetOutput;
}

export interface StructuredLogEntry {
  timestamp: string;
  level: "info" | "warn" | "error";
  stageId?: number;
  stageName?: string;
  message: string;
  latencyMs?: number;
  model?: string;
  fallbackUsed?: boolean;
  fallbackReason?: string;
}

// ---------------------------------------------------------------------------
// Full Pipeline Run Document (Firestore Schema)
// ---------------------------------------------------------------------------

export interface PipelineRun {
  id: string;
  name: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  contentType: string;
  sourceStorageUri?: string;
  timestamp: string;
  createdAt: number;
  updatedAt: number;
  currentStage: number;
  stagesCompleted: string;
  status: RunStatus;
  isAssembly?: boolean;
  stageOutputs: StageExecutionOutput;
  drawingAnalysis?: DrawingExtractionResult;
  artifacts?: PipelineArtifact[];
  logs?: StructuredLogEntry[];
  errorMessage?: string;
}

// ---------------------------------------------------------------------------
// Health Check Types
// ---------------------------------------------------------------------------

export type ServiceStatus = "healthy" | "degraded" | "unavailable" | "mocked" | "not_configured";

export interface ComponentHealth {
  status: ServiceStatus;
  details: string;
  latencyMs?: number;
  error?: string;
  actionRequired?: string;
}

export interface SystemHealthCheck {
  timestamp: string;
  status: "ok" | "degraded" | "error";
  mode: "strict_live" | "mock_fallback";
  project: string;
  region: string;
  services: {
    vertexAi: ComponentHealth;
    cloudStorage: ComponentHealth;
    firestore: ComponentHealth;
  };
}

