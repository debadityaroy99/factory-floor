"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  UploadCloud,
  FileText,
  X,
  Check,
  ZoomIn,
  ZoomOut,
  Eye,
  AlertTriangle,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Bot,
  Activity,
  Maximize2,
  FileCheck2,
} from "lucide-react";

interface EvidenceChip {
  id: string; // e.g. "F1-1", "F1-2", "F1-3", "F1-4"
  label: string;
  chipNum: string; // "①", "②", etc.
  region: { left: number; top: number; width: number; height: number }; // % of canvas
  zoomCenter: { x: number; y: number }; // % of canvas to center on zoom
}

interface GdtFinding {
  id: number;
  type: "ERROR" | "WARNING" | "OK";
  title: string;
  body: string;
  correction?: string;
  pin?: { x: number; y: number }; // % of canvas
  chips: EvidenceChip[];
  evidenceReasoning: string;
}

const GDT_FINDINGS: GdtFinding[] = [
  {
    id: 1,
    type: "ERROR",
    title: "Verify 3/8-24 UNF-2B thread designation and MINOR DIA positional tolerance",
    body: "One thread, two datum schemes: the front view's frame orders the datums B A C, the top view's C A B. Both govern the same minor diameter, so the part has two different acceptance criteria.",
    correction: "Pick one datum order for this thread and restate both frames identically.",
    pin: { x: 26, y: 50 },
    chips: [
      {
        id: "F1-1",
        label: "3/8-24 UNF-2B",
        chipNum: "①",
        region: { left: 28, top: 42, width: 16, height: 6 },
        zoomCenter: { x: 36, y: 45 },
      },
      {
        id: "F1-2",
        label: ".583",
        chipNum: "②",
        region: { left: 58.5, top: 4.5, width: 5.5, height: 3.5 },
        zoomCenter: { x: 60.4, y: 6.4 },
      },
      {
        id: "F1-3",
        label: "⌖ Ø.007Ⓜ B A C",
        chipNum: "③",
        region: { left: 30, top: 46, width: 16, height: 8 },
        zoomCenter: { x: 38, y: 50 },
      },
      {
        id: "F1-4",
        label: "MINOR DIA",
        chipNum: "④",
        region: { left: 30, top: 55, width: 12, height: 6 },
        zoomCenter: { x: 36, y: 58 },
      },
    ],
    evidenceReasoning:
      "ASME Y14.5-2009 Rule 1 & Section 4.3: Datum precedence dictates physical measurement sequence. B A C establishes primary alignment from Datum B (right face), whereas C A B starts from Datum C (far end). The identical feature cannot establish two conflicting datum coordinate frames simultaneously.",
  },
  {
    id: 2,
    type: "ERROR",
    title: "Evaluate Ø.240 pin size tolerance and MMC positional virtual condition",
    body: "Ø.240 pin at ⌖ Ø.010Ⓜ yields a virtual condition of Ø.250; the mating bore's VC is Ø.243. At worst case the pin interferes — the numbers don't close.",
    correction: "Open pin position to Ø.017Ⓜ, or tighten size, so pin VC ≤ Ø.243.",
    pin: { x: 63.5, y: 68.6 },
    chips: [
      {
        id: "F2-1",
        label: "Ø.240",
        chipNum: "①",
        region: { left: 60.5, top: 67, width: 6.5, height: 4 },
        zoomCenter: { x: 63.5, y: 68.6 },
      },
      {
        id: "F2-2",
        label: "⌖ Ø.010Ⓜ B A C",
        chipNum: "②",
        region: { left: 60.5, top: 70.2, width: 14.5, height: 4.2 },
        zoomCenter: { x: 67.8, y: 72 },
      },
      {
        id: "F2-3",
        label: "3.00 OAL",
        chipNum: "③",
        region: { left: 63, top: 49.5, width: 7, height: 4 },
        zoomCenter: { x: 66.5, y: 51.5 },
      },
    ],
    evidenceReasoning:
      "Machinery's Handbook 31st Ed, p. 741 / ASME Y14.5 MMC Math: Pin Virtual Condition = MMC size (.240) + position tolerance (.010) = .250. Mating bore LMC condition is .243. Worst-case fit produces .007 interference during maximum material condition assembly.",
  },
  {
    id: 3,
    type: "ERROR",
    title: "Conflicting edge-break callouts: R.03 vs 4X R.062",
    body: "Two leaders land on the same corner radii with different values; the shop will pick one and scrap will argue about it.",
    correction: "Delete the stale R.03 leader; keep 4X R.062.",
    pin: { x: 74, y: 5.8 },
    chips: [
      {
        id: "F3-1",
        label: "R.03",
        chipNum: "①",
        region: { left: 68.2, top: 5.4, width: 5.5, height: 2.8 },
        zoomCenter: { x: 70.8, y: 6.7 },
      },
      {
        id: "F3-2",
        label: "4X R.062",
        chipNum: "②",
        region: { left: 67.5, top: 2.5, width: 6.5, height: 2.8 },
        zoomCenter: { x: 70.8, y: 4.0 },
      },
    ],
    evidenceReasoning:
      "Top view displays two leader callouts terminating at the exact same tangent arc on the top-right block corner. One calls out 4X R.062 while an older unpurged leader specifies R.03, violating drawing uniqueness rules.",
  },
  {
    id: 4,
    type: "WARNING",
    title: "Pin tip 40° carries no tolerance of its own",
    body: "Only the block's angular ±30′ governs the probe tip; for a contact point that may be looser than the function allows.",
    correction: "Add ±1° to the 40° tip, or confirm ±30′ is acceptable.",
    pin: { x: 91.5, y: 65 },
    chips: [
      {
        id: "F4-1",
        label: "40°",
        chipNum: "①",
        region: { left: 89.5, top: 63, width: 5, height: 4.5 },
        zoomCenter: { x: 91.5, y: 65 },
      },
      {
        id: "F4-2",
        label: "ANGULAR ±30′",
        chipNum: "②",
        region: { left: 44, top: 88, width: 18, height: 9 },
        zoomCenter: { x: 53, y: 92 },
      },
    ],
    evidenceReasoning:
      "Section A-A dimension for probe conical tip indicates 40° basic without an explicit feature tolerance. By default it inherits title block general angular tolerance ±30 minutes (0.5°), which may induce tooling chatter or gauge repeatability drift.",
  },
  {
    id: 5,
    type: "OK",
    title: "Basic dimensions locating features from Datum A are consistent",
    body: "The boxed .375 locates the bore centre identically in front and top views; the stack closes.",
    chips: [
      {
        id: "F5-1",
        label: ".375",
        chipNum: "①",
        region: { left: 40, top: 20, width: 8, height: 6 },
        zoomCenter: { x: 44, y: 23 },
      },
      {
        id: "F5-2",
        label: "Ø.500",
        chipNum: "②",
        region: { left: 67.5, top: 12.2, width: 11, height: 2.8 },
        zoomCenter: { x: 73, y: 13.5 },
      },
    ],
    evidenceReasoning:
      "Theoretical exact location (basic dimension boxed in rectangle) .375 is confirmed aligned between top view orthogonal coordinate system and front view bore axis.",
  },
  {
    id: 6,
    type: "OK",
    title: "Tolerance block agrees with Note 1",
    body: "ASME Y14.5-2009 invoked, .XXX ±.005 covers .583 and .950, no orphan decimals.",
    chips: [
      {
        id: "F6-1",
        label: ".XXX ±.005",
        chipNum: "①",
        region: { left: 44, top: 90, width: 12, height: 5 },
        zoomCenter: { x: 50, y: 92 },
      },
      {
        id: "F6-2",
        label: "NOTE 1",
        chipNum: "②",
        region: { left: 6, top: 78, width: 24, height: 12 },
        zoomCenter: { x: 18, y: 84 },
      },
    ],
    evidenceReasoning:
      "All three-place decimal dimensions (.583, .781, .950) correctly fall within general tolerance boundaries without untoleranced orphan annotations.",
  },
];

