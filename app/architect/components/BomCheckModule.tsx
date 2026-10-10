"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  TableProperties,
  UploadCloud,
  Check,
  AlertTriangle,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Bot,
  FileSpreadsheet,
  X,
  RotateCcw,
  Download,
} from "lucide-react";

interface FindingItem {
  id: number;
  severity: "MAJOR" | "MINOR";
  itemNum: number; // 8, 9, 12, 6
  partNo: string;
  title: string;
  bomCitation: string;
  bomFileCite: string;
  drawingCitation: string;
  drawingFileCite: string;
  evidence: string;
}

const FINDINGS: FindingItem[] = [
  {
    id: 1,
    severity: "MAJOR",
    itemNum: 8,
    partNo: "C-2008-NA",
    title:
      "Item 8 — C-2008-NA, socket head cap screw 1/4-20 UNC-2A × 0.5 L — Quantity reconciliation between the overall bill of materials and the drawing parts list",
    bomCitation: "REQ 12 / SPARE 4 / TOT 16",
    bomFileCite: "E1100217-BOM-v1, row 8",
    drawingCitation: "REQ 10 / TOTAL 14",
    drawingFileCite: "sheet 1 parts list, item 8 — balloon on sheets 1 and 2",
    evidence:
      "Overall BOM allocates 4 spare screws for field replacement plus 12 primary assembly units. Drawing sheet 1 balloon callout only accounts for 10 units on the outer rim with no spare allocation noted.",
  },
  {
    id: 2,
    severity: "MAJOR",
    itemNum: 9,
    partNo: "90313A201",
    title: "Item 9 — 90313A201, flat washer 1/4 — Quantity reconciliation",
    bomCitation: "REQ 12 / SPARE 4 / TOT 16",
    bomFileCite: "row 9",
    drawingCitation: "REQ 10 / TOTAL 14",
    drawingFileCite: "sheet 1 parts list, item 9",
    evidence:
      "Washer count must match screw count. BOM lists 16 total washers (12 req + 4 spare) while drawing table only specifies 10 washers corresponding to 10 fasteners.",
  },
  {
    id: 3,
    severity: "MAJOR",
    itemNum: 12,
    partNo: "LOCTITE 243",
    title:
      "BOM row 12 — Loctite 243, 10 ml — Present in the overall BOM with no drawing balloon or parts-list row",
    bomCitation: "QTY 2",
    bomFileCite: "row 12",
    drawingCitation: "not listed",
    drawingFileCite: "sheets 1–2",
    evidence:
      "Chemical threadlocker is budgeted in master ERP BOM for torque seal on C-2008 fasteners. No assembly note, flag, or parts list balloon exists on sheet 1 or 2.",
  },
  {
    id: 4,
    severity: "MINOR",
    itemNum: 8,
    partNo: "C-2008-NA",
    title: "Item 8 — C-2008-NA — Description mismatch",
    bomCitation: 'SOCKET HEAD CAP SCREW 1/4-20 × 3/4 LG',
    bomFileCite: "overall BOM row 8",
    drawingCitation: '1/4-20 UNC-2A × 0.5 L — length differs (0.75 vs 0.5)',
    drawingFileCite: "drawing parts list item 8",
    evidence:
      'Length discrepancy: Drawing calls for 0.5 inch length socket cap screw, whereas procurement BOM specifies 3/4 (0.75) inch length. Risk of thread bottoming out.',
  },
  {
    id: 5,
    severity: "MINOR",
    itemNum: 6,
    partNo: "D1100352",
    title: "Item 6 — D1100352 — Material mismatch",
    bomCitation: '18-8 SSTL',
    bomFileCite: "BOM row 6",
    drawingCitation: '304 SSTL',
    drawingFileCite: "drawing row 6",
    evidence:
      'Drawing calls for 304 Stainless Steel for vacuum compatibility. BOM lists generic commercial 18-8 SSTL which may contain outgassing trace inclusions.',
  },
];

const CHECKLIST_ITEMS = [
  "Quantities reconcile (REQ / SPARE / TOTAL)",
  "Every BOM row has a drawing balloon",
  "Descriptions match",
  "Materials match",
  "Revisions match",
];

const STATUS_LINES = [
  "EXTRACTING PARTS LIST · SHEET 1…",
  "READING OVERALL BOM · 16 ROWS…",
  "RECONCILING QUANTITIES…",
  "WRITING FINDINGS…",
];

