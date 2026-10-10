/**
 * Pure type definitions and mock defaults for Architect Projects.
 * Safe to import in both Client and Server Components.
 */

export interface ProjectRunRecord {
  id?: string;
  moduleName: "AUTODRAFT" | "DESIGN INTELLIGENCE" | "GD&T REVIEW" | "BOM CHECK";
  moduleCode: "01-autodraft" | "02-design-intelligence" | "03-gdt-review" | "04-bom-check";
  runTitle: string;
  fileName: string;
  result: string;
  resultType: "error" | "warn" | "clear" | "neutral";
  date: string;
  isDemo: boolean;
  sampleStep?: 1 | 2 | 3;
  storageUri?: string;
  runId?: string;
  timestamp?: number;
  details?: Record<string, unknown>;
}

export interface ProjectItem {
  id: string;
  name: string;
  dwg: string;
  thumb: "sheet" | "plate" | "probe" | "bom" | "blank";
  status: "IN REVIEW" | "ISSUES OPEN" | "RELEASED" | "DRAFT";
  runs: {
    autodraft: number;
    di: number;
    gdt: number;
    bom: number;
  };
  findings: string;
  findingsType: "issues" | "clear" | "neutral";
  owner: string;
  initials: string;
  updated: string;
  runsList: ProjectRunRecord[];
  createdAt?: number;
  updatedAt?: number;
  storageUri?: string;
  sourceFileName?: string;
  sourceFileSize?: number;
}

const NOW = 1728570000000; // Stable reference timestamp