const CHECKLIST_ROWS = [
  "Thread designations and minor-dia frames",
  "Positional tolerance and MMC math",
  "Datum scheme and datum order",
  "Basic-dimension consistency",
  "Notes against feature control frames",
];

const DRAWING_TYPES = [
  "Let AI Decide",
  "Probe / Pin",
  "Plate",
  "Shaft",
  "Housing",
  "Flange",
  "General",
];

const STATUS_LINES = [
  "READING CALLOUTS · 23 ANNOTATIONS…",
  "PARSING FEATURE CONTROL FRAMES · 9…",
  "CHECKING MMC VIRTUAL CONDITIONS…",
  "VERIFYING DATUM SCHEME A · B · C…",
  "WRITING FINDINGS…",
];

const ACTIVITY_LOGS = [
  "Parsed 214 entities from GDT-PROBE-450",
  "Extracted 9 feature control frames",
  "Compared datum order: B A C vs C A B → conflict",
  "Virtual condition Ø.240 pin = Ø.250 vs bore Ø.243 → interference",
  "Edge-break leaders: 2 values on one edge",
  "Basic .375 cross-view check → consistent",
  "Tolerance block vs Note 1 → agrees",
  "84 events total",
];

interface GdtReviewModuleProps {
  onNewRun?: () => void;
  initialSample?: boolean;
  initialStep?: 1 | 2 | 3;
  isInspect?: boolean;
  onRunComplete?: (info: {
    runId?: string;
    fileName: string;
    moduleName: "GD&T REVIEW";
    moduleCode: "03-gdt-review";
    runTitle: string;
    result: string;
    resultType: "error" | "warn" | "clear" | "neutral";
    sampleStep?: 1 | 2 | 3;
    details?: Record<string, unknown>;
  }) => void;
}

