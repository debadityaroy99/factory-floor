export interface RunHistoryItem {
  id: string;
  name: string;
  timestamp: string;
  stagesCompleted: string;
  status: "success" | "warning" | "partial" | "running";
  isAssembly?: boolean;
}

export const MOCK_RUNS: RunHistoryItem[] = [
  {
    id: "run-1",
    name: "clevis",
    timestamp: "Sep 26, 03:57 PM",
    stagesCompleted: "6/8 stages",
    status: "running",
  },
  {
    id: "run-2",
    name: "clevis",
    timestamp: "Sep 26, 10:54 AM",
    stagesCompleted: "8/8 stages",
    status: "success",
  },
  {
    id: "run-3",
    name: "clevis",
    timestamp: "Sep 26, 10:22 AM",
    stagesCompleted: "4/8 stages",
    status: "warning",
  },
  {
    id: "run-4",
    name: "SHAFT_ASSEMBLY",
    timestamp: "Sep 26, 04:14 AM",
    stagesCompleted: "Assembly",
    status: "success",
    isAssembly: true,
  },
  {
    id: "run-5",
    name: "io1-ug-214",
    timestamp: "Sep 26, 03:38 AM",
    stagesCompleted: "9/9 stages",
    status: "success",
  },
  {
    id: "run-6",
    name: "io1-ug-214",
    timestamp: "Sep 26, 03:37 AM",
    stagesCompleted: "7/8 stages",
    status: "partial",
  },
  {
    id: "run-7",
    name: "clevis",
    timestamp: "Sep 25, 11:09 PM",
    stagesCompleted: "6/6 stages",
    status: "success",
  },
  {
    id: "run-8",
    name: "Manufy-demo-X-Carriage-Cable-...",
    timestamp: "Sep 25, 02:32 PM",
    stagesCompleted: "6/6 stages",
    status: "success",
  },
  {
    id: "run-9",
    name: "06_10878456_Swirler",
    timestamp: "Sep 22, 09:10 PM",
    stagesCompleted: "Assembly",
    status: "success",
    isAssembly: true,
  },
  {
    id: "run-10",
    name: "Planetary_Gear_Assembly",
    timestamp: "Sep 22, 08:12 PM",
    stagesCompleted: "Assembly",
    status: "success",
    isAssembly: true,
  },
  {
    id: "run-11",
    name: "stepped_shaft",
    timestamp: "Sep 22, 08:07 PM",
    stagesCompleted: "2/8 stages",
    status: "success",
  },
];

export interface PipelineStage {
  id: number;
  name: string;
  nominalDuration: string;
  agentModel?: string;
}

export const PIPELINE_STAGES: PipelineStage[] = [
  { id: 1, name: "Load STEP", nominalDuration: "166ms" },
  { id: 2, name: "Six views", nominalDuration: "1.6s" },
  { id: 3, name: "Orientation", nominalDuration: "31.4s" },
  { id: 4, name: "Feature tree", nominalDuration: "53.2s", agentModel: "gpt-6-astra" },
  { id: 5, name: "View selection", nominalDuration: "34.5s" },
  { id: 6, name: "Derived views", nominalDuration: "0ms" },
  { id: 7, name: "Dimension set", nominalDuration: "3m 54s", agentModel: "gpt-6-midnight" },
  { id: 8, name: "Drawing sheet", nominalDuration: "10m 9s" },
];

export interface FeatureTreeRow {
  id: string;
  type: string;
  faces: string[];
  dims: string;
  notes: string;
}