const PARTS_LIST_ROWS = [
  {
    item: 1,
    partNo: "D1001026",
    rev: "v2",
    desc: "ARM CAVITY BAFFLE UP LEAF",
    material: "18 GA ENAMEL STEEL A424",
    qty: 4,
    flagged: false,
  },
  {
    item: 2,
    partNo: "D1001027",
    rev: "v2",
    desc: "ARM CAVITY BAFFLE LOWER LEAF",
    material: "18 GA ENAMEL STEEL A424",
    qty: 4,
    flagged: false,
  },
  {
    item: 3,
    partNo: "D1100327",
    rev: "v2",
    desc: "ACB LEFT SIDE PANEL",
    material: "18 GA ENAMEL STEEL A424",
    qty: 2,
    flagged: false,
  },
  {
    item: 4,
    partNo: "D1100340",
    rev: "v2",
    desc: "ACB RIGHT SIDE PANEL",
    material: "18 GA ENAMEL STEEL A424",
    qty: 2,
    flagged: false,
  },
  {
    item: 5,
    partNo: "D1100347",
    rev: "v2",
    desc: "ACB UP CAPTURED PLATE",
    material: "304 SSTL",
    qty: 2,
    flagged: false,
  },
  {
    item: 6,
    partNo: "D1100352",
    rev: "v2",
    desc: "ACB LOW CAPTURED PLATE",
    material: "304 SSTL",
    qty: 2,
    flagged: false,
    findingId: 5,
  },
  {
    item: 7,
    partNo: "FA-605-NA",
    rev: "—",
    desc: "FLAT HD SCREW #6-32 × .312, UC COMP",
    material: "AG 18-8 SSTL",
    qty: 16,
    flagged: false,
  },
  {
    item: 8,
    partNo: "C-2008-NA",
    rev: "—",
    desc: "SCREW, SOCKET HEAD CAP, 1/4-20 UNC-2A × 0.5 L · McMaster",
    material: "AG 18-8 SSTL",
    qty: 10,
    flagged: true,
    findingId: 1, // Also 4
  },
  {
    item: 9,
    partNo: "90313A201",
    rev: "—",
    desc: "WASHER, FLAT, 1/4 · McMaster",
    material: "18-8 SSTL",
    qty: 10,
    flagged: true,
    findingId: 2,
  },
];

interface BomCheckModuleProps {
  onNewRun?: () => void;
  initialStep?: 1 | 2 | 3;
  initialSample?: boolean;
  isInspect?: boolean;
  onRunComplete?: (info: {
    runId?: string;
    fileName: string;
    moduleName: "BOM CHECK";
    moduleCode: "04-bom-check";
    runTitle: string;
    result: string;
    resultType: "error" | "warn" | "clear" | "neutral";
    sampleStep?: 1 | 2 | 3;
    details?: Record<string, unknown>;
  }) => void;
}

