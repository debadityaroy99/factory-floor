/**
 * Centralized mock operational data source for Manufy Frontline Mode.
 *
 * This is the single factual source of truth representing the shop-floor
 * demonstration state across shifts, equipment, inventory, and training.
 */

export type TicketStatus = "HIGH" | "IN PROGRESS" | "WAITING PARTS" | "OPEN";

export interface Ticket {
  code: string;
  title: string;
  status: TicketStatus;
  meta: string;
  icon: "wrench" | "thermometer" | "droplet" | "flask" | "gear" | "ruler" | "bolt" | "oil-drop" | "battery" | "clipboard";
}

export interface Persona {
  id: string;
  firstName: string;
  name: string;
  initials: string;
  avatarColor: string;
  avatarTextColor?: string;
  role: string;
  shift: string;
  station?: string;
  subline: string;
  greeting: string;
  assigneeName: string;
  tickets: Ticket[];
}

export interface ToolCribItem {
  id: string;
  item: string;
  supplier: string;
  location: string;
  reorderPoint: number;
  onHand: number;
  unit: string;
  status: "BELOW_REORDER" | "ADEQUATE" | "CRITICAL";
  pendingPo?: {
    poNumber: string;
    quantity: number;
    supplier: string;
    terms: string;
    status: "DRAFT" | "SUBMITTED";
  };
}

export interface MaintenanceLogEntry {
  id: string;
  title: string;
  sub: string;
  date: string;
  equipment: string;
  resolvedBy?: string;
  sopCitation?: string;
  highlight?: boolean;
}

export interface OperatorCertification {
  name: string;
  certified: boolean;
  notes?: string;
}

export interface OperatorTrainingRecord {
  employeeId: string;
  name: string;
  role: string;
  station: string;
  shift: string;
  certifications: OperatorCertification[];
  pendingModules: string[];
}

export interface EquipmentStatusSummary {
  id: string;
  name: string;
  line: string;
  status: "NORMAL" | "DRIFTING" | "MAINTENANCE_DUE" | "DOWN";
  activeTicket?: string;
  metricIssue?: string;
  sopReference?: string;
}