export const FEATURE_TREE_ROWS: FeatureTreeRow[] = [
  { id: "F1", type: "through_hole", faces: ["#12", "#59"], dims: "d=10 depth=10", notes: "Primary base bolt clearance hole 1" },
  { id: "F2", type: "through_hole pattern P1", faces: ["#11", "#60"], dims: "d=10 depth=10", notes: "Primary base bolt clearance hole 2" },
  { id: "F3", type: "through_hole", faces: ["#14", "#56"], dims: "d=32 depth=45", notes: "Central mounting pivot bore" },
  { id: "F4", type: "through_hole", faces: ["#18", "#51"], dims: "d=12 depth=20", notes: "Clevis arm pin bore" },
  { id: "F5", type: "planar_face", faces: ["#31", "#32"], dims: "w=126 l=88", notes: "Base mounting datum A reference surface" },
  { id: "F6", type: "cylindrical_boss", faces: ["#40", "#41"], dims: "d=60 h=24", notes: "Central load bearing boss" },
  { id: "F7", type: "slot_pocket", faces: ["#45", "#48"], dims: "w=45 d=25", notes: "Clevis arm clevis opening / clearance gap" },
  { id: "F8", type: "through_hole", faces: ["#5", "#75"], dims: "d=20", notes: "Left clevis pin bore, coaxial with F5" },
  { id: "F9", type: "fillet_edge", faces: ["#82", "#85"], dims: "r=6", notes: "Stress relief fillet transition at bracket root" },
  { id: "F10", type: "chamfer_edge", faces: ["#92", "#96"], dims: "c=1.5 × 45°", notes: "Lead-in chamfer for clevis pin assembly" },
];

export interface ViewSelectionRow {
  view: string;
  required: boolean;
  reasoning: string;
}

export const VIEW_SELECTION_ROWS: ViewSelectionRow[] = [
  {
    view: "front",
    required: true,
    reasoning: "Serves as the primary view, showing the overall width and height, the mounting holes F1 and F2, the clevis arms, and the clevis gap F9.",
  },
  {
    view: "back",
    required: false,
    reasoning: "Largely duplicates the front view; the local fillet F13 can be specified by a general note or callout without requiring a redundant principal view.",
  },
  {
    view: "right",
    required: true,
    reasoning: "Presents the side profile of the bracket, defining the clevis arm curvature, clevis 'eye' and through-hole F4.",
  },
  {
    view: "left",
    required: false,
    reasoning: "Symmetric to the right view, mirroring the clevis eye F7 and bore F4 without providing unique dimensional information.",
  },
  {
    view: "top",
    required: true,
    reasoning: "Defines the contoured profile F15 of the mounting support, the central boss F6, and the clevis opening F9.",
  },
  {
    view: "bottom",
    required: false,
    reasoning: "Redundant with the front and top views; the underside notch F15 and clevis opening F9 are already clearly described.",
  },
];

export interface DimensionRow {
  id: string;
  kind: "leader" | "linear" | "radial";
  text: string;
  attachesTo: string[];
}