export function BomCheckModule({
  onNewRun,
  initialStep,
  initialSample = false,
  isInspect = false,
  onRunComplete,
}: BomCheckModuleProps) {
  // Mode step: 1 = New Check, 2 = Running, 3 = Results (opens directly to 3 if inspecting)
  const [step, setStep] = useState<1 | 2 | 3>(
    isInspect ? 3 : (initialStep || (initialSample ? 3 : 1))
  );

  // Files
  const [drawingFile, setDrawingFile] = useState<{
    name: string;
    size: string;
  } | null>(
    initialSample || isInspect
      ? { name: "E1100217-sh1.pdf", size: "2.4 MB" }
      : null
  );
  const [bomFile, setBomFile] = useState<{
    name: string;
    size: string;
  } | null>(
    initialSample || isInspect
      ? { name: "E1100217-BOM-v1.xlsx", size: "184 KB" }
      : null
  );

  const hasNotifiedComplete = useRef(isInspect);

  useEffect(() => {
    if (step === 3 && !hasNotifiedComplete.current && !isInspect) {
      hasNotifiedComplete.current = true;
      onRunComplete?.({
        fileName: drawingFile?.name || "E1100217-sh1.pdf",
        moduleName: "BOM CHECK",
        moduleCode: "04-bom-check",
        runTitle: "BOM vs drawing, reconciled",
        result: "3 MAJOR DISCREPANCIES",
        resultType: "error",
        sampleStep: 3,
        details: {
          drawingFile: drawingFile?.name,
          bomFile: bomFile?.name,
          findingsCount: 3,
        },
      });
    }
  }, [step, drawingFile, bomFile, isInspect, onRunComplete]);

  // State 1 staggered ticks
  const [stage1Ticks, setStage1Ticks] = useState(0);

  // State 2 running animation states
  const [runningTicks, setRunningTicks] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);

  // State 3 Results states
  const [activeTab, setActiveTab] = useState<
    "findings" | "checklist" | "agents" | "verdict"
  >("findings");
  const [selectedFindingId, setSelectedFindingId] = useState<number>(1);
  const [expandedEvidence, setExpandedEvidence] = useState<
    Record<number, boolean>
  >({ 1: true });

  // Refs for table rows to scroll into view
  const rowRefs = useRef<Record<number, HTMLTableRowElement | null>>({});

  // Input refs for file triggers
  const drawingInputRef = useRef<HTMLInputElement | null>(null);
  const bomInputRef = useRef<HTMLInputElement | null>(null);

  // State 1 Mount staggered checklist ticks
  useEffect(() => {
    if (step !== 1) return;
    setStage1Ticks(0);

    const t1 = setTimeout(() => setStage1Ticks(1), 350);
    const t2 = setTimeout(() => setStage1Ticks(2), 750);
    const t3 = setTimeout(() => setStage1Ticks(3), 1150);
    const t4 = setTimeout(() => setStage1Ticks(4), 1550);
    const t5 = setTimeout(() => setStage1Ticks(5), 1950);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [step]);

  // State 2 Running sequence (~5s)
  useEffect(() => {
    if (step !== 2) return;
    setRunningTicks(0);
    setStatusIndex(0);

    // Ticks 600ms apart
    const t1 = setTimeout(() => setRunningTicks(1), 600);
    const t2 = setTimeout(() => setRunningTicks(2), 1200);
    const t3 = setTimeout(() => setRunningTicks(3), 1800);
    const t4 = setTimeout(() => setRunningTicks(4), 2400);
    const t5 = setTimeout(() => setRunningTicks(5), 3000);

    // Status line cycles every ~1200ms
    const s1 = setTimeout(() => setStatusIndex(1), 1200);
    const s2 = setTimeout(() => setStatusIndex(2), 2400);
    const s3 = setTimeout(() => setStatusIndex(3), 3600);

    // Transition to results at 4900ms
    const finish = setTimeout(() => {
      setStep(3);
    }, 4900);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(s1);
      clearTimeout(s2);
      clearTimeout(s3);
      clearTimeout(finish);
    };
  }, [step]);

  // Handle clicking a finding -> highlights finding and scrolls table row into view
  const handleSelectFinding = (findingId: number) => {
    setSelectedFindingId(findingId);
    const finding = FINDINGS.find((f) => f.id === findingId);
    if (finding) {
      const targetRowEl = rowRefs.current[finding.itemNum];
      if (targetRowEl) {
        targetRowEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  // Sample files helper
  const handleUseSampleFiles = () => {
    setDrawingFile({ name: "E1100217-sh1.pdf", size: "2.4 MB" });
    setBomFile({ name: "E1100217-BOM-v1.xlsx", size: "184 KB" });
  };

  // Reset to new check
  const handleReset = () => {
    setStep(1);
    setSelectedFindingId(1);
    setActiveTab("findings");
  };

  // Active target item num for highlighting
  const activeFinding = FINDINGS.find((f) => f.id === selectedFindingId);
  const activeTargetItem = activeFinding?.itemNum ?? 8;

  // =========================================================================
  // STATE 1: NEW CHECK
  // =========================================================================
  if (step === 1) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-8 sm:py-12 bg-graphpaper">
        <div className="max-w-[720px] mx-auto space-y-6 sm:space-y-8 animate-slide-up">
          {/* Header */}
          <div className="text-center space-y-2.5">
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-[#101418] tracking-tight">
              Does the BOM match the drawing?
            </h1>
            <p className="font-sans text-[14px] sm:text-[15px] text-[#3C4356] leading-relaxed max-w-xl mx-auto">
              Upload the drawing set and the overall BOM. Manufy reconciles every line —
              quantities, descriptions, materials — and cites both documents for every mismatch.
            </p>
          </div>

          {/* Two Upload Cards Side by Side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 1: Drawing Set */}
            <div className="bg-[#FFFBF0] border-2 border-[#101418] rounded-[14px] p-4 sm:p-5 shadow-hard flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#101418]">
                  DRAWING SET
                </span>
                <span className="font-mono text-[10px] text-[#101418]/50">.PDF</span>
              </div>

              <input
                ref={drawingInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setDrawingFile({ name: f.name, size: `${Math.round(f.size / 1024)} KB` });
                }}
              />

              <div
                onClick={() => drawingInputRef.current?.click()}
                className="border-2 border-dashed border-[#101418]/30 hover:border-[#1E43D8] rounded-[10px] p-5 text-center bg-white/60 cursor-pointer transition-all flex flex-col items-center justify-center min-h-[120px] group"
              >
                {drawingFile ? (
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 bg-[#E8EEFC] border border-[#101418] px-2.5 py-1 rounded-full text-xs font-mono font-semibold text-[#1E43D8]">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[150px]">{drawingFile.name}</span>
                      <span className="text-[#101418]/50">· {drawingFile.size}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDrawingFile(null);
                        }}
                        className="hover:text-[#D92D20] ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="font-sans text-[11px] text-[#16A34A] font-medium flex items-center justify-center gap-1">
                      <Check className="w-3 h-3" /> Drawing attached · 2 sheets
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 text-[#101418]/70 group-hover:text-[#101418]">
                    <UploadCloud className="w-6 h-6 mx-auto text-[#1E43D8]" />
                    <div className="font-sans text-xs font-semibold">Drop drawing .pdf here</div>
                    <div className="font-mono text-[10px] text-[#101418]/50">or click to browse</div>
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Overall BOM */}
            <div className="bg-[#FFFBF0] border-2 border-[#101418] rounded-[14px] p-4 sm:p-5 shadow-hard flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#101418]">
                  OVERALL BOM
                </span>
                <span className="font-mono text-[10px] text-[#101418]/50">.XLSX / .CSV / .PDF</span>
              </div>

              <input
                ref={bomInputRef}
                type="file"
                accept=".xlsx,.csv,.pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setBomFile({ name: f.name, size: `${Math.round(f.size / 1024)} KB` });
                }}
              />

              <div
                onClick={() => bomInputRef.current?.click()}
                className="border-2 border-dashed border-[#101418]/30 hover:border-[#1E43D8] rounded-[10px] p-5 text-center bg-white/60 cursor-pointer transition-all flex flex-col items-center justify-center min-h-[120px] group"
              >
                {bomFile ? (
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 bg-[#E8EEFC] border border-[#101418] px-2.5 py-1 rounded-full text-xs font-mono font-semibold text-[#1E43D8]">
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[150px]">{bomFile.name}</span>
                      <span className="text-[#101418]/50">· {bomFile.size}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBomFile(null);
                        }}
                        className="hover:text-[#D92D20] ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="font-sans text-[11px] text-[#16A34A] font-medium flex items-center justify-center gap-1">
                      <Check className="w-3 h-3" /> Master BOM attached · 16 rows
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 text-[#101418]/70 group-hover:text-[#101418]">
                    <TableProperties className="w-6 h-6 mx-auto text-[#1E43D8]" />
                    <div className="font-sans text-xs font-semibold">Drop overall BOM here</div>
                    <div className="font-mono text-[10px] text-[#101418]/50">.xlsx, .csv, or .pdf</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sample Files Text Button */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleUseSampleFiles}
              className="font-mono text-xs font-semibold text-[#1E43D8] hover:text-[#101418] underline underline-offset-4 cursor-pointer transition-colors"
            >
              Use sample files (E1100217-sh1.pdf & E1100217-BOM-v1.xlsx)
            </button>
          </div>

          {/* Checks Sheet (pre-ticked sequentially on mount) */}
          <div className="bg-[#FFFBF0] border-2 border-[#101418] rounded-[14px] p-4 sm:p-5 shadow-hard space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#101418]/15">
              <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[#101418]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1E43D8]" />
                <span>ARMED RECONCILIATION CHECKS</span>
              </div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FFF3C4] border border-[#101418]/25 text-[#101418]">
                5 CHECKS READY
              </span>
            </div>

            <div className="space-y-2">
              {CHECKLIST_ITEMS.map((task, i) => {
                const isChecked = stage1Ticks > i;
                return (
                  <div key={i} className="flex items-center gap-2.5">
                    <div
                      className={`w-4 h-4 rounded-[4px] border-[1.5px] border-[#101418] flex items-center justify-center flex-shrink-0 shadow-xs transition-colors duration-[120ms] ${
                        isChecked
                          ? "bg-[#1E43D8] text-white animate-check-pop"
                          : "bg-white text-transparent"
                      }`}
                    >
                      {isChecked && (
                        <svg
                          className="w-2.5 h-2.5 stroke-[2.5]"
                          viewBox="0 0 12 12"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            d="M2.5 6.5L4.5 8.5L9.5 3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            pathLength={1}
                            className="animate-draw-check"
                            style={{ strokeDasharray: 1 }}
                          />
                        </svg>
                      )}
                    </div>
                    <span className="text-[13.5px] font-sans text-[#101418] leading-tight">
                      {task}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Run BOM Check Button */}
          <div className="flex justify-center pt-2">
            <button
              type="button"
              disabled={!drawingFile || !bomFile}
              onClick={() => setStep(2)}
              className={`w-full sm:w-auto px-8 py-3 rounded-[10px] font-sans font-semibold text-[15px] flex items-center justify-center gap-2 transition-all ${
                drawingFile && bomFile
                  ? "btn-royal cursor-pointer"
                  : "bg-gray-200 text-gray-500 border-2 border-[#101418]/20 cursor-not-allowed"
              }`}
            >
              <span>▶ Run BOM check</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STATE 2: RUNNING (~5s)
  // =========================================================================
  if (step === 2) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-12 bg-graphpaper flex flex-col items-center justify-center">
        <div className="w-full max-w-[580px] mx-auto space-y-6 text-center animate-slide-up">
          {/* Status pill cycling */}
          <div>
            <div className="inline-flex items-center gap-2.5 bg-[#FFF3C4] border-[1.5px] border-[#101418] px-4 py-2 rounded-full font-mono text-[12px] font-bold text-[#101418] shadow-hard-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1E43D8] animate-ping" />
              <span>{STATUS_LINES[statusIndex]}</span>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#101418]">
              Cross-Reconciling Master BOM
            </h2>
            <p className="font-sans text-[14px] text-[#3C4356]">
              Parsing 16 rows against 9 drawing balloons and sheet 1 parts schedule.
            </p>
          </div>

          {/* Checks sheet re-animating */}
          <div className="bg-[#FFFBF0] border-2 border-[#101418] rounded-[14px] p-5 shadow-hard space-y-3 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-[#101418]/15">
              <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#101418]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1E43D8]" />
                <span>ACTIVE INSPECTION STAGES</span>
              </div>
              <span className="font-mono text-[10px] font-bold uppercase text-[#1E43D8]">
                {runningTicks} / 5 COMPLETE
              </span>
            </div>

            <div className="space-y-2.5">
              {CHECKLIST_ITEMS.map((task, i) => {
                const isChecked = runningTicks > i;
                return (
                  <div key={i} className="flex items-center gap-2.5">
                    <div
                      className={`w-4 h-4 rounded-[4px] border-[1.5px] border-[#101418] flex items-center justify-center flex-shrink-0 shadow-xs transition-colors duration-[120ms] ${
                        isChecked
                          ? "bg-[#1E43D8] text-white animate-check-pop"
                          : "bg-white text-transparent"
                      }`}
                    >
                      {isChecked && (
                        <svg
                          className="w-2.5 h-2.5 stroke-[2.5]"
                          viewBox="0 0 12 12"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            d="M2.5 6.5L4.5 8.5L9.5 3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            pathLength={1}
                            className="animate-draw-check"
                            style={{ strokeDasharray: 1 }}
                          />
                        </svg>
                      )}
                    </div>
                    <span className="text-[13.5px] font-sans text-[#101418] leading-tight">
                      {task}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Click through escape hatch */}
          <div>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="font-mono text-xs font-semibold text-[#1E43D8] hover:underline cursor-pointer"
            >
              Skip to results →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STATE 3: RESULTS VIEW
  // =========================================================================
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#FFFBF0]">
      {/* Top Title & Action Bar */}
      <div className="border-b-2 border-[#101418] bg-[#FFFBF0] px-4 sm:px-6 py-3 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="font-display font-bold text-xl sm:text-2xl text-[#101418]">
            Inspection requires review
          </h2>
          <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-full bg-[#E8EEFC] border-[1.5px] border-[#101418] text-[#1E43D8] shadow-2xs">
            {bomFile?.name ? bomFile.name.replace(/\.[^/.]+$/, "") : "E1100217-BOM-v1"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="bg-[#101418] hover:bg-[#101418]/85 text-white font-sans text-xs font-semibold px-3 py-1.5 rounded-full shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="bg-white hover:bg-[#E8EEFC] border-[1.5px] border-[#101418] text-[#101418] font-sans text-xs font-semibold px-3 py-1.5 rounded-full shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New revision</span>
          </button>
        </div>
      </div>

      {/* Summary strip chips */}
      <div className="border-b border-[#101418]/15 bg-[#FBF6E9] px-4 sm:px-6 py-1.5 shrink-0 flex items-center gap-2 overflow-x-auto no-scrollbar font-mono text-[11px] font-semibold">
        <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#101418]/20 text-[#101418]">
          16 BOM rows
        </span>
        <span className="text-[#101418]/30">·</span>
        <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#101418]/20 text-[#101418]">
          9 drawing items
        </span>
        <span className="text-[#101418]/30">·</span>
        <span className="px-2.5 py-0.5 rounded-full bg-[#E8EEFC] border border-[#101418] text-[#1E43D8] font-bold">
          5 findings
        </span>
        <span className="text-[#101418]/30">·</span>
        <span className="px-2.5 py-0.5 rounded-full bg-[#FDECEA] border border-[#D92D20]/40 text-[#D92D20] font-bold">
          3 major
        </span>
      </div>

      {/* Main Two-Column Stage */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* =====================================================================
            LEFT COLUMN (flex-1): Drawing Line-Art Panel + Reconciled Parts List Table
        ===================================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5 bg-[#FBF6E9]/50">
          {/* Drawing Sheet Panel */}
          <div className="bg-white border-2 border-[#101418] rounded-[14px] p-4 shadow-hard space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-[#101418]/15 text-xs font-mono font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#1E43D8]" />
                <span className="text-[#101418]">DRAWING VIEW · E1100217-SH1 (SHEET 1 OF 2)</span>
              </div>
              <span className="text-[#101418]/60">BALLOON INSPECTION OVERLAY</span>
            </div>

            {/* Engineering Line-Art SVG Plate */}
            <div className="w-full bg-[#FFFBF0] border-[1.5px] border-[#101418] rounded-xl overflow-hidden p-2 flex items-center justify-center">
              <svg
                viewBox="0 0 640 340"
                className="w-full h-auto max-h-[340px] text-[#101418] select-none"
                fill="none"
              >
                {/* Outer Plate Contour */}
                <rect
                  x="110"
                  y="40"
                  width="420"
                  height="240"
                  rx="14"
                  stroke="#101418"
                  strokeWidth="2.5"
                  fill="#FFFFFF"
                />

                {/* Inner Cutout Cavity */}
                <rect
                  x="170"
                  y="85"
                  width="300"
                  height="150"
                  rx="8"
                  stroke="#101418"
                  strokeWidth="1.8"
                  strokeDasharray="4 2"
                  fill="#FFFBF0"
                />

                {/* Center Bore with Crosshairs */}
                <circle cx="320" cy="160" r="42" stroke="#101418" strokeWidth="2" />
                <circle cx="320" cy="160" r="24" stroke="#101418" strokeWidth="1.5" />
                <line x1="260" y1="160" x2="380" y2="160" stroke="#1E43D8" strokeWidth="1" strokeDasharray="6 3" />
                <line x1="320" y1="100" x2="320" y2="220" stroke="#1E43D8" strokeWidth="1" strokeDasharray="6 3" />

                {/* Mounting Holes / Fastener Pattern (Items 8 and 9) */}
                {[
                  [135, 65], [505, 65], [135, 255], [505, 255],
                  [200, 65], [320, 65], [440, 65],
                  [200, 255], [320, 255], [440, 255],
                ].map(([cx, cy], i) => (
                  <g key={i}>
                    <circle cx={cx} cy={cy} r="6" stroke="#D92D20" strokeWidth="1.6" fill="#FDECEA" />
                    <circle cx={cx} cy={cy} r="2" fill="#D92D20" />
                  </g>
                ))}

                {/* Title Block in Lower Right */}
                <g transform="translate(370, 220)">
                  <rect x="0" y="0" width="150" height="55" stroke="#101418" strokeWidth="1.5" fill="#FFFBF0" />
                  <line x1="0" y1="20" x2="150" y2="20" stroke="#101418" strokeWidth="1" />
                  <line x1="0" y1="38" x2="150" y2="38" stroke="#101418" strokeWidth="1" />
                  <line x1="75" y1="20" x2="75" y2="55" stroke="#101418" strokeWidth="1" />
                  <text x="6" y="14" fontSize="8" fontFamily="monospace" fontWeight="bold" fill="#101418">
                    ACB FRAME ASSEMBLY
                  </text>
                  <text x="6" y="32" fontSize="7" fontFamily="monospace" fill="#101418">
                    DWG: E1100217-SH1
                  </text>
                  <text x="82" y="32" fontSize="7" fontFamily="monospace" fill="#101418">
                    REV: 2
                  </text>
                  <text x="6" y="49" fontSize="7" fontFamily="monospace" fill="#101418">
                    SCALE: 1:1
                  </text>
                  <text x="82" y="49" fontSize="7" fontFamily="monospace" fill="#101418">
                    DRAWN: J. SMITH
                  </text>
                </g>

                {/* Balloons 1 to 9 with leader lines */}
                {/* 1: Upper Leaf */}
                <line x1="260" y1="25" x2="280" y2="85" stroke="#101418" strokeWidth="1.2" />
                {/* 2: Lower Leaf */}
                <line x1="260" y1="295" x2="280" y2="235" stroke="#101418" strokeWidth="1.2" />
                {/* 3: Left Side Panel */}
                <line x1="50" y1="130" x2="170" y2="130" stroke="#101418" strokeWidth="1.2" />
                {/* 4: Right Side Panel */}
                <line x1="580" y1="130" x2="470" y2="130" stroke="#101418" strokeWidth="1.2" />
                {/* 5: Upper Captured Plate */}
                <line x1="390" y1="25" x2="370" y2="90" stroke="#101418" strokeWidth="1.2" />
                {/* 6: Lower Captured Plate (Finding 5) */}
                <line x1="390" y1="295" x2="370" y2="230" stroke={activeTargetItem === 6 ? "#1E43D8" : "#101418"} strokeWidth="1.5" />
                {/* 7: Flat HD Screw */}
                <line x1="50" y1="200" x2="140" y2="200" stroke="#101418" strokeWidth="1.2" />
                {/* 8: Socket Head Cap Screw (Finding 1 & 4) */}
                <line x1="580" y1="65" x2="505" y2="65" stroke="#D92D20" strokeWidth="1.8" />
                {/* 9: Flat Washer (Finding 2) */}
                <line x1="580" y1="200" x2="505" y2="245" stroke="#D92D20" strokeWidth="1.8" />

                {/* Balloon Circles Helper */}
                {[
                  { num: 1, cx: 260, cy: 22 },
                  { num: 2, cx: 260, cy: 305 },
                  { num: 3, cx: 40, cy: 130 },
                  { num: 4, cx: 590, cy: 130 },
                  { num: 5, cx: 400, cy: 22 },
                  { num: 6, cx: 400, cy: 305 },
                  { num: 7, cx: 40, cy: 200 },
                  { num: 8, cx: 595, cy: 65 },
                  { num: 9, cx: 595, cy: 200 },
                ].map(({ num, cx, cy }) => {
                  const isHighlighted = activeTargetItem === num;
                  const isFlagged = num === 8 || num === 9;
                  return (
                    <g
                      key={num}
                      className="cursor-pointer"
                      onClick={() => {
                        const match = FINDINGS.find((f) => f.itemNum === num);
                        if (match) handleSelectFinding(match.id);
                      }}
                    >
                      {isHighlighted && (
                        <circle cx={cx} cy={cy} r="18" fill="none" stroke="#1E43D8" strokeWidth="2" strokeDasharray="3 2" className="animate-pulse" />
                      )}
                      <circle
                        cx={cx}
                        cy={cy}
                        r="12"
                        stroke="#101418"
                        strokeWidth="1.8"
                        fill={
                          isHighlighted
                            ? isFlagged
                              ? "#D92D20"
                              : "#1E43D8"
                            : isFlagged
                            ? "#FDECEA"
                            : "#FFFFFF"
                        }
                      />
                      <text
                        x={cx}
                        y={cy + 4}
                        fontSize="11"
                        fontFamily="sans-serif"
                        fontWeight="bold"
                        textAnchor="middle"
                        fill={isHighlighted ? "#FFFFFF" : isFlagged ? "#D92D20" : "#101418"}
                      >
                        {num}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Reconciled PARTS LIST Table */}
          <div className="bg-white border-2 border-[#101418] rounded-[14px] shadow-hard overflow-hidden">
            <div className="px-4 py-2.5 bg-[#FBF6E9] border-b-2 border-[#101418] flex items-center justify-between">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#101418]">
                PARTS LIST · RECONCILED AGAINST OVERALL BOM
              </span>
              <span className="font-mono text-[10px] text-[#D92D20] font-bold">
                ● 2 Flagged rows · 1 BOM-only row
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F4EDE0] border-b-[1.5px] border-[#101418] font-mono text-[10.5px] font-bold uppercase tracking-wider text-[#101418]/70">
                    <th className="py-2.5 px-3 w-12 text-center">ITEM</th>
                    <th className="py-2.5 px-3 w-32">PART NO</th>
                    <th className="py-2.5 px-2 w-12 text-center">REV</th>
                    <th className="py-2.5 px-3">DESCRIPTION</th>
                    <th className="py-2.5 px-3 w-44">MATERIAL</th>
                    <th className="py-2.5 px-3 w-20 text-right">QTY REQ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#101418]/10 font-sans text-[12.5px]">
                  {PARTS_LIST_ROWS.map((row) => {
                    const isTarget = activeTargetItem === row.item;
                    return (
                      <tr
                        key={row.item}
                        ref={(el) => {
                          rowRefs.current[row.item] = el;
                        }}
                        onClick={() => {
                          if (row.findingId) handleSelectFinding(row.findingId);
                        }}
                        className={`transition-all ${
                          row.flagged
                            ? "bg-[#D92D20]/[0.07] hover:bg-[#D92D20]/[0.12]"
                            : "hover:bg-[#E8EEFC]/40"
                        } ${
                          isTarget
                            ? "ring-2 ring-inset ring-[#101418] bg-[#FDECEA] font-medium"
                            : ""
                        } ${row.findingId ? "cursor-pointer" : ""}`}
                      >
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-[#101418]">
                          {row.item}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium text-[#101418]">
                          {row.partNo}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono text-[#101418]/60">
                          {row.rev}
                        </td>
                        <td className="py-2.5 px-3 text-[#101418]">
                          {row.desc}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11.5px] text-[#101418]/80">
                          {row.material}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#101418]">
                          {row.qty}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Appended Ghost Row: Loctite 243 (BOM only) */}
                  <tr
                    ref={(el) => {
                      rowRefs.current[12] = el;
                    }}
                    onClick={() => handleSelectFinding(3)}
                    className={`italic bg-[#FFF3C4]/70 border-t-2 border-dashed border-[#101418]/30 transition-all cursor-pointer ${
                      activeTargetItem === 12
                        ? "ring-2 ring-inset ring-[#101418] bg-[#FFF3C4]"
                        : "hover:bg-[#FFF3C4]/90"
                    }`}
                  >
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-[#101418]">
                      12
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#101418]/70">
                      — (BOM only)
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-[#101418]/40">
                      —
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#101418]">
                      LOCTITE 243, 10 ML — not on drawing
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11.5px] text-[#101418]/60">
                      CONSUMABLE
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#101418]">
                      2
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* =====================================================================
            RIGHT COLUMN (380px): Tabs for Checklist, Findings 5, Agents 2, Verdict
        ===================================================================== */}
        <aside className="w-full lg:w-[380px] shrink-0 border-t-2 lg:border-t-0 lg:border-l-2 border-[#101418] bg-[#FFFBF0] flex flex-col h-full overflow-hidden">
          {/* Tab Bar */}
          <div className="flex border-b-2 border-[#101418] bg-[#FBF6E9] shrink-0">
            {[
              { id: "checklist", label: "Checklist" },
              { id: "findings", label: "Findings 5" },
              { id: "agents", label: "Agents 2" },
              { id: "verdict", label: "Verdict" },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex-1 py-2.5 text-center font-sans text-xs font-semibold transition-all cursor-pointer border-r border-[#101418]/15 last:border-r-0 ${
                    isActive
                      ? "bg-[#FFFBF0] text-[#1E43D8] border-b-2 border-b-[#1E43D8] -mb-px font-bold"
                      : "text-[#101418]/70 hover:bg-[#E8EEFC]/50 hover:text-[#101418]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB 1: FINDINGS FEED */}
          {activeTab === "findings" && (
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
              {FINDINGS.map((finding) => {
                const isSelected = selectedFindingId === finding.id;
                const isExpanded = !!expandedEvidence[finding.id];

                return (
                  <div
                    key={finding.id}
                    onClick={() => handleSelectFinding(finding.id)}
                    className={`rounded-[12px] p-3.5 space-y-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#E8EEFC] border-2 border-[#101418] shadow-hard-xs"
                        : "bg-white border-2 border-[#101418] hover:bg-[#F8FAFC] shadow-2xs"
                    }`}
                  >
                    {/* Header: Number disc, severity pill, BOM tag, Awaiting status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Number disc */}
                        <div className="w-5 h-5 rounded-full bg-[#101418] text-white font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                          {finding.id}
                        </div>

                        {/* Severity Pill */}
                        {finding.severity === "MAJOR" ? (
                          <span className="inline-flex items-center gap-1 bg-[#D92D20] text-white px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider shadow-2xs">
                            <AlertTriangle className="w-3 h-3" />
                            <span>MAJOR</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-[#FFF3C4] border border-[#101418]/30 text-[#101418] px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider">
                            <span>MINOR</span>
                          </span>
                        )}

                        {/* Tag Chip */}
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 border border-gray-300 text-gray-700">
                          BOM
                        </span>
                      </div>

                      {/* Status chip */}
                      <span className="font-mono text-[9.5px] font-semibold px-2 py-0.5 rounded-full bg-[#FFF3C4] border border-[#101418]/20 text-[#101418] shrink-0">
                        AWAITING REVIEW
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-sans font-semibold text-[13px] text-[#101418] leading-snug">
                      {finding.title}
                    </h3>

                    {/* Citations */}
                    <div className="space-y-1.5 text-[11px] font-mono bg-white/70 border border-[#101418]/15 rounded-lg p-2.5">
                      <div>
                        <span className="text-[#101418]/60 font-semibold">BOM value: </span>
                        <span className="text-[#101418] font-bold">{finding.bomCitation} </span>
                        <span className="px-1.5 py-0.5 rounded bg-[#E8EEFC] text-[#1E43D8] border border-[#1E43D8]/30 inline-block mt-0.5">
                          {finding.bomFileCite}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#101418]/60 font-semibold">Drawing value: </span>
                        <span className="text-[#101418] font-bold">{finding.drawingCitation} </span>
                        <span className="px-1.5 py-0.5 rounded bg-[#E8EEFC] text-[#1E43D8] border border-[#1E43D8]/30 inline-block mt-0.5">
                          {finding.drawingFileCite}
                        </span>
                      </div>
                    </div>

                    {/* Source Links */}
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-[#1E43D8] hover:underline flex items-center gap-0.5">
                        bom-{finding.id}-source <ArrowUpRight className="w-3 h-3" />
                      </span>
                      <span className="text-[#1E43D8] hover:underline flex items-center gap-0.5">
                        bom-{finding.id}-drawing <ArrowUpRight className="w-3 h-3" />
                      </span>
                    </div>

                    {/* Collapsible Evidence */}
                    <div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedEvidence((prev) => ({
                            ...prev,
                            [finding.id]: !prev[finding.id],
                          }));
                        }}
                        className="flex items-center gap-1 font-mono text-[11px] font-semibold text-[#101418]/70 hover:text-[#101418] cursor-pointer"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                        <span>Evidence and reasoning</span>
                      </button>

                      {isExpanded && (
                        <div className="mt-1.5 pl-4 border-l-2 border-[#1E43D8]/40 font-sans text-xs text-[#3C4356] leading-relaxed animate-slide-up">
                          {finding.evidence}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: CHECKLIST */}
          {activeTab === "checklist" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3 animate-slide-up">
              <div className="font-mono text-xs font-bold uppercase text-[#101418]/60 pb-1">
                SYSTEM RECONCILIATION AUDIT
              </div>
              {[
                { label: "Quantities reconcile", status: "FAIL · 2 items", pass: false, count: 2 },
                { label: "Every BOM row has a balloon", status: "FAIL · 1", pass: false, count: 1 },
                { label: "Descriptions match", status: "FAIL · 1", pass: false, count: 1 },
                { label: "Materials match", status: "FAIL · 1", pass: false, count: 1 },
                { label: "Revisions match", status: "PASS", pass: true, count: 0 },
              ].map((c, i) => (
                <div
                  key={i}
                  className="bg-white border-2 border-[#101418] rounded-xl p-3 flex items-center justify-between shadow-2xs"
                >
                  <span className="font-sans text-[13px] font-medium text-[#101418]">
                    {c.label}
                  </span>
                  <span
                    className={`font-mono text-[10.5px] font-bold px-2 py-0.5 rounded ${
                      c.pass
                        ? "bg-[#16A34A] text-white"
                        : c.count > 1
                        ? "bg-[#D92D20] text-white"
                        : "bg-[#FFF3C4] border border-[#101418]/30 text-[#101418]"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: AGENTS 2 */}
          {activeTab === "agents" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3 animate-slide-up">
              <div className="font-mono text-xs font-bold uppercase text-[#101418]/60 pb-1">
                ACTIVE RECONCILIATION AGENTS
              </div>

              <div className="bg-white border-2 border-[#101418] rounded-xl p-3.5 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#101418]">
                    <Bot className="w-3.5 h-3.5 text-[#1E43D8]" />
                    <span>BOM AGENT</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                </div>
                <p className="font-sans text-xs text-[#3C4356]">
                  Cross-read 16 BOM rows against 9 drawing items
                </p>
                <div className="font-mono text-[10px] text-[#101418]/50">
                  VERIFIED · 16 ROWS PARSED
                </div>
              </div>

              <div className="bg-white border-2 border-[#101418] rounded-xl p-3.5 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#101418]">
                    <Bot className="w-3.5 h-3.5 text-[#1E43D8]" />
                    <span>EVIDENCE AGENT</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                </div>
                <p className="font-sans text-xs text-[#3C4356]">
                  Cited sheet 1 parts list + BOM rows 8, 9, 12
                </p>
                <div className="font-mono text-[10px] text-[#101418]/50">
                  VERIFIED · 5 CITATIONS MAPPED
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: VERDICT */}
          {activeTab === "verdict" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 animate-slide-up">
              <div className="bg-white border-2 border-[#101418] rounded-xl p-4 space-y-3.5 shadow-hard-xs">
                <div className="bg-[#D92D20] text-white px-3 py-2 rounded-lg font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>DO NOT RELEASE — 3 MAJOR DISCREPANCIES</span>
                </div>

                <div className="space-y-2 text-xs font-sans text-[#101418]">
                  <div className="p-2 bg-[#FDECEA] rounded border border-[#D92D20]/20 font-medium">
                    1. Item 8 screw quantity mismatch (BOM requires 16 vs drawing specifies 10).
                  </div>
                  <div className="p-2 bg-[#FDECEA] rounded border border-[#D92D20]/20 font-medium">
                    2. Item 9 flat washer count diverges from fastener schedule (16 vs 10).
                  </div>
                  <div className="p-2 bg-[#FDECEA] rounded border border-[#D92D20]/20 font-medium">
                    3. Row 12 Loctite 243 missing from drawing set callouts and balloons.
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-royal w-full py-2.5 rounded-lg text-xs font-semibold"
                >
                  Export review PDF
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