// ---------------------------------------------------------------------------
// 1. PERSONAS & SHIFT ASSIGNMENTS
// ---------------------------------------------------------------------------
export const PERSONAS: Persona[] = [
  {
    id: "marcus",
    firstName: "Marcus",
    name: "Marcus T.",
    initials: "MT",
    avatarColor: "#1E43D8",
    avatarTextColor: "#FFFFFF",
    role: "Maintenance",
    shift: "Shift 2",
    subline: "3 active tickets · Press 3 is still drifting · Tool Crib B is low on inserts",
    greeting: "Morning. I'm watching Press 3, the CNC bay and Tool Crib B. Ask me anything the floor has ever fixed — or I'll flag what drifts.",
    assigneeName: "Devin",
    tickets: [
      {
        code: "W-3321",
        title: "Fix the steel bracket loosening — Engine Line 2",
        status: "HIGH",
        meta: "DUE TODAY 14:00",
        icon: "wrench",
      },
      {
        code: "W-3318",
        title: "Hydraulic temp 13° over spec — Press 3 · Line 2",
        status: "IN PROGRESS",
        meta: "STARTED 09:12",
        icon: "thermometer",
      },
      {
        code: "W-3307",
        title: "CNC-3 coolant PSI drop — check pump seal",
        status: "WAITING PARTS",
        meta: "SEAL KIT ETA THU",
        icon: "droplet",
      },
    ],
  },
  {
    id: "priya",
    firstName: "Priya",
    name: "Priya S.",
    initials: "PS",
    avatarColor: "#FFC53D",
    avatarTextColor: "#101418",
    role: "CNC Operator",
    shift: "Shift 2",
    station: "Station 4",
    subline: "1 cert pending · Station 4 is running Job 2214",
    greeting: "Hi Priya. Station 4 is on Job 2214, and the chemical handling cert is the only thing between you and solo changeovers. Ask me anything.",
    assigneeName: "Marcus",
    tickets: [
      {
        code: "T-118",
        title: "Finish chemical handling cert — 6 steps",
        status: "IN PROGRESS",
        meta: "MODULE 4 OF 6 · DUE THIS SHIFT",
        icon: "flask",
      },
      {
        code: "W-3319",
        title: "Station 4 changeover check — Job 2214",
        status: "OPEN",
        meta: "STARTS 13:00",
        icon: "gear",
      },
      {
        code: "W-3320",
        title: "Log insert wear for Tool Crib B",
        status: "OPEN",
        meta: "CNMG 432 · MIC IN CRIB B",
        icon: "ruler",
      },
    ],
  },
  {
    id: "devin",
    firstName: "Devin",
    name: "Devin R.",
    initials: "DR",
    avatarColor: "#3E6BE0",
    avatarTextColor: "#FFFFFF",
    role: "Senior Maintenance",
    shift: "Shift 1",
    subline: "2 follow-ups from Shift 1 · Press oil service coming due",
    greeting: "Morning Devin. Shift 1 left you two follow-ups and a press service coming due. Ask me anything.",
    assigneeName: "Marcus",
    tickets: [
      {
        code: "W-3304",
        title: "Allen-Bradley fault E-04 — verify reset",
        status: "IN PROGRESS",
        meta: "RESET LOGGED APR 06",
        icon: "bolt",
      },
      {
        code: "W-3315",
        title: "Press oil service at 1,500 hrs — prep parts",
        status: "OPEN",
        meta: "ISO 46 · CAGE D HAS 2",
        icon: "oil-drop",
      },
      {
        code: "W-3311",
        title: "Forklift battery rotation audit",
        status: "OPEN",
        meta: "BANK A → C · EVERY TUES",
        icon: "battery",
      },
    ],
  },
  {
    id: "dana",
    firstName: "Dana",
    name: "Dana K.",
    initials: "DK",
    avatarColor: "#FF6B2C",
    avatarTextColor: "#FFFFFF",
    role: "Stores & Purchasing",
    shift: "Tool Crib B",
    station: "Tool Crib B",
    subline: "1 PO waiting on you · 2 items under reorder point",
    greeting: "Hi Dana. One PO is waiting on your approval and two items are under reorder point. Ask me anything.",
    assigneeName: "Marcus",
    tickets: [
      {
        code: "P-1042",
        title: "Approve PO-1042 — CNMG inserts ×50",
        status: "HIGH",
        meta: "MSC INDUSTRIAL · NET-30",
        icon: "clipboard",
      },
      {
        code: "W-3322",
        title: "Reorder 6205-2RS bearings — 2 left",
        status: "OPEN",
        meta: "LAST USED APR 02",
        icon: "gear",
      },
      {
        code: "W-3323",
        title: "Cage D ISO 46 stocktake",
        status: "OPEN",
        meta: "SHOWS 2 · VERIFY FLOOR",
        icon: "droplet",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// 2. MOCK INVENTORY (TOOL CRIB B & CAGE D)
// ---------------------------------------------------------------------------
export const MOCK_INVENTORY: ToolCribItem[] = [
  {
    id: "item-cnmg-432",
    item: "CNMG 432 inserts",
    supplier: "MSC Industrial · net-30",
    location: "TOOL CRIB B",
    reorderPoint: 12,
    onHand: 3,
    unit: "inserts",
    status: "BELOW_REORDER",
    pendingPo: {
      poNumber: "PO-1042",
      quantity: 50,
      supplier: "MSC Industrial",
      terms: "net-30",
      status: "DRAFT",
    },
  },
  {
    id: "item-6205-bearing",
    item: "6205-2RS deep groove ball bearings",
    supplier: "Applied Industrial",
    location: "TOOL CRIB B / CAGE D",
    reorderPoint: 5,
    onHand: 2,
    unit: "bearings",
    status: "BELOW_REORDER",
  },
  {
    id: "item-iso-46-oil",
    item: "ISO 46 hydraulic oil",
    supplier: "Mobil / Grainger",
    location: "CAGE D",
    reorderPoint: 4,
    onHand: 2,
    unit: "pails (5-gal)",
    status: "BELOW_REORDER",
  },
];

// ---------------------------------------------------------------------------
// 3. MOCK MAINTENANCE & FLOOR LOG HISTORY
// ---------------------------------------------------------------------------
export const MOCK_MAINTENANCE_HISTORY: MaintenanceLogEntry[] = [
  {
    id: "log-1",
    title: "Conveyor 3 bearing failure",
    sub: "Replace 6205-2RS · resolved by Mike T.",
    date: "Today",
    equipment: "Conveyor 3",
    resolvedBy: "Mike T.",
    highlight: false,
  },
  {
    id: "log-2",
    title: "CNC-3 coolant PSI drop",
    sub: "Check pump seal · cited SOP-CNC-07 p3",
    date: "Apr 14",
    equipment: "CNC-3",
    sopCitation: "SOP-CNC-07 p3",
    highlight: false,
  },
  {
    id: "log-3",
    title: "Forklift battery rotation",
    sub: "Bank A → C every Tues · per Mike",
    date: "Apr 11",
    equipment: "Forklift Fleet (Bank A → C)",
    resolvedBy: "Mike T.",
    highlight: false,
  },
  {
    id: "log-4",
    title: "Allen-Bradley fault E-04",
    sub: "Reset sequence + photo · per Devin",
    date: "Apr 06",
    equipment: "PLC Line Controller (Allen-Bradley)",
    resolvedBy: "Devin R.",
    highlight: false,
  },
  {
    id: "log-5",
    title: "Hydraulic press oil change",
    sub: "ISO 46 · every 500 hrs · Cage D",
    date: "Apr 02",
    equipment: "Press 3 · Line 2",
    resolvedBy: "Devin R.",
    sopCitation: "SOP-HYD-11",
    highlight: true,
  },
];

export const MOCK_VERIFIED_OIL_SERVICE = {
  summary: "ISO 46 change on Apr 02 by Devin. Next due at 1,500 hrs. Cage D has 2 in stock.",
  sopCitation: "SOP-HYD-11",
  verifiedDate: "Apr 02",
};

// ---------------------------------------------------------------------------
// 4. MOCK OPERATOR TRAINING RECORDS
// ---------------------------------------------------------------------------
export const MOCK_TRAINING_RECORDS: OperatorTrainingRecord[] = [
  {
    employeeId: "emp-priya-s",
    name: "Priya S.",
    role: "CNC operator · station 4",
    station: "Station 4",
    shift: "Monday · second shift",
    certifications: [
      { name: "Forklift basics", certified: true, notes: "Certified" },
      { name: "Lockout/tagout", certified: true, notes: "Certified" },
      { name: "Chemical handling", certified: false, notes: "Missing certification" },
    ],
    pendingModules: ["Chemical handling (Module 4 of 6, due this shift for solo changeovers)"],
  },
];

// ---------------------------------------------------------------------------
// 5. MOCK EQUIPMENT STATUS & DRIFT ANOMALIES
// ---------------------------------------------------------------------------
export const MOCK_EQUIPMENT_STATUS: EquipmentStatusSummary[] = [
  {
    id: "eq-press-03",
    name: "Press 3",
    line: "Line 2",
    status: "DRIFTING",
    activeTicket: "W-3318",
    metricIssue: "Hydraulic temp 13° over spec (+13° thermal drift, started 09:12)",
    sopReference: "SOP-HYD-11",
  },
  {
    id: "eq-engine-line-2",
    name: "Engine Line 2",
    line: "Engine Line 2",
    status: "MAINTENANCE_DUE",
    activeTicket: "W-3321",
    metricIssue: "Steel bracket loosening (Torque all 6 bracket bolts to 45 Nm, check fretting)",
  },
  {
    id: "eq-cnc-03",
    name: "CNC-3",
    line: "CNC Bay",
    status: "MAINTENANCE_DUE",
    activeTicket: "W-3307",
    metricIssue: "Coolant PSI drop (Waiting parts: pump seal kit ETA Thursday)",
    sopReference: "SOP-CNC-07 p3",
  },
  {
    id: "eq-station-04",
    name: "Station 4",
    line: "Machining Bay",
    status: "NORMAL",
    activeTicket: "W-3319",
    metricIssue: "Changeover check for Job 2214 starts at 13:00",
  },
  {
    id: "eq-conv-03",
    name: "Conveyor 3",
    line: "Assembly Feed",
    status: "NORMAL",
    metricIssue: "Bearing failure resolved today by Mike T. (6205-2RS replaced)",
  },
];

// ---------------------------------------------------------------------------
// 6. EXACT APPLICATION GUARDRAIL MESSAGE
// ---------------------------------------------------------------------------
/**
 * Exact guardrail message from the existing Frontline response handler
 * (app/frontline/page.tsx L855). Returned for out-of-scope, unsupported,
 * or nonsensical inquiries.
 */
export const FRONTLINE_GUARDRAIL_MESSAGE =
  'I can pull the floor\'s history ("when was the press oil last changed?"), flag drifting equipment, check training certs, or watch stock levels. Try one of the suggestions below.';

