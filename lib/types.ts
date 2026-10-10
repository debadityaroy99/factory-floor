/**
 * Shared domain models and type contracts across frontend and backend services.
 */

// =========================================================================
// ARCHITECT PIPELINE & RUN TYPES
// =========================================================================

export type RunStatus = "running" | "success" | "warning" | "partial" | "failed";

export interface FeatureTreeItem {
  id: string;
  type: string;
  faces: string[];
  dims: string;
  notes: string;
}

export interface ViewSelectionItem {
  view: string;
  required: boolean;
  reasoning: string;
}

export interface DimensionItem {
  id: string;
  kind: "leader" | "linear" | "radial";
  text: string;
  attachesTo: string[];
}

export interface OrientationAnalysis {
  turned: string;
  reasoning: string;
  stableBase: string;
  normalVector: number[];
}

export interface PartDefinition {
  fileName: string;
  fileSize: string;
  faces: number;
  solids: number;
  units: string;
  boundingBox: string;
  cadFrame: string;
  volumeMm3?: number;
  massKg?: number;
  gcsUri?: string;
}

export interface StageExecutionOutput {
  partSummary?: PartDefinition;
  orientation?: OrientationAnalysis;
  featureTree?: FeatureTreeItem[];
  viewSelection?: ViewSelectionItem[];
  derivedViews?: { count: number; reasoning: string };
  dimensionSet?: DimensionItem[];
  drawingSheet?: {
    size: string;
    viewsRendered: string[];
    layoutIssuesResolved: number;
  };
}

export interface PipelineRun {
  id: string;
  name: string;
  fileName: string;
  gcsUri?: string;
  fileType: string;
  fileSizeBytes: number;
  timestamp: string;
  createdAt: number;
  updatedAt: number;
  currentStage: number;
  stagesCompleted: string;
  status: RunStatus;
  isAssembly?: boolean;
  stageOutputs: StageExecutionOutput;
  logs: {
    stageId: number;
    stageName: string;
    model?: string;
    timestamp: string;
    message: string;
    durationMs?: number;
    tokensIn?: string;
    tokensOut?: string;
  }[];
  errorMessage?: string;
  drawingAnalysis?: DrawingExtractionResult;
}

// =========================================================================
// VERTEX AI MULTIMODAL DRAWING EXTRACTION TYPES
// =========================================================================

export interface DrawingTitleBlock {
  drawingNumber?: string;
  partName?: string;
  revision?: string;
  material?: string;
  toleranceStandard?: string;
  units?: "mm" | "inch" | "mixed" | "unknown";
  scale?: string;
  drafter?: string;
  sheetNumber?: string;
  isAmbiguous?: boolean;
}

export interface ExtractedDimensionItem {
  id?: string;
  text: string;
  nominalValue?: number;
  unit?: string;
  upperTolerance?: number;
  lowerTolerance?: number;
  isReference?: boolean;
  confidence: number;
  associatedView?: string;
  isAmbiguous?: boolean;
  boundingBox?: { x: number; y: number }[];
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
  isAmbiguous?: boolean;
}

export interface DrawingViewAnnotation {
  viewName: string; // e.g. "SECTION A-A", "DETAIL B", "FRONT VIEW", "ISOMETRIC VIEW"
  scale?: string;
  notes?: string[];
}

export interface DrawingExtractionResult {
  sourceFileName: string;
  gcsUri?: string;
  mimeType: string;
  pageCount: number;
  textBlockCount: number;
  titleBlock?: DrawingTitleBlock;
  dimensionsExtracted: ExtractedDimensionItem[];
  gdtSymbolsExtracted?: ExtractedGdtSymbol[];
  viewAnnotations?: DrawingViewAnnotation[];
  notes: string[];
  ambiguities?: string[];
  unreadableRegions?: string[];
  uncertaintyDisclaimer?: string;
  rawFullText: string;
  extractedWith: "vertexai-gemini" | "deterministic-fallback";
}

// Backward compatibility alias
export type VisionDrawingAnalysis = DrawingExtractionResult;

// =========================================================================
// FRONTLINE SHOPFLOOR TYPES
// =========================================================================

export type UserRole =
  | "operator"
  | "technician"
  | "supervisor"
  | "manager"
  | "OPERATOR"
  | "TECHNICIAN"
  | "SUPERVISOR"
  | "ADMIN";

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  shift: string;
  station?: string;
}

export type EquipmentStatus = "NORMAL" | "WARNING" | "CRITICAL" | "MAINTENANCE" | "OFFLINE";

export interface EquipmentMetric {
  name: string;
  value?: number;
  currentValue?: number;
  unit: string;
  baseline?: number;
  baselineMean?: number;
  stddev?: number;
  baselineStddev?: number;
  warningThreshold?: number;
  criticalThreshold?: number;
  status: "NORMAL" | "WARNING" | "CRITICAL";
}

export interface EquipmentAnomaly {
  id: string;
  equipmentId: string;
  metricName: string;
  measuredValue: number;
  baselineMean: number;
  deviationDelta: number;
  zScore: number;
  severity: "WARNING" | "CRITICAL";
  type: "DRIFT" | "VIBRATION_SPIKE" | "PRESSURE_DROP" | "CYCLE_DRIFT";
  description: string;
  isConfirmedFailure: boolean; // Distinguish measured anomaly from confirmed failure
  timestamp: string;
  evidenceCalculation: string;
  preventiveRecommendation: string;
}