export function GdtReviewModule({
  onNewRun,
  initialSample = false,
  initialStep,
  isInspect = false,
  onRunComplete,
}: GdtReviewModuleProps) {
  // 1 = Setup, 2 = Analysing, 3 = Results (opens directly to 3 if inspecting)
  const [step, setStep] = useState<1 | 2 | 3>(
    isInspect ? 3 : (initialStep || (initialSample ? 3 : 1))
  );

  // File
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: string;
  } | null>(
    initialSample || isInspect
      ? {
          name: "GDT-PROBE-450.png",
          size: "1.4 MB",
        }
      : null
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Selected drawing type
  const [selectedDrawingType, setSelectedDrawingType] = useState("Probe");
  const hasNotifiedComplete = useRef(isInspect);

  useEffect(() => {
    if (step === 3 && !hasNotifiedComplete.current && !isInspect) {
      hasNotifiedComplete.current = true;
      onRunComplete?.({
        fileName: selectedFile?.name || "GDT-PROBE-450.png",
        moduleName: "GD&T REVIEW",
        moduleCode: "03-gdt-review",
        runTitle: "GD&T that doesn't close",
        result: "3 ERRORS OPEN",
        resultType: "error",
        sampleStep: 3,
        details: { errorsCount: 3, drawingType: selectedDrawingType },
      });
    }
  }, [step, selectedFile, selectedDrawingType, isInspect, onRunComplete]);

  // State 1 staggered ticks
  const [stage1Ticks, setStage1Ticks] = useState(0);

  // State 2 status cycling & ticks
  const [statusIndex, setStatusIndex] = useState(0);
  const [runningTicks, setRunningTicks] = useState(0);

  // State 3 Results interaction
  const [activeTab, setActiveTab] = useState<"checks" | "activity" | "verdict">("checks");
  const [activeFindingId, setActiveFindingId] = useState<number | null>(null);
  const [activeChipId, setActiveChipId] = useState<string | null>(null);
  const [selectedFindingId, setSelectedFindingId] = useState<number | null>(null);
  const [expandedEvidence, setExpandedEvidence] = useState<Record<number, boolean>>({});

  // Finding resolved status
  const [findingStatuses, setFindingStatuses] = useState<Record<number, "ERROR" | "WARNING" | "OK">>({
    1: "ERROR",
    2: "ERROR",
    3: "ERROR",
    4: "WARNING",
    5: "OK",
    6: "OK",
  });

  // Zoom & Pan state
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, startPanX: 0, startPanY: 0 });
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Staggered ticks on State 1 mount
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

  // State 2 Analysing (~6s)
  useEffect(() => {
    if (step !== 2) return;
    setStatusIndex(0);
    setRunningTicks(0);

    const s1 = setTimeout(() => setStatusIndex(1), 1200);
    const s2 = setTimeout(() => setStatusIndex(2), 2400);
    const s3 = setTimeout(() => setStatusIndex(3), 3600);
    const s4 = setTimeout(() => setStatusIndex(4), 4800);

    const r1 = setTimeout(() => setRunningTicks(1), 700);
    const r2 = setTimeout(() => setRunningTicks(2), 1700);
    const r3 = setTimeout(() => setRunningTicks(3), 2700);
    const r4 = setTimeout(() => setRunningTicks(4), 3700);
    const r5 = setTimeout(() => setRunningTicks(5), 4700);

    const finish = setTimeout(() => {
      setStep(3);
    }, 6000);

    return () => {
      clearTimeout(s1);
      clearTimeout(s2);
      clearTimeout(s3);
      clearTimeout(s4);
      clearTimeout(r1);
      clearTimeout(r2);
      clearTimeout(r3);
      clearTimeout(r4);
      clearTimeout(r5);
      clearTimeout(finish);
    };
  }, [step]);

  // Reset zoom back to Fit (100%)
  const resetZoom = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    setSelectedFindingId(null);
    setActiveChipId(null);
  };

  // Keyboard navigation: Esc resets zoom & selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        resetZoom();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Zoom to a specific chip callout (≈220% deep zoom)
  const zoomToChip = (chip: EvidenceChip, findingId: number) => {
    setSelectedFindingId(findingId);
    setActiveChipId(chip.id);

    const targetScale = 2.2; // 220% deep zoom
    setScale(targetScale);

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const targetX = (chip.zoomCenter.x / 100) * rect.width;
      const targetY = (chip.zoomCenter.y / 100) * rect.height;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      setPan({
        x: (centerX - targetX) * (targetScale - 1),
        y: (centerY - targetY) * (targetScale - 1),
      });
    }

    const cardEl = cardRefs.current[findingId];
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  // Zoom to finding's first chip (≈160% zoom)
  const zoomToFinding = (finding: GdtFinding) => {
    if (selectedFindingId === finding.id && !activeChipId) {
      resetZoom();
      return;
    }

    setSelectedFindingId(finding.id);
    const firstChip = finding.chips[0];
    if (firstChip) {
      setActiveChipId(firstChip.id);
      const targetScale = 1.6; // 160%
      setScale(targetScale);

      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const targetX = (firstChip.zoomCenter.x / 100) * rect.width;
        const targetY = (firstChip.zoomCenter.y / 100) * rect.height;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        setPan({
          x: (centerX - targetX) * (targetScale - 1),
          y: (centerY - targetY) * (targetScale - 1),
        });
      }
    }

    const cardEl = cardRefs.current[finding.id];
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  // Step zoom by ±25%
  const adjustZoom = (delta: number) => {
    setScale((prev) => {
      const next = Math.round((prev + delta) * 100) / 100;
      return Math.min(4.0, Math.max(1.0, next));
    });
  };

  // Drag pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    setPan({
      x: panStartRef.current.startPanX + dx,
      y: panStartRef.current.startPanY + dy,
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Sample drawing helper
  const handleUseSample = () => {
    setSelectedFile({
      name: "GDT-PROBE-450.png",
      size: "1.4 MB",
    });
  };

  // Mark resolved handler
  const handleResolve = (findingId: number) => {
    setFindingStatuses((prev) => ({
      ...prev,
      [findingId]: "OK",
    }));
  };

  // Count open issues
  const errorCount = Object.values(findingStatuses).filter((s) => s === "ERROR").length;
  const warningCount = Object.values(findingStatuses).filter((s) => s === "WARNING").length;
  const okCount = Object.values(findingStatuses).filter((s) => s === "OK").length;

  // Active highlighted target chip
  // Priority: activeChipId -> finding's first chip if hovered or selected
  const activeFinding = GDT_FINDINGS.find((f) => f.id === (activeFindingId || selectedFindingId));
  const highlightedChip =
    GDT_FINDINGS.flatMap((f) => f.chips).find((c) => c.id === activeChipId) ||
    activeFinding?.chips[0];

  // =========================================================================
  // STATE 1: SETUP
  // =========================================================================
  if (step === 1) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-8 sm:py-12 bg-graphpaper">
        <div className="max-w-[720px] mx-auto space-y-6 sm:space-y-8 animate-slide-up">
          {/* Header */}
          <div className="text-center space-y-2.5">
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-[#101418] tracking-tight">
              Do these tolerances actually work together?
            </h1>
            <p className="font-sans text-[14px] sm:text-[15px] text-[#3C4356] leading-relaxed max-w-xl mx-auto">
              Upload a drawing — Manufy checks every GD&T symbol, datum and tolerance against
              ASME Y14.5 and the Machinery&apos;s Handbook, and points at the exact callout behind every issue.
            </p>
          </div>

          {/* Dropzone Sheet */}
          <div className="bg-[#FFFBF0] border-2 border-[#101418] rounded-[14px] p-5 shadow-hard space-y-3">
            <div className="flex items-center justify-between pb-1">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#101418]">
                DRAWING SET / CAD PRINT
              </span>
              <span className="font-mono text-[10px] text-[#101418]/50">.PDF / .PNG</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f)
                  setSelectedFile({
                    name: f.name,
                    size: `${Math.round(f.size / 1024)} KB`,
                  });
              }}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#101418]/30 hover:border-[#1E43D8] rounded-[10px] p-6 text-center bg-white/60 cursor-pointer transition-all flex flex-col items-center justify-center min-h-[130px] group"
            >
              {selectedFile ? (
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 bg-[#E8EEFC] border border-[#101418] px-3 py-1.5 rounded-full text-xs font-mono font-semibold text-[#1E43D8]">
                    <FileText className="w-4 h-4" />
                    <span>{selectedFile.name}</span>
                    <span className="text-[#101418]/50">· {selectedFile.size}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                      className="hover:text-[#D92D20] ml-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="font-sans text-[11.5px] text-[#1E9E6A] font-medium flex items-center justify-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Drawing ready for GD&T audit
                  </div>
                </div>
              ) : (
                <div className="space-y-1 text-[#101418]/70 group-hover:text-[#101418]">
                  <UploadCloud className="w-7 h-7 mx-auto text-[#1E43D8]" />
                  <div className="font-sans text-xs font-semibold">
                    Drop drawing file here (.pdf, .png)
                  </div>
                  <div className="font-mono text-[10px] text-[#101418]/50">or click to browse</div>
                </div>
              )}
            </div>

            {/* Sample link */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={handleUseSample}
                className="font-mono text-xs font-semibold text-[#1E43D8] hover:text-[#101418] underline underline-offset-4 cursor-pointer transition-colors"
              >
                Use the sample drawing (GDT-PROBE-450.png)
              </button>
            </div>
          </div>

          {/* Drawing-type chips */}
          <div className="space-y-2">
            <div className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-[#101418]/70">
              FEATURE SCHEME CLASSIFICATION
            </div>
            <div className="flex flex-wrap gap-2">
              {DRAWING_TYPES.map((type) => {
                const isSelected = selectedDrawingType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedDrawingType(type)}
                    className={`px-3 py-1.5 rounded-full text-xs font-sans font-medium transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#E8EEFC] border-[1.5px] border-[#101418] text-[#1E43D8] font-bold shadow-2xs"
                        : "bg-white border border-[#101418]/25 text-[#101418]/70 hover:bg-[#E8EEFC]/40"
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* What gets checked sheet */}
          <div className="bg-[#FFFBF0] border-2 border-[#101418] rounded-[14px] p-4 sm:p-5 shadow-hard space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#101418]/15">
              <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[#101418]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1E43D8]" />
                <span>WHAT GETS CHECKED</span>
              </div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FFF3C4] border border-[#101418]/25 text-[#101418]">
                5 ACTIVE AUDIT ENGINES
              </span>
            </div>

            <div className="space-y-2">
              {CHECKLIST_ROWS.map((task, i) => {
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

          {/* Action button */}
          <div className="flex justify-center pt-2">
            <button
              type="button"
              disabled={!selectedFile}
              onClick={() => setStep(2)}
              className={`w-full sm:w-auto px-8 py-3 rounded-[10px] font-sans font-semibold text-[15px] flex items-center justify-center gap-2 transition-all ${
                selectedFile
                  ? "btn-royal cursor-pointer"
                  : "bg-gray-200 text-gray-500 border-2 border-[#101418]/20 cursor-not-allowed"
              }`}
            >
              <span>▶ Run GD&T review</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STATE 2: ANALYSING (~6s)
  // =========================================================================
  if (step === 2) {
    return (
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[#FFFBF0] relative">
        {/* Left: Drawing sheet with sweeping blue scan line */}
        <div className="flex-1 flex items-center justify-center p-6 bg-graphpaper relative overflow-hidden">
          <div className="w-full max-w-[800px] bg-white border-2 border-[#101418] rounded-[14px] shadow-hard p-4 relative overflow-hidden animate-slide-up">
            <GdtDrawingSVG highlightedRegion={null} />

            {/* Sweeping 2px midblue scan line */}
            <div
              className="absolute left-0 right-0 h-[2px] bg-[#3E6BE0] z-20 pointer-events-none"
              style={{
                boxShadow: "0 0 16px 2px rgba(62, 107, 224, 0.9)",
                animation: "sweepScan 2.2s ease-in-out infinite alternate",
              }}
            />
          </div>
        </div>

        {/* Right Rail: Status cycling + check rows + counter */}
        <div className="w-full lg:w-[380px] border-t-2 lg:border-t-0 lg:border-l-2 border-[#101418] bg-[#FFFBF0] p-6 flex flex-col justify-between shrink-0 space-y-6">
          <div className="space-y-6">
            <div>
              <div className="font-mono text-[10px] font-bold text-[#1E43D8] uppercase tracking-widest pb-1">
                ANALYSIS IN PROGRESS
              </div>
              <h2 className="font-display font-bold text-2xl text-[#101418]">
                Auditing Geometric Standards
              </h2>
            </div>

            {/* Status cycling pill */}
            <div className="inline-flex items-center gap-2 bg-[#FFF3C4] border-[1.5px] border-[#101418] px-3.5 py-2 rounded-full font-mono text-[11.5px] font-bold text-[#101418] shadow-hard-xs w-full">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3E6BE0] animate-ping shrink-0" />
              <span className="truncate">{STATUS_LINES[statusIndex]}</span>
            </div>

            {/* Checks ticking */}
            <div className="bg-white border-2 border-[#101418] rounded-[12px] p-4 shadow-hard-xs space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-[#101418]/15 text-[10px] font-mono font-bold uppercase">
                <span>GD&T VERIFICATION SUITE</span>
                <span className="text-[#1E43D8]">{runningTicks} / 5</span>
              </div>
              {CHECKLIST_ROWS.map((task, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-sans text-[#101418]">
                  <div
                    className={`w-3.5 h-3.5 rounded-[3px] border border-[#101418] flex items-center justify-center shrink-0 ${
                      runningTicks > i ? "bg-[#1E43D8] text-white" : "bg-white text-transparent"
                    }`}
                  >
                    {runningTicks > i && <Check className="w-2.5 h-2.5" />}
                  </div>
                  <span className="truncate">{task}</span>
                </div>
              ))}
            </div>

            {/* Counter pill */}
            <div className="bg-[#E8EEFC] border-2 border-[#101418] rounded-[12px] p-3 text-center shadow-hard-xs">
              <div className="font-mono text-xl font-bold text-[#1E43D8]">84 EVENTS LOGGED</div>
              <div className="font-mono text-[10px] text-[#101418]/60 uppercase tracking-wider">
                Full ASME Y14.5 Tolerance Tree
              </div>
            </div>
          </div>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="font-mono text-xs font-semibold text-[#1E43D8] hover:underline cursor-pointer"
            >
              Skip to results →
            </button>
          </div>
        </div>

        <style jsx>{`
          @keyframes sweepScan {
            0% {
              top: 4%;
            }
            100% {
              top: 96%;
            }
          }
        `}</style>
      </div>
    );
  }

  // =========================================================================
  // STATE 3: RESULTS
  // =========================================================================
  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[#FFFBF0] relative">
      {/* =====================================================================
          LEFT: DRAWING CANVAS (flex-1) with Floating Zoom Control [−] [Fit] [+] [eye] [100%]
      ===================================================================== */}
      <div
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={resetZoom}
        className={`flex-1 overflow-hidden relative bg-graphpaper flex items-center justify-center select-none ${
          scale > 1 ? (isPanning ? "cursor-grabbing" : "cursor-grab") : "cursor-default"
        }`}
      >
        {/* Animated Pan + Zoom container */}
        <div
          className="relative max-w-[1040px] w-full p-4 transition-transform duration-450 ease-out"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          {/* Main Drawing Sheet Card */}
          <div className="bg-white border-2 border-[#101418] rounded-[14px] shadow-hard overflow-hidden relative">
            <GdtDrawingSVG highlightedRegion={highlightedChip?.region || null} />

            {/* Highlight Box around active evidence target callout */}
            {highlightedChip && (
              <div
                className="absolute pointer-events-none rounded-[4px] border-[2px] border-[#D92D20] bg-[#D92D20]/10 transition-all duration-80"
                style={{
                  left: `${highlightedChip.region.left}%`,
                  top: `${highlightedChip.region.top}%`,
                  width: `${highlightedChip.region.width}%`,
                  height: `${highlightedChip.region.height}%`,
                  boxShadow: "0 0 14px rgba(217, 45, 32, 0.4)",
                }}
              />
            )}

            {/* PINS: Absolute over canvas (Findings 1-4) */}
            {GDT_FINDINGS.filter((f) => f.pin).map((finding) => {
              const isSelected = selectedFindingId === finding.id;
              const isHovered = activeFindingId === finding.id;
              const status = findingStatuses[finding.id];
              const isResolved = status === "OK";
              const isWarning = status === "WARNING";

              return (
                <div
                  key={finding.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    zoomToFinding(finding);
                  }}
                  onMouseEnter={() => {
                    setActiveFindingId(finding.id);
                    if (finding.chips[0]) setActiveChipId(finding.chips[0].id);
                  }}
                  onMouseLeave={() => {
                    setActiveFindingId(null);
                    if (!selectedFindingId) setActiveChipId(null);
                  }}
                  className={`absolute z-30 cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all ${
                    isSelected || isHovered ? "scale-125 z-40" : "hover:scale-110"
                  }`}
                  style={{
                    left: `${finding.pin!.x}%`,
                    top: `${finding.pin!.y}%`,
                  }}
                >
                  <div
                    className={`w-[26px] h-[26px] rounded-full border-2 border-white ring-2 ring-[#101418] flex items-center justify-center font-sans font-bold text-[12px] shadow-hard-xs transition-colors ${
                      isResolved
                        ? "bg-[#1E9E6A] text-white"
                        : isWarning
                        ? "bg-[#FFC53D] text-[#101418]"
                        : "bg-[#D92D20] text-white"
                    }`}
                  >
                    {finding.id}
                  </div>

                  {(isSelected || isHovered) && (
                    <div className="absolute inset-0 rounded-full ring-4 ring-[#D92D20]/40 animate-ping pointer-events-none" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Floating Zoom Controls: Bottom-Left [−] [Fit] [+] [eye] [100%] */}
        <div className="absolute bottom-5 left-5 z-30 bg-[#FFFBF0] border-2 border-[#101418] rounded-full px-3.5 py-1.5 shadow-hard-xs flex items-center gap-2 font-mono text-xs select-none">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              adjustZoom(-0.25);
            }}
            title="Zoom Out (−25%)"
            className="w-6 h-6 rounded-full hover:bg-[#E8EEFC] flex items-center justify-center font-bold text-[#101418] cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              resetZoom();
            }}
            title="Fit to screen"
            className="px-2 py-0.5 rounded-full hover:bg-[#E8EEFC] font-semibold text-[#101418] cursor-pointer"
          >
            Fit
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              adjustZoom(0.25);
            }}
            title="Zoom In (+25%)"
            className="w-6 h-6 rounded-full hover:bg-[#E8EEFC] flex items-center justify-center font-bold text-[#101418] cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-[#101418]/25" />

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              resetZoom();
            }}
            title="Reset to 100%"
            className="w-6 h-6 rounded-full hover:bg-[#E8EEFC] flex items-center justify-center text-[#101418] cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          <span className="font-bold text-[#101418] min-w-[44px] text-right">
            {Math.round(scale * 100)}%
          </span>
        </div>
      </div>

      {/* =====================================================================
          RIGHT PANEL (400px): Header, Action Buttons, Tabs & Findings Feed
      ===================================================================== */}
      <aside className="w-full lg:w-[400px] shrink-0 border-t-2 lg:border-t-0 lg:border-l-2 border-[#101418] bg-[#FFFBF0] flex flex-col h-full overflow-hidden">
        {/* Panel Header */}
        <div className="p-4 border-b-2 border-[#101418] bg-[#FFFBF0] shrink-0 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-xl text-[#101418]">
              Inspection results
            </h2>
            <span className="inline-flex items-center gap-1.5 bg-[#E6F4EA] border border-[#1E9E6A]/30 text-[#1E9E6A] font-mono text-[10.5px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1E9E6A]" />
              <span>Complete</span>
            </span>
          </div>

          <div className="font-sans text-xs text-[#3C4356]">
            GDT-PROBE-450 · GD&T Intelligence
          </div>

          {/* Buttons Row: Export report (black pill), Re-run, New review */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <button
              type="button"
              className="bg-[#101418] hover:bg-[#101418]/85 text-white font-sans text-xs font-semibold px-3 py-1 rounded-full shadow-2xs transition-colors cursor-pointer"
            >
              Export report
            </button>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="bg-white hover:bg-[#E8EEFC] border-[1.5px] border-[#101418] text-[#101418] font-sans text-xs font-semibold px-2.5 py-1 rounded-full shadow-2xs transition-colors cursor-pointer"
            >
              Re-run
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                resetZoom();
              }}
              className="bg-white hover:bg-[#E8EEFC] border-[1.5px] border-[#101418] text-[#101418] font-sans text-xs font-semibold px-2.5 py-1 rounded-full shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>New review</span>
            </button>
          </div>
        </div>

        {/* Tab Bar: Checks 6 / Activity 84 / Verdict */}
        <div className="flex border-b-2 border-[#101418] bg-[#FBF6E9] shrink-0">
          {[
            { id: "checks", label: "Checks 6" },
            { id: "activity", label: "Activity 84" },
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

        {/* TAB 1: CHECKS FEED */}
        {activeTab === "checks" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Counts Line: 6 CHECKS · 3 ERRORS · 1 WARNING · 2 OK */}
            <div className="px-4 py-2 bg-[#FBF6E9] border-b border-[#101418]/15 flex items-center justify-between font-mono text-[10.5px] font-semibold shrink-0 flex-wrap gap-1">
              <span className="text-[#101418]/70">6 CHECKS</span>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-[#FDECEA] border border-[#D92D20]/40 text-[#D92D20] font-bold">
                  {errorCount} ERRORS
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#FFF3C4] border border-[#101418]/25 text-[#101418] font-bold">
                  {warningCount} WARNING
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#E6F4EA] border border-[#1E9E6A]/30 text-[#1E9E6A] font-bold">
                  {okCount} OK
                </span>
              </div>
            </div>

            {/* Findings Cards List */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
              {GDT_FINDINGS.map((finding) => {
                const isSelected = selectedFindingId === finding.id;
                const isHovered = activeFindingId === finding.id;
                const isExpanded = !!expandedEvidence[finding.id];
                const status = findingStatuses[finding.id];

                return (
                  <div
                    key={finding.id}
                    ref={(el) => {
                      cardRefs.current[finding.id] = el;
                    }}
                    onClick={() => zoomToFinding(finding)}
                    onMouseEnter={() => {
                      setActiveFindingId(finding.id);
                      if (finding.chips[0]) setActiveChipId(finding.chips[0].id);
                    }}
                    onMouseLeave={() => {
                      setActiveFindingId(null);
                      if (!selectedFindingId) setActiveChipId(null);
                    }}
                    className={`rounded-[12px] p-3.5 space-y-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#E8EEFC] border-2 border-[#101418] ring-2 ring-[#101418] shadow-hard-xs"
                        : isHovered
                        ? "bg-[#E8EEFC]/50 border-2 border-[#101418] shadow-2xs"
                        : "bg-white border-2 border-[#101418] shadow-2xs hover:bg-[#F8FAFC]"
                    }`}
                  >
                    {/* Header: Number disc, Status Pill */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[11px] font-bold text-white shrink-0 ${
                            status === "OK"
                              ? "bg-[#1E9E6A]"
                              : status === "WARNING"
                              ? "bg-[#FFC53D] text-[#101418]"
                              : "bg-[#D92D20]"
                          }`}
                        >
                          {finding.id}
                        </div>

                        {/* Status Pill */}
                        {status === "ERROR" ? (
                          <span className="inline-flex items-center gap-1 bg-[#D92D20] text-white px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase">
                            <span>⊗ ERROR</span>
                          </span>
                        ) : status === "WARNING" ? (
                          <span className="inline-flex items-center gap-1 bg-[#FFC53D] border border-[#101418]/25 text-[#101418] px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase">
                            <span>⚠ WARNING</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-[#E6F4EA] border border-[#1E9E6A]/30 text-[#1E9E6A] px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase">
                            <span>✓ OK</span>
                          </span>
                        )}
                      </div>

                      {finding.type !== "OK" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResolve(finding.id);
                          }}
                          className="font-mono text-[10px] font-bold text-[#1E9E6A] hover:underline cursor-pointer"
                        >
                          Mark resolved
                        </button>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-sans font-bold text-[13px] text-[#101418] leading-snug">
                      {finding.title}
                    </h3>

                    {/* Body */}
                    <p className="font-sans text-[12px] text-[#3C4356] leading-relaxed">
                      {finding.body}
                    </p>

                    {/* Butter Recommended correction Box */}
                    {finding.correction && (
                      <div className="bg-[#FFF3C4] border border-[#101418]/20 rounded-lg p-2.5 space-y-0.5">
                        <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#101418]">
                          RECOMMENDED CORRECTION:
                        </div>
                        <div className="font-sans text-[11.5px] text-[#101418] leading-snug">
                          {finding.correction}
                        </div>
                      </div>
                    )}

                    {/* EVIDENCE CHIP ROW (Numbered chips) */}
                    <div className="space-y-1">
                      <div className="font-mono text-[10px] font-bold text-[#101418]/60 uppercase tracking-wider">
                        EVIDENCE CITATIONS:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {finding.chips.map((chip) => {
                          const isChipActive = activeChipId === chip.id;
                          return (
                            <button
                              key={chip.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                zoomToChip(chip, finding.id);
                              }}
                              onMouseEnter={(e) => {
                                e.stopPropagation();
                                setActiveChipId(chip.id);
                              }}
                              className={`px-2 py-1 rounded-md font-mono text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer border ${
                                isChipActive
                                  ? "bg-[#E8EEFC] border-[#1E43D8] text-[#1E43D8] shadow-2xs font-bold scale-105"
                                  : "bg-white border-[#101418]/20 text-[#101418]/80 hover:bg-[#E8EEFC]/50 hover:text-[#101418]"
                              }`}
                            >
                              <span>{chip.label}</span>
                              <span className="text-[10px] opacity-70">{chip.chipNum}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Collapsible Evidence and reasoning */}
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
                        <div className="mt-1.5 pl-3 border-l-2 border-[#1E43D8]/50 font-sans text-xs text-[#3C4356] leading-relaxed animate-slide-up">
                          {finding.evidenceReasoning}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: ACTIVITY 84 */}
        {activeTab === "activity" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 animate-slide-up">
            <div className="font-mono text-xs font-bold uppercase text-[#101418]/60 pb-1">
              ENGINE EXECUTION LOG (84 EVENTS)
            </div>
            {ACTIVITY_LOGS.map((log, idx) => (
              <div
                key={idx}
                className="bg-white border border-[#101418]/20 rounded-lg p-2.5 text-xs font-mono flex items-start gap-2 shadow-2xs"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#1E43D8] mt-1.5 shrink-0" />
                <span className="text-[#101418]">{log}</span>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: VERDICT */}
        {activeTab === "verdict" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 animate-slide-up">
            <div className="bg-white border-2 border-[#101418] rounded-xl p-4 space-y-3.5 shadow-hard-xs">
              <div className="bg-[#D92D20] text-white px-3 py-2 rounded-lg font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>NOT READY FOR RELEASE — 3 ERRORS</span>
              </div>

              <div className="space-y-2 text-xs font-sans text-[#101418]">
                <div className="p-2 bg-[#FDECEA] rounded border border-[#D92D20]/20 font-medium">
                  1. Datum precedence conflict: Front view specifies B A C while top view specifies C A B.
                </div>
                <div className="p-2 bg-[#FDECEA] rounded border border-[#D92D20]/20 font-medium">
                  2. Virtual condition interference: Ø.240 pin VC (.250) exceeds mating bore VC (.243).
                </div>
                <div className="p-2 bg-[#FDECEA] rounded border border-[#D92D20]/20 font-medium">
                  3. Duplicate edge radius leaders: R.03 contradicts 4X R.062 callout.
                </div>
              </div>

              <button
                type="button"
                className="btn-royal w-full py-2.5 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Export review PDF
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

// ===========================================================================
// INLINE DRAWING SVG: GDT-PROBE-450 CONTACT PROBE
// Spec: viewBox 0 0 1200 860, white sheet, 1.5px ink border, zone ticks
// Note: Per user prompt, front view has "B | A | C", top view has "C | A | B",
// and both "R.03" and "4X R.062" are present.
// ===========================================================================
function GdtDrawingSVG({
  highlightedRegion,
}: {
  highlightedRegion: { left: number; top: number; width: number; height: number } | null;
}) {
  return (
    <svg
      viewBox="0 0 1200 860"
      className="w-full h-auto text-[#101418] select-none bg-white"
      fill="none"
      stroke="#101418"
    >
      {/* Outer Sheet Border 1.5px */}
      <rect x="15" y="15" width="1170" height="830" strokeWidth="1.5" stroke="#101418" />
      <rect x="25" y="25" width="1150" height="810" strokeWidth="1" stroke="#101418" />

      {/* Zone ticks 1-8 across top & bottom */}
      {[1, 2, 3, 4, 5, 6, 7, 8].map((z, i) => {
        const x = 50 + i * 140;
        return (
          <g key={i}>
            <line x1={x} y1="15" x2={x} y2="25" strokeWidth="1" />
            <line x1={x} y1="835" x2={x} y2="845" strokeWidth="1" />
            <text x={x + 70} y="22" fontSize="9" fontFamily="monospace" textAnchor="middle" stroke="none" fill="#101418">
              {z}
            </text>
            <text x={x + 70} y="842" fontSize="9" fontFamily="monospace" textAnchor="middle" stroke="none" fill="#101418">
              {z}
            </text>
          </g>
        );
      })}

      {/* Zone ticks A-D down left & right */}
      {["A", "B", "C", "D"].map((l, i) => {
        const y = 50 + i * 190;
        return (
          <g key={i}>
            <line x1="15" y1={y} x2="25" y2={y} strokeWidth="1" />
            <line x1="1165" y1={y} x2="1175" y2={y} strokeWidth="1" />
            <text x="21" y={y + 95} fontSize="9" fontFamily="monospace" textAnchor="middle" stroke="none" fill="#101418">
              {l}
            </text>
            <text x="1171" y={y + 95} fontSize="9" fontFamily="monospace" textAnchor="middle" stroke="none" fill="#101418">
              {l}
            </text>
          </g>
        );
      })}

      {/* =======================================================================
          1. ISOMETRIC VIEW (x≈90, y≈70, 300×190)
          Block with top bore and long pin tapering to a point
      ======================================================================= */}
      <g id="isometric-view" strokeWidth="1.5">
        {/* Isometric Block Faces */}
        {/* Top Face */}
        <polygon points="170,110 240,75 310,110 240,145" fill="none" />
        {/* Left Face */}
        <polygon points="170,110 240,145 240,215 170,180" fill="none" />
        {/* Right Face */}
        <polygon points="240,145 310,110 310,180 240,215" fill="none" />

        {/* Bore on Top Face (Ellipse Pair) */}
        <ellipse cx="240" cy="110" rx="26" ry="14" strokeWidth="1.4" />
        <ellipse cx="240" cy="114" rx="20" ry="10" strokeWidth="1.1" strokeDasharray="3 2" />

        {/* Long Pin shaft extending from Right Face angled up-right */}
        <polygon points="310,145 420,110 420,122 310,157" fill="none" strokeWidth="1.5" />
        {/* Tapered Pin Point */}
        <polygon points="420,110 448,116 420,122" fill="none" strokeWidth="1.5" />
      </g>

      {/* =======================================================================
          2. FRONT VIEW (x≈90, y≈330, 300×300)
          Square with R.06 corner radii, center thread bore, control frame B A C
      ======================================================================= */}
      <g id="front-view">
        {/* Square outline with R.06 corner radii */}
        <rect x="90" y="330" width="180" height="180" rx="14" strokeWidth="2" fill="none" />

        {/* Centered thread circle (r 62) + minor-dia circle (r 48) */}
        <circle cx="180" cy="420" r="62" strokeWidth="1.4" strokeDasharray="5 3" />
        <circle cx="180" cy="420" r="48" strokeWidth="1.8" />
        {/* Center Crosshair */}
        <line x1="95" y1="420" x2="265" y2="420" strokeWidth="1" strokeDasharray="8 3 2 3" stroke="#1E43D8" />
        <line x1="180" y1="335" x2="180" y2="505" strokeWidth="1" strokeDasharray="8 3 2 3" stroke="#1E43D8" />

        {/* Dimensions */}
        {/* .375 (left, to center) */}
        <line x1="60" y1="330" x2="60" y2="420" strokeWidth="0.9" />
        <line x1="55" y1="330" x2="90" y2="330" strokeWidth="0.8" />
        <line x1="55" y1="420" x2="180" y2="420" strokeWidth="0.8" />
        <text x="50" y="380" fontSize="10.5" fontFamily="monospace" textAnchor="end" stroke="none" fill="#101418">
          .375
        </text>

        {/* .500 (top, to center) */}
        <line x1="90" y1="305" x2="180" y2="305" strokeWidth="0.9" />
        <line x1="90" y1="300" x2="90" y2="330" strokeWidth="0.8" />
        <line x1="180" y1="300" x2="180" y2="330" strokeWidth="0.8" />
        <text x="135" y="298" fontSize="10.5" fontFamily="monospace" textAnchor="middle" stroke="none" fill="#101418">
          .500
        </text>

        {/* .781 (right, overall) */}
        <line x1="285" y1="330" x2="285" y2="510" strokeWidth="0.9" />
        <line x1="270" y1="330" x2="290" y2="330" strokeWidth="0.8" />
        <line x1="270" y1="510" x2="290" y2="510" strokeWidth="0.8" />
        <text x="296" y="425" fontSize="10.5" fontFamily="monospace" textAnchor="start" stroke="none" fill="#101418">
          .781
        </text>

        {/* Leader to corner: "4X R.06" */}
        <line x1="105" y1="340" x2="70" y2="310" strokeWidth="1" />
        <line x1="70" y1="310" x2="30" y2="310" strokeWidth="1" />
        <text x="30" y="304" fontSize="10" fontFamily="monospace" stroke="none" fill="#101418">
          4X R.06
        </text>

        {/* CALLOUTS RIGHT OF VIEW (F1-1, F1-3, F1-4) */}
        <g transform="translate(320, 395)">
          {/* Thread designation: 3/8-24 UNF - 2B (F1-1) */}
          <line x1="-80" y1="25" x2="10" y2="-10" strokeWidth="1.2" />
          <line x1="10" y1="-10" x2="160" y2="-10" strokeWidth="1.2" />
          <text x="15" y="-16" fontSize="11" fontFamily="monospace" fontWeight="bold" stroke="none" fill="#101418">
            3/8-24 UNF - 2B
          </text>

          {/* Feature Control Frame: ⌖ | Ø.007 Ⓜ | B | A | C (F1-3) */}
          <g transform="translate(10, 0)">
            <rect x="0" y="0" width="168" height="26" strokeWidth="1.5" fill="none" />
            <line x1="28" y1="0" x2="28" y2="26" strokeWidth="1.2" />
            <line x1="96" y1="0" x2="96" y2="26" strokeWidth="1.2" />
            <line x1="120" y1="0" x2="120" y2="26" strokeWidth="1.2" />
            <line x1="144" y1="0" x2="144" y2="26" strokeWidth="1.2" />

            <text x="14" y="18" fontSize="14" fontFamily="monospace" fontWeight="bold" textAnchor="middle" stroke="none" fill="#101418">
              ⌖
            </text>
            <text x="62" y="17" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle" stroke="none" fill="#101418">
              Ø.007 Ⓜ
            </text>
            <text x="108" y="17" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle" stroke="none" fill="#101418">
              B
            </text>
            <text x="132" y="17" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle" stroke="none" fill="#101418">
              A
            </text>
            <text x="156" y="17" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle" stroke="none" fill="#101418">
              C
            </text>
          </g>

          {/* MINOR DIA Text (F1-4) */}
          <text x="15" y="44" fontSize="10.5" fontFamily="monospace" fontWeight="bold" stroke="none" fill="#101418">
            MINOR DIA
          </text>
        </g>
      </g>

      {/* =======================================================================
          3. TOP VIEW (x≈450, y≈90, 470×290)
          Long plate, Ø.500 bore, datum flags, control frame C A B (conflict!)
      ======================================================================= */}
      <g id="top-view">
        {/* Main plate outline */}
        <rect x="490" y="85" width="280" height="175" rx="14" strokeWidth="2" fill="none" />

        {/* Pin extending rightwards */}
        <rect x="770" y="152" width="280" height="42" strokeWidth="1.8" fill="none" />
        <polygon points="1050,152 1085,173 1050,194" strokeWidth="1.8" fill="none" />

        {/* Large Bore right of center = Ø.500 */}
        <circle cx="680" cy="172" r="44" strokeWidth="1.8" />
        <line x1="610" y1="172" x2="750" y2="172" strokeWidth="1" strokeDasharray="8 3 2 3" stroke="#1E43D8" />
        <line x1="680" y1="110" x2="680" y2="235" strokeWidth="1" strokeDasharray="8 3 2 3" stroke="#1E43D8" />

        {/* Dashed hidden lines running horizontally (bore + thread) */}
        <line x1="490" y1="145" x2="636" y2="145" strokeWidth="1.2" strokeDasharray="4 2" />
        <line x1="490" y1="200" x2="636" y2="200" strokeWidth="1.2" strokeDasharray="4 2" />

        {/* Dims: .750 overall left */}
        <line x1="465" y1="85" x2="465" y2="260" strokeWidth="0.9" />
        <text x="455" y="176" fontSize="10.5" fontFamily="monospace" textAnchor="end" stroke="none" fill="#101418">
          .750
        </text>

        {/* .375 boxed basic (to bore center) */}
        <line x1="490" y1="60" x2="680" y2="60" strokeWidth="0.9" />
        <rect x="560" y="48" width="48" height="20" strokeWidth="1" fill="none" />
        <text x="584" y="62" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle" stroke="none" fill="#101418">
          .375
        </text>

        {/* .583 (right, to bore center) (F1-2) */}
        <line x1="680" y1="60" x2="770" y2="60" strokeWidth="0.9" />
        <text x="725" y="55" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle" stroke="none" fill="#101418">
          .583
        </text>

        {/* Datum Flags */}
        {/* Datum A under bottom edge */}
        <g transform="translate(540, 260)">
          <polygon points="0,0 6,10 -6,10" fill="#101418" />
          <line x1="0" y1="10" x2="0" y2="22" strokeWidth="1.2" />
          <rect x="-10" y="22" width="20" height="20" strokeWidth="1.5" fill="#FFFBF0" />
          <text x="0" y="37" fontSize="12" fontFamily="monospace" fontWeight="bold" textAnchor="middle" stroke="none" fill="#101418">
            A
          </text>
        </g>

        {/* Datum B at right face */}
        <g transform="translate(770, 115)">
          <polygon points="0,0 10,-6 10,6" fill="#101418" />
          <line x1="10" y1="0" x2="22" y2="0" strokeWidth="1.2" />
          <rect x="22" y="-10" width="20" height="20" strokeWidth="1.5" fill="#FFFBF0" />
          <text x="32" y="5" fontSize="12" fontFamily="monospace" fontWeight="bold" textAnchor="middle" stroke="none" fill="#101418">
            B
          </text>
        </g>

        {/* Datum C at far end */}
        <g transform="translate(490, 115)">
          <polygon points="0,0 -10,-6 -10,6" fill="#101418" />
          <line x1="-10" y1="0" x2="-22" y2="0" strokeWidth="1.2" />
          <rect x="-42" y="-10" width="20" height="20" strokeWidth="1.5" fill="#FFFBF0" />
          <text x="-32" y="5" fontSize="12" fontFamily="monospace" fontWeight="bold" textAnchor="middle" stroke="none" fill="#101418">
            C
          </text>
        </g>

        {/* CALLOUTS TOP-RIGHT: 4X R.062, R.03 (conflict!), Ø.500, control frame C A B */}
        {/* 4X R.062 (F3-2) */}
        <line x1="755" y1="95" x2="810" y2="40" strokeWidth="1.2" />
        <line x1="810" y1="40" x2="880" y2="40" strokeWidth="1.2" />
        <text x="815" y="34" fontSize="11" fontFamily="monospace" fontWeight="bold" stroke="none" fill="#101418">
          4X R.062
        </text>

        {/* R.03 (second leader to the SAME corner — planted conflict, F3-1) */}
        <line x1="760" y1="100" x2="820" y2="65" strokeWidth="1.2" />
        <line x1="820" y1="65" x2="870" y2="65" strokeWidth="1.2" />
        <text x="825" y="59" fontSize="11" fontFamily="monospace" fontWeight="bold" stroke="none" fill="#101418">
          R.03
        </text>

        {/* Bore callout: Ø.500 +.005/−.000 (F5-2) */}
        <line x1="710" y1="150" x2="810" y2="120" strokeWidth="1.2" />
        <line x1="810" y1="120" x2="940" y2="120" strokeWidth="1.2" />
        <text x="815" y="114" fontSize="11" fontFamily="monospace" fontWeight="bold" stroke="none" fill="#101418">
          Ø.500 +.005/−.000
        </text>

        {/* Control Frame: ⌖ | Ø.007 Ⓜ | C | A | B (CONFLICT vs B A C!) */}
        <g transform="translate(810, 130)">
          <rect x="0" y="0" width="168" height="26" strokeWidth="1.5" fill="none" />
          <line x1="28" y1="0" x2="28" y2="26" strokeWidth="1.2" />
          <line x1="96" y1="0" x2="96" y2="26" strokeWidth="1.2" />
          <line x1="120" y1="0" x2="120" y2="26" strokeWidth="1.2" />
          <line x1="144" y1="0" x2="144" y2="26" strokeWidth="1.2" />

          <text x="14" y="18" fontSize="14" fontFamily="monospace" fontWeight="bold" textAnchor="middle" stroke="none" fill="#101418">
            ⌖
          </text>
          <text x="62" y="17" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle" stroke="none" fill="#101418">
            Ø.007 Ⓜ
          </text>
          <text x="108" y="17" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle" stroke="none" fill="#101418">
            C
          </text>
          <text x="132" y="17" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle" stroke="none" fill="#101418">
            A
          </text>
          <text x="156" y="17" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle" stroke="none" fill="#101418">
            B
          </text>
        </g>
        <text x="815" y="174" fontSize="9.5" fontFamily="monospace" stroke="none" fill="#101418">
          3/8-24 UNF - 2B · MINOR DIA
        </text>
      </g>

      {/* =======================================================================
          4. SECTION A-A (x≈450, y≈480, 660×180)
          Hatched block, stepped threaded bore, pin shaft Ø.240, 40° tip
      ======================================================================= */}
      <g id="section-view">
        {/* Block Cross-Section with 45° Hatching */}
        <rect x="490" y="480" width="200" height="150" strokeWidth="2" fill="none" />

        {/* Stepped bore cavity */}
        <polygon points="490,520 560,520 560,610 630,610 630,480 670,480 670,630 490,630" fill="#FFFBF0" stroke="none" />
        <polyline points="490,520 560,520 560,610 630,610 630,480" strokeWidth="1.8" />
        {/* Thread triangle ticks */}
        {[0, 1, 2, 3, 4, 5].map((idx) => (
          <polygon key={idx} points={`490,${525 + idx * 8} 498,${529 + idx * 8} 490,${533 + idx * 8}`} fill="#101418" />
        ))}

        {/* 45° Hatch Lines across solid block material */}
        <g strokeWidth="0.8" stroke="#101418" opacity="0.45">
          <line x1="500" y1="480" x2="550" y2="520" />
          <line x1="520" y1="480" x2="560" y2="515" />
          <line x1="540" y1="480" x2="560" y2="498" />
          <line x1="640" y1="480" x2="690" y2="530" />
          <line x1="660" y1="480" x2="690" y2="510" />
          <line x1="490" y1="580" x2="540" y2="630" />
          <line x1="490" y1="600" x2="520" y2="630" />
          <line x1="570" y1="610" x2="590" y2="630" />
          <line x1="600" y1="610" x2="620" y2="630" />
          <line x1="640" y1="580" x2="690" y2="630" />
        </g>

        {/* Long Pin Shaft extending from block */}
        <polygon points="690,535 1060,535 1060,575 690,575" strokeWidth="2" fill="none" />
        {/* 40° Pointed Tip (F4-1) */}
        <polygon points="1060,535 1105,555 1060,575" strokeWidth="2" fill="none" />
        {/* 40° dimension */}
        <line x1="1075" y1="542" x2="1090" y2="525" strokeWidth="0.9" />
        <line x1="1075" y1="568" x2="1090" y2="585" strokeWidth="0.9" />
        <text x="1098" y="559" fontSize="12" fontFamily="monospace" fontWeight="bold" stroke="none" fill="#101418">
          40°
        </text>

        {/* Dimensions above: 3.00 overall (F2-3), .950 block */}
        <line x1="490" y1="450" x2="1105" y2="450" strokeWidth="1" />
        <line x1="490" y1="440" x2="490" y2="475" strokeWidth="0.8" />
        <line x1="1105" y1="440" x2="1105" y2="550" strokeWidth="0.8" />
        <text x="797" y="442" fontSize="12" fontFamily="monospace" fontWeight="bold" textAnchor="middle" stroke="none" fill="#101418">
          3.00
        </text>

        <line x1="490" y1="470" x2="690" y2="470" strokeWidth="1" />
        <text x="590" y="465" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle" stroke="none" fill="#101418">
          .950
        </text>

        {/* SECTION A-A Label */}
        <text x="580" y="660" fontSize="13" fontFamily="monospace" fontWeight="bold" textAnchor="middle" stroke="none" fill="#101418">
          SECTION A-A
        </text>

        {/* Pin Annotation: Ø.240 (F2-1) with frame ⌖ | Ø.010 Ⓜ | B | A | C (F2-2) */}
        <g transform="translate(730, 585)">
          <line x1="40" y1="-20" x2="0" y2="15" strokeWidth="1.2" />
          <line x1="0" y1="15" x2="168" y2="15" strokeWidth="1.2" />
          <text x="10" y="10" fontSize="11" fontFamily="monospace" fontWeight="bold" stroke="none" fill="#101418">
            Ø.240
          </text>

          <g transform="translate(0, 22)">
            <rect x="0" y="0" width="168" height="26" strokeWidth="1.5" fill="none" />
            <line x1="28" y1="0" x2="28" y2="26" strokeWidth="1.2" />
            <line x1="96" y1="0" x2="96" y2="26" strokeWidth="1.2" />
            <line x1="120" y1="0" x2="120" y2="26" strokeWidth="1.2" />
            <line x1="144" y1="0" x2="144" y2="26" strokeWidth="1.2" />

            <text x="14" y="18" fontSize="14" fontFamily="monospace" fontWeight="bold" textAnchor="middle" stroke="none" fill="#101418">
              ⌖
            </text>
            <text x="62" y="17" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle" stroke="none" fill="#101418">
              Ø.010 Ⓜ
            </text>
            <text x="108" y="17" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle" stroke="none" fill="#101418">
              B
            </text>
            <text x="132" y="17" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle" stroke="none" fill="#101418">
              A
            </text>
            <text x="156" y="17" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle" stroke="none" fill="#101418">
              C
            </text>
          </g>
        </g>
      </g>

      {/* =======================================================================
          5. NOTES (Bottom-Left)
      ======================================================================= */}
      <g transform="translate(45, 680)">
        <text x="0" y="0" fontSize="10" fontFamily="monospace" fontWeight="bold" stroke="none" fill="#101418">
          NOTES:
        </text>
        <text x="0" y="16" fontSize="9" fontFamily="monospace" stroke="none" fill="#101418">
          1. DIMENSIONS AND TOLERANCES PER ASME Y14.5-2009.
        </text>
        <text x="0" y="30" fontSize="9" fontFamily="monospace" stroke="none" fill="#101418">
          2. REMOVE ALL BURRS AND SHARP EDGES .020 MAX UNLESS OTHERWISE SPECIFIED.
        </text>
        <text x="0" y="44" fontSize="9" fontFamily="monospace" stroke="none" fill="#101418">
          3. HEAT TREAT COND H900.
        </text>
      </g>

      {/* =======================================================================
          6. TOLERANCE BLOCK (Bottom-Center)
      ======================================================================= */}
      <g transform="translate(460, 725)">
        <rect x="0" y="0" width="220" height="95" strokeWidth="1.4" fill="#FFFBF0" />
        <text x="110" y="16" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle" stroke="none" fill="#101418">
          UNLESS OTHERWISE SPECIFIED
        </text>
        <line x1="0" y1="22" x2="220" y2="22" strokeWidth="1" />
        <text x="12" y="38" fontSize="9" fontFamily="monospace" stroke="none" fill="#101418">
          .X ±.1
        </text>
        <text x="110" y="38" fontSize="9" fontFamily="monospace" stroke="none" fill="#101418">
          .XX ±.01
        </text>
        <text x="12" y="56" fontSize="9" fontFamily="monospace" fontWeight="bold" stroke="none" fill="#101418">
          .XXX ±.005
        </text>
        <text x="110" y="56" fontSize="9" fontFamily="monospace" stroke="none" fill="#101418">
          .XXXX ±.0005
        </text>
        <text x="12" y="74" fontSize="9" fontFamily="monospace" stroke="none" fill="#101418">
          ANGULAR ±30′
        </text>
      </g>

      {/* =======================================================================
          7. TITLE BLOCK (Bottom-Right)
      ======================================================================= */}
      <g transform="translate(710, 700)">
        <rect x="0" y="0" width="455" height="120" strokeWidth="1.6" fill="#FFFBF0" />
        <line x1="0" y1="38" x2="455" y2="38" strokeWidth="1" />
        <line x1="0" y1="76" x2="455" y2="76" strokeWidth="1" />
        <line x1="220" y1="0" x2="220" y2="120" strokeWidth="1" />
        <line x1="340" y1="38" x2="340" y2="120" strokeWidth="1" />

        <text x="12" y="24" fontSize="12" fontFamily="monospace" fontWeight="bold" stroke="none" fill="#101418">
          CONTACT PROBE
        </text>
        <text x="232" y="24" fontSize="10" fontFamily="monospace" stroke="none" fill="#101418">
          MATERIAL: ASTM A564 TYPE 630
        </text>
        <text x="12" y="58" fontSize="9" fontFamily="monospace" stroke="none" fill="#101418">
          FINISH: GLASS BEAD
        </text>
        <text x="232" y="58" fontSize="9" fontFamily="monospace" stroke="none" fill="#101418">
          DRAWN T.A.M 07-07-26
        </text>
        <text x="350" y="58" fontSize="9" fontFamily="monospace" stroke="none" fill="#101418">
          CHECKED P.L.F 07-07-26
        </text>
        <text x="12" y="98" fontSize="8.5" fontFamily="monospace" stroke="none" fill="#101418">
          DO NOT SCALE DRAWING
        </text>
        <text x="232" y="98" fontSize="9" fontFamily="monospace" stroke="none" fill="#101418">
          APPROVED J.M.K 07-07-26
        </text>
        <text x="350" y="98" fontSize="10" fontFamily="monospace" fontWeight="bold" stroke="none" fill="#101418">
          SIZE B
        </text>
      </g>
    </svg>
  );
}