export const DEFAULT_MOCK_PROJECTS: ProjectItem[] = [
  {
    id: "proj-clevis",
    name: "Clevis bracket — Line 2 cell",
    dwg: "DWG CLEVIS-114 · REV A",
    thumb: "sheet",
    status: "IN REVIEW",
    runs: { autodraft: 1, di: 0, gdt: 0, bom: 0 },
    findings: "14 LAYOUT ISSUES",
    findingsType: "issues",
    owner: "deb",
    initials: "D",
    updated: "2H AGO",
    createdAt: NOW - 2 * 3600 * 1000,
    updatedAt: NOW - 2 * 3600 * 1000,
    storageUri: "gs://factory-floor-cad-drawings/projects/proj-clevis/source/clevis.step",
    sourceFileName: "clevis.step",
    runsList: [
      {
        moduleName: "AUTODRAFT",
        moduleCode: "01-autodraft",
        runTitle: "8-Stage automated drawing run",
        fileName: "clevis.step",
        result: "14 ISSUES",
        resultType: "warn",
        date: "OCT 10",
        isDemo: true,
      },
    ],
  },
  {
    id: "proj-diffuser",
    name: "Diffuser plate",
    dwg: "DWG D1000130 · REV C",
    thumb: "plate",
    status: "ISSUES OPEN",
    runs: { autodraft: 0, di: 1, gdt: 0, bom: 0 },
    findings: "4 OPEN ISSUES",
    findingsType: "issues",
    owner: "deb",
    initials: "D",
    updated: "5H AGO",
    createdAt: NOW - 5 * 3600 * 1000,
    updatedAt: NOW - 5 * 3600 * 1000,
    storageUri: "gs://factory-floor-cad-drawings/projects/proj-diffuser/source/D1000130-DIFFUSER-PLATE.pdf",
    sourceFileName: "D1000130-DIFFUSER-PLATE.pdf",
    runsList: [
      {
        moduleName: "DESIGN INTELLIGENCE",
        moduleCode: "02-design-intelligence",
        runTitle: "Missing-dimension review",
        fileName: "D1000130-DIFFUSER-PLATE.pdf",
        result: "4 ISSUES",
        resultType: "error",
        date: "OCT 10",
        isDemo: true,
      },
    ],
  },
  {
    id: "proj-probe",
    name: "Contact probe",
    dwg: "GDT-PROBE-450 · REV B",
    thumb: "probe",
    status: "ISSUES OPEN",
    runs: { autodraft: 0, di: 0, gdt: 1, bom: 0 },
    findings: "3 ERRORS OPEN",
    findingsType: "issues",
    owner: "Priya S.",
    initials: "PS",
    updated: "YESTERDAY",
    createdAt: NOW - 24 * 3600 * 1000,
    updatedAt: NOW - 24 * 3600 * 1000,
    storageUri: "gs://factory-floor-cad-drawings/projects/proj-probe/source/GDT-PROBE-450.png",
    sourceFileName: "GDT-PROBE-450.png",
    runsList: [
      {
        moduleName: "GD&T REVIEW",
        moduleCode: "03-gdt-review",
        runTitle: "ASME Y14.5 tolerance stack audit",
        fileName: "GDT-PROBE-450.png",
        result: "3 ERRORS",
        resultType: "error",
        date: "OCT 09",
        isDemo: true,
      },
    ],
  },
  {
    id: "proj-enclosure",
    name: "E1100217 enclosure",
    dwg: "DWG E1100217 · REV v2",
    thumb: "bom",
    status: "IN REVIEW",
    runs: { autodraft: 0, di: 0, gdt: 0, bom: 1 },
    findings: "3 MAJOR DISCREPANCIES",
    findingsType: "issues",
    owner: "deb",
    initials: "D",
    updated: "YESTERDAY",
    createdAt: NOW - 28 * 3600 * 1000,
    updatedAt: NOW - 28 * 3600 * 1000,
    storageUri: "gs://factory-floor-cad-drawings/projects/proj-enclosure/source/E1100217-sh1.pdf",
    sourceFileName: "E1100217-sh1.pdf",
    runsList: [
      {
        moduleName: "BOM CHECK",
        moduleCode: "04-bom-check",
        runTitle: "Drawing vs BOM reconciliation",
        fileName: "E1100217-sh1.pdf",
        result: "3 DISCREPANCIES",
        resultType: "warn",
        date: "OCT 09",
        isDemo: true,
        sampleStep: 3,
      },
    ],
  },
  {
    id: "proj-manifold",
    name: "Hydraulic manifold block",
    dwg: "DWG HM-2081 · REV —",
    thumb: "blank",
    status: "DRAFT",
    runs: { autodraft: 0, di: 0, gdt: 0, bom: 0 },
    findings: "NO RUNS YET",
    findingsType: "neutral",
    owner: "deb",
    initials: "D",
    updated: "OCT 08",
    createdAt: NOW - 48 * 3600 * 1000,
    updatedAt: NOW - 48 * 3600 * 1000,
    storageUri: "gs://factory-floor-cad-drawings/projects/proj-manifold/source/project.json",
    sourceFileName: "HM-2081.step",
    runsList: [],
  },
  {
    id: "proj-battery",
    name: "Forklift battery tray",
    dwg: "DWG FBT-552 · REV D",
    thumb: "sheet",
    status: "RELEASED",
    runs: { autodraft: 1, di: 1, gdt: 1, bom: 1 },
    findings: "ALL CLEAR",
    findingsType: "clear",
    owner: "Dana K.",
    initials: "DK",
    updated: "OCT 06",
    createdAt: NOW - 96 * 3600 * 1000,
    updatedAt: NOW - 96 * 3600 * 1000,
    storageUri: "gs://factory-floor-cad-drawings/projects/proj-battery/source/FBT-552.step",
    sourceFileName: "FBT-552.step",
    runsList: [
      {
        moduleName: "AUTODRAFT",
        moduleCode: "01-autodraft",
        runTitle: "Production drawing release",
        fileName: "FBT-552.step",
        result: "PASSED",
        resultType: "clear",
        date: "OCT 06",
        isDemo: false,
      },
      {
        moduleName: "DESIGN INTELLIGENCE",
        moduleCode: "02-design-intelligence",
        runTitle: "Sheet metal feasibility",
        fileName: "FBT-552-sh1.pdf",
        result: "ALL CLEAR",
        resultType: "clear",
        date: "OCT 06",
        isDemo: false,
      },
      {
        moduleName: "GD&T REVIEW",
        moduleCode: "03-gdt-review",
        runTitle: "Datum alignment sign-off",
        fileName: "FBT-552-GDT.pdf",
        result: "0 ERRORS",
        resultType: "clear",
        date: "OCT 06",
        isDemo: false,
      },
      {
        moduleName: "BOM CHECK",
        moduleCode: "04-bom-check",
        runTitle: "Fastener quantity validation",
        fileName: "FBT-552-BOM.xlsx",
        result: "MATCHED",
        resultType: "clear",
        date: "OCT 06",
        isDemo: false,
      },
    ],
  },
];