export const DIMENSION_ROWS: DimensionRow[] = [
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

export interface AgentLogGroup {
  stageId: number;
  stageName: string;
  model?: string;
  duration: string;
  entries: {
    type: "info" | "tool" | "status" | "json";
    turn?: string;
    text?: string;
    toolCallName?: string;
    toolCallArgs?: string;
    durationMs?: string;
    tokensIn?: string;
    tokensOut?: string;
    jsonSnippet?: string;
  }[];
  footer?: string;
}

export const AGENT_LOG_GROUPS: AgentLogGroup[] = [
  {
    stageId: 1,
    stageName: "Load STEP",
    duration: "166ms",
    entries: [
      { type: "info", text: "loading clevis.step" },
      { type: "info", text: "114 faces, frame solidworks, bbox 150 × 120 × 88 mm" },
    ],
  },
  {
    stageId: 2,
    stageName: "Six views",
    duration: "1.6s",
    entries: [
      { type: "info", text: "projecting front, back, right, left, top, bottom..." },
      { type: "status", text: "generated 6 isometric projected wireframes with hidden lines" },
    ],
  },
  {
    stageId: 3,
    stageName: "Orientation",
    duration: "31.4s",
    entries: [
      { type: "info", text: "asking Gemini whether the part should be turned on the sheet" },
      { type: "tool", turn: "Turn 1 · 1 tool call", toolCallName: "analyze_stability", toolCallArgs: "normal=[0, 0, 1] gravity_vector=[0, -1, 0]", durationMs: "12ms" },
      { type: "status", text: "Gemini response: front view matches natural stable working attitude" },
    ],
  },
  {
    stageId: 4,
    stageName: "Feature tree",
    model: "gpt-6-astra",
    duration: "53.2s",
    entries: [
      { type: "info", text: "running openai gpt-6-astra" },
      { type: "info", text: "Calling gpt-6-astra..." },
      { type: "tool", turn: "Turn 1 · 1 tool call", toolCallName: "inspect_face", toolCallArgs: "faces=[5,8,11,12,14,13,66,74,7...]", durationMs: "1ms", tokensIn: "28k", tokensOut: "36" },
      { type: "info", text: "Calling gpt-6-astra..." },
      { type: "tool", turn: "Turn 2 · 5 tool calls", toolCallName: "render_view", toolCallArgs: "view=top highlight=[31,32,33...]", durationMs: "257ms", tokensIn: "30k", tokensOut: "517" },
      { type: "tool", toolCallName: "measure", toolCallArgs: "kind=distance faces=[31,58]", durationMs: "0ms" },
      { type: "tool", toolCallName: "measure", toolCallArgs: "kind=distance faces=[11,12]", durationMs: "0ms" },
      { type: "tool", toolCallName: "measure", toolCallArgs: "kind=distance faces=[15,40]", durationMs: "0ms" },
      { type: "tool", toolCallName: "measure", toolCallArgs: "kind=distance faces=[39,42]", durationMs: "0ms" },
      { type: "info", text: "Calling gpt-6-astra..." },
      {
        type: "json",
        turn: "Turn 3 · completed",
        tokensIn: "32k",
        tokensOut: "2.5k",
        jsonSnippet: `{\n  "features": [\n    {\n      "id": "F1",\n      "type": "through_hole",\n      "faces": [12, 59],\n      "dims": { "d": 10, "depth": 10 },\n      "pattern": "P1"\n    },\n    {\n      "id": "F2",\n      "type": "through_hole",\n      "faces": [11, 60],\n      "dims": { "d": 10, "depth": 10 },\n      "pattern": "P1"\n    }\n  ]\n}`,
      },
    ],
    footer: "3% of context · 93k tokens total",
  },
  {
    stageId: 5,
    stageName: "View selection",
    duration: "34.5s",
    entries: [
      { type: "info", text: "asking Gemini which views the drawing needs" },
      { type: "status", text: "selected front, right, top; sections 0; auxiliary 0; detail 0" },
      { type: "info", text: "dropped back, left, bottom as redundant principal views" },
    ],
  },
  {
    stageId: 6,
    stageName: "Derived views",
    duration: "0ms",
    entries: [
      { type: "status", text: "classifier evaluated: 0 derived views required" },
      { type: "info", text: "The classifier called for none." },
    ],
  },
  {
    stageId: 7,
    stageName: "Dimension set",
    model: "gpt-6-midnight",
    duration: "3m 54s",
    entries: [
      { type: "info", text: "running openai gpt-6-midnight" },
      { type: "info", text: "Calling gpt-6-midnight..." },
      { type: "tool", turn: "Turn 1 · 5 tool calls", toolCallName: "select_datums", toolCallArgs: "primary=A secondary=B tertiary=C", durationMs: "18ms" },
      { type: "tool", toolCallName: "synthesize_dims", toolCallArgs: "feature_count=10 standard=ASME_Y14_5", durationMs: "42ms" },
      { type: "status", text: "Turn 2 · completed with 14 dimension constraints attached" },
    ],
  },
  {
    stageId: 8,
    stageName: "Drawing sheet",
    duration: "10m 9s",
    entries: [
      { type: "info", text: "laying out views: front (Zone C3), top (Zone B3), right (Zone C5)" },
      { type: "info", text: "solving dimension placements (14 linear & leader constraints)" },
      { type: "tool", toolCallName: "render_sheet_svg", toolCallArgs: "size=A3 orientation=landscape", durationMs: "124ms" },
      { type: "status", text: "sheet completed: 14 layout advisories reported" },
    ],
  },
];