export interface EquipmentItem {
  id: string;
  name: string;
  line: string;
  bay: string;
  status: EquipmentStatus;
  type: "PRESS" | "CNC" | "CONVEYOR" | "PUMP" | "PLC";
  criticality: "A" | "B" | "C";
  lastMaintenanceDate: string;
  healthScore: number; // 0-100
  metrics: EquipmentMetric[];
  activeAnomalies: EquipmentAnomaly[];
  recommendedAction?: string;
  isDemoAsset?: boolean;
}

export interface CompanyDocumentSection {
  sectionId: string;
  heading: string;
  content: string;
}

export interface CompanyDocument {
  id: string;
  title: string;
  docNumber: string; // e.g. SOP-HYD-11
  category: "SOP" | "MANUAL" | "TROUBLESHOOTING" | "SAFETY" | "REPORT";
  equipmentTypes: string[];
  allowedRoles: UserRole[];
  storageUri: string;
  version: string;
  sections: CompanyDocumentSection[];
}

export interface DocumentCitation {
  docNumber: string;
  docTitle: string;
  section: string;
  relevanceScore: number;
  snippet: string;
}

export type WorkOrderStatus =
  | "OPEN"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "BLOCKED"
  | "COMPLETED"
  | "VERIFIED";

export type WorkOrderSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type WorkOrderPriority = "P1" | "P2" | "P3" | "P4";

export interface WorkOrderAuditEntry {
  action: string;
  actor: string;
  timestamp: string;
  note?: string;
}

export interface WorkOrder {
  id: string;
  equipmentId: string;
  equipmentName: string;
  title: string;
  description: string;
  severity: WorkOrderSeverity;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  assignedTeam: string;
  assignedTechnician?: string;
  supportingEvidence: string[];
  recommendedAction: string;
  sourceReferences: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  verifiedAt?: string;
  auditLog: WorkOrderAuditEntry[];
  escalated?: boolean;
  cmmsReferenceId?: string;
}

export interface EscalationRecord {
  id: string;
  workOrderId?: string;
  equipmentId: string;
  severity: "HIGH" | "CRITICAL";
  reason: string;
  evidence: string;
  destination: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  safetyCritical: boolean;
  siteProcedureCitation?: string;
  outcome?: string;
}

export type KnowledgeStatus = "DRAFT" | "UNDER_REVIEW" | "APPROVED";

export interface TribalKnowledgeRecord {
  id: string;
  equipmentId: string;
  equipmentName: string;
  title: string;
  symptoms: string[];
  probableCauses: string[];
  diagnosticSteps: string[];
  actualRootCause: string;
  repairPerformed: string;
  partsUsed: string[];
  downtimeMinutes: number;
  verificationResults: string;
  authorName: string;
  authorRole: string;
  status: KnowledgeStatus;
  approvedBy?: string;
  approvedAt?: string;
  version: number;
  linkedWorkOrderIds: string[];
  linkedDocCitations: string[];
  isTechnicianConfirmed: boolean;
  aiGeneratedSuggestion?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TelemetryPoint {
  equipmentId: string;
  timestamp: string;
  metricName: string;
  metricValue: number;
  unit: string;
  baselineMean: number;
  baselineStddev: number;
  isAnomaly: boolean;
  isDemoData: boolean;
}

export interface EquipmentKpiSummary {
  equipmentId: string;
  equipmentName: string;
  mtbfHours: number;
  mttrMinutes: number;
  availabilityPercent: number;
  totalDowntimeHours24h: number;
  failureCount30d: number;
  repeatFailureRate: number;
  lastCalculatedAt: string;
  isDemoAnalytics: boolean;
}

export interface FloorHistoryRecord {
  id: string;
  title: string;
  sub: string;
  date: string;
  equipmentId?: string;
  sopCitation?: string;
  highlight?: boolean;
}

export interface ToolCribInventoryItem {
  id: string;
  item: string;
  supplier: string;
  location: string;
  reorderPoint: number;
  onHand: number;
  unit: string;
}

export interface OperatorTrainingRecord {
  id: string;
  name: string;
  role: string;
  shift: string;
  station: string;
  certifications: { name: string; certified: boolean }[];
  missingModules: string[];
}

export type FrontlineIntent =
  | "chat"
  | "alert"
  | "plan"
  | "training"
  | "inventory"
  | "history"
  | "po_approval"
  | "equipment_health"
  | "document_rag"
  | "analytics"
  | "work_order_action"
  | "escalation"
  | "knowledge_capture";

export interface FrontlineChatResponse {
  replyText: string;
  intent: FrontlineIntent;
  showLabel?: boolean;
  alertText?: string;
  planData?: {
    workOrderId: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
    tasks: string[];
  };
  trainingData?: OperatorTrainingRecord;
  inventoryData?: ToolCribInventoryItem;
  historyData?: {
    highlightAnswer: string;
    sopCitation: string;
    entries: FloorHistoryRecord[];
  };
  outcomePill?: string;
  canApprovePo?: boolean;
  // Upgraded capabilities
  citations?: DocumentCitation[];
  workOrderData?: WorkOrder;
  escalationData?: EscalationRecord;
  knowledgeData?: TribalKnowledgeRecord;
  analyticsData?: EquipmentKpiSummary;
  equipmentData?: EquipmentItem;
  safetyNotice?: string;
}


