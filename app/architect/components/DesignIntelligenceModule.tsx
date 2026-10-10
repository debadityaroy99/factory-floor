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
  Layers,
  Sparkles,
} from "lucide-react";

interface Finding {
  id: number;
  severity: "MAJOR";
  title: string;
  body: string;
  neededCallout: string;
  located: string;
  consequence: string;
  evidence: string;
  pin: { x: number; y: number }; // % of canvas
  regions: { left: number; top: number; width: number; height: number }[]; // % of canvas
  zoomCenter: { x: number; y: number }; // % to center on zoom
}

const FINDINGS: Finding[] = [
  {
    id: 1,
    severity: "MAJOR",
    title: "Four #4-40 face threads have no defining callout",
    body: "The four holes at X 2.188/2.688 and Y .250/3.750 are located, but the thread definition is absent — no size, no depth, no quantity callout.",
    neededCallout: "TAP #4-40 THRU — 4 PLACES",
    located: "four-hole face pattern",
    consequence:
      "A machinist can locate the holes but cannot select the tap or the acceptance gage.",
    evidence:
      "Cross-referenced against ASME Y14.5-2018 para 4.3. Pattern dimensions exist on sheet 1 (X: 2.188, 2.688; Y: .250, 3.750) with standard fastener centers, but neither thread pitch, minor diameter, nor drill depth are called out.",
    pin: { x: 34, y: 40 },
    regions: [{ left: 24, top: 28, width: 52, height: 44 }],
    zoomCenter: { x: 50, y: 50 },
  },
  {
    id: 2,
    severity: "MAJOR",
    title: "Four edge taps lack thread size and depth",
    body: "The paired upper and lower edge features are geometrically visible, but no thread callout defines them.",
    neededCallout: "TAP 1/4-20 .875 DEEP — 4 PLACES",
    located: "left + right edge hole pairs",
    consequence:
      "Threads could be tapped shallow or in the wrong size; minimum thread depth is anyone's guess.",
    evidence:
      "Side view depicts 4 tapped blind holes on the plate periphery with clearance counterbores. Depth symbols and thread callouts are completely missing from both front and section views.",
    pin: { x: 64, y: 44 },
    regions: [
      { left: 72, top: 30, width: 14, height: 40 },
      { left: 16, top: 30, width: 12, height: 40 },
    ],
    zoomCenter: { x: 79, y: 50 },
  },
  {
    id: 3,
    severity: "MAJOR",
    title: "Central bore has no diameter",
    body: "The large central bore is drawn in both views but dimensioned in neither — no Ø callout exists on the sheet.",
    neededCallout: "Ø 2.870 THRU",
    located: "central bore, front view",
    consequence:
      "The single largest feature on the part cannot be machined or inspected as drawn.",
    evidence:
      "Feature diameter is drawn with inner and outer concentric radii with centerline cross. Inspection routine searched for Ø or DIA leader lines across sheet 1; coverage check returned 0 hits.",
    pin: { x: 49, y: 52 },
    regions: [{ left: 33, top: 32, width: 34, height: 40 }],
    zoomCenter: { x: 50, y: 52 },
  },
  {
    id: 4,
    severity: "MAJOR",
    title: "Plate thickness is never dimensioned",
    body: "The top section view shows the plate thickness graphically; no thickness dimension appears in any view.",
    neededCallout: ".250 THK",
    located: "top section view",
    consequence:
      "Stock selection and every depth on the part hang off a dimension that isn't stated.",
    evidence:
      "The top view provides a width baseline of 4.875, but vertical stock thickness has no associated extension line or dimension text on any view.",
    pin: { x: 28, y: 12 },
    regions: [{ left: 24, top: 6, width: 56, height: 14 }],
    zoomCenter: { x: 52, y: 13 },
  },
];

const CHECKLIST_ITEMS = [
  "Every hole located AND defined",
  "Thread callouts: size, depth, quantity",
  "Bore diameters and depths",
  "Edge features fully called out",
  "Thicknesses in the section view",
];

const DRAWING_TYPES = [
  "Let AI Decide",
  "Plate",
  "Flange",
  "Shaft",
  "Housing",
  "Piston",
  "Gear",
  "General",
];

const AUDIT_RULES = [
  { label: "Hole locations", pass: true, count: 0 },
  { label: "Face-thread callouts", pass: false, count: 1 },
  { label: "Edge-thread callouts", pass: false, count: 1 },
  { label: "Bore diameters", pass: false, count: 1 },
  { label: "Depths & thicknesses", pass: false, count: 1 },
  { label: "Notes & finishes", pass: true, count: 0 },
  { label: "Title block & revision", pass: true, count: 0 },
];

const STATUS_LINES = [
  "READING VIEWS · FRONT + SECTION…",
  "LOCATING FEATURES · 18 FOUND…",
  "CHECKING CALLOUT COVERAGE… 512 / 717",
  "WRITING FINDINGS…",
];

interface DesignIntelligenceModuleProps {
  onNewRun?: () => void;
  initialSample?: boolean;
  initialStep?: 1 | 2 | 3;
  isInspect?: boolean;
  onRunComplete?: (info: {
    runId?: string;
    fileName: string;
    moduleName: "DESIGN INTELLIGENCE";
    moduleCode: "02-design-intelligence";
    runTitle: string;
    result: string;
    resultType: "error" | "warn" | "clear" | "neutral";
    sampleStep?: 1 | 2 | 3;
    details?: Record<string, unknown>;
  }) => void;
}

export function DesignIntelligenceModule({
  onNewRun,
  initialSample = false,
  initialStep,
  isInspect = false,
  onRunComplete,
}: DesignIntelligenceModuleProps) {
  // State: 1 = Setup, 2 = Analysing, 3 = Results (opens directly to 3 if inspecting)
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
          name: "D1000130-DIFFUSER-PLATE.pdf",
          size: "1.8 MB",
        }
      : null
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Selected drawing type
  const [selectedDrawingType, setSelectedDrawingType] = useState("Plate");
  const hasNotifiedComplete = useRef(isInspect);

  useEffect(() => {
    if (step === 3 && !hasNotifiedComplete.current && !isInspect) {
      hasNotifiedComplete.current = true;
      onRunComplete?.({
        fileName: selectedFile?.name || "D1000130-DIFFUSER-PLATE.pdf",
        moduleName: "DESIGN INTELLIGENCE",
        moduleCode: "02-design-intelligence",
        runTitle: "Missing-dimension review",
        result: "4 OPEN ISSUES",
        resultType: "error",
        sampleStep: 3,
        details: { findingsCount: 4, drawingType: selectedDrawingType },
      });
    }
  }, [step, selectedFile, selectedDrawingType, isInspect, onRunComplete]);

  // State 1 staggered ticks
  const [stage1Ticks, setStage1Ticks] = useState(0);

  // State 2 analysing animation
  const [statusIndex, setStatusIndex] = useState(0);
  const [runningTicks, setRunningTicks] = useState(0);

  // State 3 Results interaction
  const [activeTab, setActiveTab] = useState<"checklist" | "ballooning" | "verdict">(
    "checklist"
  );
  const [activeFindingId, setActiveFindingId] = useState<number | null>(null); // hovered
  const [selectedFindingId, setSelectedFindingId] = useState<number | null>(null); // clicked
  const [expandedEvidence, setExpandedEvidence] = useState<Record<number, boolean>>({});

  // Review item status: "open" | "confirmed" | "dismissed"
  const [findingStatuses, setFindingStatuses] = useState<
    Record<number, "open" | "confirmed" | "dismissed">
  >({ 1: "open", 2: "open", 3: "open", 4: "open" });

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

    const s1 = setTimeout(() => setStatusIndex(1), 1500);
    const s2 = setTimeout(() => setStatusIndex(2), 3000);
    const s3 = setTimeout(() => setStatusIndex(3), 4500);

    const r1 = setTimeout(() => setRunningTicks(1), 800);
    const r2 = setTimeout(() => setRunningTicks(2), 1800);
    const r3 = setTimeout(() => setRunningTicks(3), 2800);
    const r4 = setTimeout(() => setRunningTicks(4), 3800);
    const r5 = setTimeout(() => setRunningTicks(5), 4800);

    const finish = setTimeout(() => {
      setStep(3);
    }, 6000);

    return () => {
      clearTimeout(s1);
      clearTimeout(s2);
      clearTimeout(s3);
      clearTimeout(r1);
      clearTimeout(r2);
      clearTimeout(r3);
      clearTimeout(r4);
      clearTimeout(r5);
      clearTimeout(finish);
    };
  }, [step]);

  // Reset to 100% zoom & center
  const resetZoom = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    setSelectedFindingId(null);
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

  // Zoom to finding region
  const zoomToFinding = (finding: Finding) => {
    if (selectedFindingId === finding.id) {
      resetZoom();
      return;
    }

    setSelectedFindingId(finding.id);
    const targetScale = 1.45;
    setScale(targetScale);

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const targetX = (finding.zoomCenter.x / 100) * rect.width;
      const targetY = (finding.zoomCenter.y / 100) * rect.height;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      setPan({
        x: (centerX - targetX) * (targetScale - 1),
        y: (centerY - targetY) * (targetScale - 1),
      });
    }

    const cardEl = cardRefs.current[finding.id];
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  // Step zoom by ±15%
  const adjustZoom = (delta: number) => {
    setScale((prev) => {
      const next = Math.round((prev + delta) * 100) / 100;
      return Math.min(2.5, Math.max(0.8, next));
    });
  };

  // Pan dragging handlers
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
      name: "D1000130-DIFFUSER-PLATE.pdf",
      size: "1.8 MB",
    });
  };

  // Full reset
  const handleRestart = () => {
    setStep(1);
    setSelectedFindingId(null);
    setActiveFindingId(null);
    resetZoom();
  };

  // Current highlighted finding (hover takes precedence, then selected)
  const currentHighlightedId = activeFindingId || selectedFindingId;
  const currentFinding = FINDINGS.find((f) => f.id === currentHighlightedId);

  // Counts of open issues
  const openCount = Object.values(findingStatuses).filter((s) => s === "open").length;

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
              Which dimensions is this drawing missing?
            </h1>
            <p className="font-sans text-[14px] sm:text-[15px] text-[#3C4356] leading-relaxed max-w-xl mx-auto">
              Upload a drawing — Manufy checks every feature for a defining dimension or
              callout, and takes you to the exact spot for each gap.
            </p>
          </div>

          {/* Dropzone Sheet */}
          <div className="bg-[#FFFBF0] border-2 border-[#101418] rounded-[14px] p-5 shadow-hard space-y-3">
            <div className="flex items-center justify-between pb-1">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#101418]">
                ENGINEERING DRAWING
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
                    <Check className="w-3.5 h-3.5" /> Sheet ready for geometric sweep
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
                Use the sample drawing (D1000130-DIFFUSER-PLATE.pdf)
              </button>
            </div>
          </div>

          {/* Drawing-type chips */}
          <div className="space-y-2">
            <div className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-[#101418]/70">
              DRAWING TYPE PRESUPPOSITION
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
                5 ACTIVE AUDIT RULES
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
              <span>▶ Find missing dimensions</span>
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
          <div className="w-full max-w-[780px] bg-white border-2 border-[#101418] rounded-[14px] shadow-hard p-4 relative overflow-hidden animate-slide-up">
            {/* The Drawing SVG Preview */}
            <DrawingSVG
              scale={1}
              pan={{ x: 0, y: 0 }}
              activeFindingId={null}
              selectedFindingId={null}
              findingStatuses={{}}
              onSelectPin={() => {}}
              onHoverPin={() => {}}
            />

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
                Scanning Drawing Geometry
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
                <span>INSPECTION COVERAGE</span>
                <span className="text-[#1E43D8]">{runningTicks} / 5</span>
              </div>
              {CHECKLIST_ITEMS.map((task, i) => (
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
              <div className="font-mono text-xl font-bold text-[#1E43D8]">717 CHECKS</div>
              <div className="font-mono text-[10px] text-[#101418]/60 uppercase tracking-wider">
                Full Callout & Dimension Matrix
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
          LEFT: DRAWING CANVAS (flex-1) with Floating Zoom Control
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
        {/* Canvas Sheet Container with animated Pan + Zoom */}
        <div
          className="relative max-w-[1040px] w-full p-4 transition-transform duration-450 ease-out"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          {/* Main Drawing Sheet Card */}
          <div className="bg-white border-2 border-[#101418] rounded-[14px] shadow-hard overflow-hidden relative">
            <DrawingSVG
              scale={scale}
              pan={pan}
              activeFindingId={activeFindingId}
              selectedFindingId={selectedFindingId}
              findingStatuses={findingStatuses}
              onSelectPin={(id) => {
                const match = FINDINGS.find((f) => f.id === id);
                if (match) zoomToFinding(match);
              }}
              onHoverPin={(id) => setActiveFindingId(id)}
            />

            {/* Render Region Highlight Boxes for active / selected finding */}
            {currentFinding &&
              currentFinding.regions.map((reg, idx) => (
                <div
                  key={idx}
                  className="absolute pointer-events-none rounded-[6px] border-[2px] border-[#D92D20] bg-[#D92D20]/15 animate-pulse"
                  style={{
                    left: `${reg.left}%`,
                    top: `${reg.top}%`,
                    width: `${reg.width}%`,
                    height: `${reg.height}%`,
                    boxShadow: "0 0 14px rgba(217, 45, 32, 0.3)",
                  }}
                />
              ))}

            {/* PINS: Absolute over Canvas */}
            {FINDINGS.map((finding) => {
              const isHighlighted = currentHighlightedId === finding.id;
              const status = findingStatuses[finding.id];
              const isConfirmed = status === "confirmed";
              const isDismissed = status === "dismissed";

              return (
                <div
                  key={finding.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    zoomToFinding(finding);
                  }}
                  onMouseEnter={() => setActiveFindingId(finding.id)}
                  onMouseLeave={() => setActiveFindingId(null)}
                  className={`absolute z-30 cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all ${
                    isHighlighted ? "scale-125 z-40" : "hover:scale-110"
                  }`}
                  style={{
                    left: `${finding.pin.x}%`,
                    top: `${finding.pin.y}%`,
                  }}
                >
                  {/* Pin Circle: 26px circle, 2px white border + ink ring */}
                  <div
                    className={`w-[26px] h-[26px] rounded-full border-2 border-white ring-2 ring-[#101418] flex items-center justify-center font-sans font-bold text-[12px] shadow-hard-xs transition-colors ${
                      isConfirmed
                        ? "bg-[#1E9E6A] text-white"
                        : isDismissed
                        ? "bg-white text-[#D92D20]"
                        : "bg-[#D92D20] text-white"
                    }`}
                  >
                    {finding.id}
                  </div>

                  {/* Pulsing ring on hover / active */}
                  {isHighlighted && (
                    <div className="absolute inset-0 rounded-full ring-4 ring-[#D92D20]/40 animate-ping pointer-events-none" />
                  )}
                </div>
              );
            })}

            {/* Floating Tooltip Card beside Pin / Region */}
            {currentFinding && (
              <div
                className="absolute z-40 bg-white border-2 border-[#101418] rounded-[10px] p-3 shadow-hard-sm max-w-[280px] space-y-1.5 pointer-events-none animate-slide-up"
                style={{
                  left: `min(75%, max(10%, ${currentFinding.pin.x + 3}%))`,
                  top: `min(70%, max(10%, ${currentFinding.pin.y + 4}%))`,
                }}
              >
                <div className="font-sans font-bold text-[12px] text-[#101418] leading-tight">
                  {currentFinding.title}
                </div>
                <div className="font-sans text-[11px] text-[#3C4356] leading-snug line-clamp-2">
                  {currentFinding.body}
                </div>
                <div className="pt-1">
                  <span className="bg-[#E8EEFC] text-[#1E43D8] border border-[#1E43D8]/30 font-mono text-[10.5px] font-bold px-2 py-0.5 rounded-md inline-block shadow-2xs">
                    {currentFinding.neededCallout}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Floating Zoom Controls: Bottom-Centre */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 bg-[#FFFBF0] border-2 border-[#101418] rounded-full px-3.5 py-1.5 shadow-hard-xs flex items-center gap-2.5 font-mono text-xs select-none">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              adjustZoom(-0.15);
            }}
            title="Zoom Out"
            className="w-6 h-6 rounded-full hover:bg-[#E8EEFC] flex items-center justify-center font-bold text-[#101418] cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="font-bold text-[#101418] min-w-[44px] text-center">
            {Math.round(scale * 100)}%
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              adjustZoom(0.15);
            }}
            title="Zoom In"
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
            title="Reset Zoom (Esc)"
            className="w-6 h-6 rounded-full hover:bg-[#E8EEFC] flex items-center justify-center text-[#101418] cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* =====================================================================
          RIGHT PANEL (400px): Header, Tabs, Counts Row & Findings Feed
      ===================================================================== */}
      <aside className="w-full lg:w-[400px] shrink-0 border-t-2 lg:border-t-0 lg:border-l-2 border-[#101418] bg-[#FFFBF0] flex flex-col h-full overflow-hidden">
        {/* Panel Header */}
        <div className="p-4 border-b-2 border-[#101418] bg-[#FFFBF0] shrink-0 space-y-1.5">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-xl text-[#101418]">
              Inspection results
            </h2>
            <span className="inline-flex items-center gap-1.5 bg-[#E6F4EA] border border-[#1E9E6A]/30 text-[#1E9E6A] font-mono text-[10.5px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1E9E6A]" />
              <span>Complete</span>
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="font-sans text-[#3C4356]">
              D1000130 · diffuser plate · Rev C
            </span>
            <button
              type="button"
              onClick={handleRestart}
              className="bg-white hover:bg-[#E8EEFC] border-[1.5px] border-[#101418] text-[#101418] font-sans text-[11px] font-semibold px-2 py-0.5 rounded-full shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>New review</span>
            </button>
          </div>
        </div>

        {/* Tab Bar: Checklist 7 / Ballooning 0 / Verdict */}
        <div className="flex border-b-2 border-[#101418] bg-[#FBF6E9] shrink-0">
          {[
            { id: "checklist", label: "Checklist 7" },
            { id: "ballooning", label: "Ballooning 0" },
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

        {/* TAB 1: CHECKLIST & FINDINGS FEED */}
        {activeTab === "checklist" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Counts Row */}
            <div className="px-4 py-2 bg-[#FBF6E9] border-b border-[#101418]/15 flex items-center justify-between font-mono text-[11px] font-semibold shrink-0">
              <span className="text-[#101418]/70">717 checked</span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-[#FDECEA] border border-[#D92D20]/40 text-[#D92D20] font-bold">
                  {openCount} issues
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#E6F4EA] border border-[#1E9E6A]/30 text-[#1E9E6A] font-bold">
                  3 OK
                </span>
              </div>
            </div>

            {/* Findings List */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
              {FINDINGS.map((finding) => {
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
                    onMouseEnter={() => setActiveFindingId(finding.id)}
                    onMouseLeave={() => setActiveFindingId(null)}
                    className={`rounded-[12px] p-3.5 space-y-2.5 transition-all cursor-pointer ${
                      status === "dismissed" ? "opacity-55" : ""
                    } ${
                      isSelected
                        ? "bg-[#E8EEFC] border-2 border-[#101418] ring-2 ring-[#101418] shadow-hard-xs"
                        : isHovered
                        ? "bg-[#E8EEFC]/60 border-2 border-[#101418] shadow-2xs"
                        : "bg-white border-2 border-[#101418] shadow-2xs hover:bg-[#F8FAFC]"
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[11px] font-bold text-white shrink-0 ${
                            status === "confirmed"
                              ? "bg-[#1E9E6A]"
                              : status === "dismissed"
                              ? "bg-gray-400"
                              : "bg-[#101418]"
                          }`}
                        >
                          {finding.id}
                        </div>

                        {/* Severity Pill: ▲ Major (sun fill #FFC53D, ink text) */}
                        <span className="inline-flex items-center gap-1 bg-[#FFC53D] border border-[#101418]/30 text-[#101418] px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider shadow-2xs">
                          <AlertTriangle className="w-3 h-3" />
                          <span>▲ Major</span>
                        </span>

                        {/* Green Verified mono tag */}
                        <span className="font-mono text-[10px] font-bold text-[#1E9E6A]">
                          ✓ Verified
                        </span>
                      </div>

                      {/* Status chip */}
                      {status === "confirmed" ? (
                        <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded bg-[#E6F4EA] border border-[#1E9E6A]/30 text-[#1E9E6A]">
                          CONFIRMED
                        </span>
                      ) : status === "dismissed" ? (
                        <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded bg-gray-100 border border-gray-300 text-gray-500">
                          DISMISSED
                        </span>
                      ) : (
                        <span className="font-mono text-[9.5px] font-semibold px-2 py-0.5 rounded-full bg-[#FFF3C4] border border-[#101418]/20 text-[#101418]">
                          AWAITING ADMIN REVIEW
                        </span>
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

                    {/* NEEDED CALLOUT LINE (Royal mono on paleblue chip) */}
                    <div className="space-y-1">
                      <div className="font-mono text-[10px] font-bold text-[#101418]/60 uppercase tracking-wider">
                        NEEDED CALLOUT:
                      </div>
                      <div className="bg-[#E8EEFC] border border-[#1E43D8]/40 rounded-md px-2.5 py-1 inline-block">
                        <span className="font-mono text-[11px] font-bold text-[#1E43D8]">
                          {finding.neededCallout}
                        </span>
                      </div>
                    </div>

                    {/* LOCATED line */}
                    <div className="font-mono text-[10.5px] text-[#101418]/70">
                      <span className="font-semibold text-[#101418]">LOCATED: </span>
                      <span>{finding.located}</span>
                    </div>

                    {/* Butter CONSEQUENCE box */}
                    <div className="bg-[#FFF3C4] border border-[#101418]/20 rounded-lg p-2.5 space-y-0.5">
                      <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#101418]">
                        CONSEQUENCE:
                      </div>
                      <div className="font-sans text-[11.5px] text-[#101418] leading-snug">
                        {finding.consequence}
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
                          {finding.evidence}
                        </div>
                      )}
                    </div>

                    {/* Footer Actions: Confirm · Add comment · Dismiss */}
                    <div className="pt-2 border-t border-[#101418]/15 flex items-center justify-between text-xs font-sans">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFindingStatuses((prev) => ({
                              ...prev,
                              [finding.id]: "confirmed",
                            }));
                          }}
                          className="font-medium text-[#1E9E6A] hover:underline cursor-pointer"
                        >
                          Confirm
                        </button>
                        <span className="text-[#101418]/20">·</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            alert(`Comment added to Finding #${finding.id}`);
                          }}
                          className="font-medium text-[#101418]/70 hover:text-[#101418] hover:underline cursor-pointer"
                        >
                          Add comment
                        </button>
                        <span className="text-[#101418]/20">·</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFindingStatuses((prev) => ({
                              ...prev,
                              [finding.id]:
                                prev[finding.id] === "dismissed" ? "open" : "dismissed",
                            }));
                          }}
                          className="font-medium text-[#D92D20] hover:underline cursor-pointer"
                        >
                          {status === "dismissed" ? "Reopen" : "Dismiss"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Checklist Audit Table view at bottom */}
              <div className="mt-4 pt-3 border-t border-[#101418]/15 space-y-2">
                <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#101418]/60">
                  RULE BREAKDOWN (4 ISSUES, 3 OK)
                </div>
                <div className="bg-white border border-[#101418]/20 rounded-lg divide-y divide-[#101418]/10 text-xs font-sans">
                  {AUDIT_RULES.map((rule, idx) => (
                    <div key={idx} className="p-2 flex items-center justify-between">
                      <span className="text-[#101418]">{rule.label}</span>
                      <span
                        className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          rule.pass
                            ? "bg-[#E6F4EA] text-[#1E9E6A]"
                            : "bg-[#FDECEA] text-[#D92D20]"
                        }`}
                      >
                        {rule.pass ? "PASS" : `FAIL · ${rule.count}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BALLOONING 0 */}
        {activeTab === "ballooning" && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3 animate-slide-up">
            <div className="w-12 h-12 rounded-full bg-[#E8EEFC] border-2 border-[#101418] flex items-center justify-center text-[#1E43D8] shadow-hard-xs">
              <Layers className="w-6 h-6 stroke-[2]" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display font-bold text-base text-[#101418]">
                No balloons placed yet
              </h3>
              <p className="font-sans text-xs text-[#3C4356] max-w-[220px]">
                Ballooning module activates after missing dimensions are resolved.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: VERDICT */}
        {activeTab === "verdict" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 animate-slide-up">
            <div className="bg-white border-2 border-[#101418] rounded-xl p-4 space-y-3.5 shadow-hard-xs">
              <div className="bg-[#D92D20] text-white px-3 py-2 rounded-lg font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>DO NOT RELEASE — 4 CALLOUTS MISSING</span>
              </div>

              <div className="space-y-2 text-xs font-sans text-[#101418]">
                <div className="p-2 bg-[#FDECEA] rounded border border-[#D92D20]/20 font-medium">
                  1. Face holes: missing thread size and depth (TAP #4-40 THRU).
                </div>
                <div className="p-2 bg-[#FDECEA] rounded border border-[#D92D20]/20 font-medium">
                  2. Edge hole pairs: missing thread callout (TAP 1/4-20 .875 DEEP).
                </div>
                <div className="p-2 bg-[#FDECEA] rounded border border-[#D92D20]/20 font-medium">
                  3. Central bore: missing defining diameter callout (Ø 2.870 THRU).
                </div>
                <div className="p-2 bg-[#FDECEA] rounded border border-[#D92D20]/20 font-medium">
                  4. Section view: plate thickness is never dimensioned (.250 THK).
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
// INLINE DRAWING SVG: D1000130 DIFFUSER PLATE
// ===========================================================================
function DrawingSVG({
  scale,
  pan,
  activeFindingId,
  selectedFindingId,
  findingStatuses,
  onSelectPin,
  onHoverPin,
}: {
  scale: number;
  pan: { x: number; y: number };
  activeFindingId: number | null;
  selectedFindingId: number | null;
  findingStatuses: Record<number, "open" | "confirmed" | "dismissed">;
  onSelectPin: (id: number) => void;
  onHoverPin: (id: number | null) => void;
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

      {/* Notes block top-left (mono 9px, 6 short lines) */}
      <g transform="translate(45, 65)">
        <text x="0" y="0" fontSize="10" fontFamily="monospace" fontWeight="bold" stroke="none" fill="#101418">
          NOTES:
        </text>
        <text x="0" y="16" fontSize="9" fontFamily="monospace" stroke="none" fill="#101418">
          1. ALL DIMENSIONS IN INCHES.
        </text>
        <text x="0" y="30" fontSize="9" fontFamily="monospace" stroke="none" fill="#101418">
          2. BREAK ALL EDGES .015 MAX.
        </text>
        <text x="0" y="44" fontSize="9" fontFamily="monospace" stroke="none" fill="#101418">
          3. FINISH 63 µin Ra UNLESS NOTED.
        </text>
        <text x="0" y="58" fontSize="9" fontFamily="monospace" stroke="none" fill="#101418">
          4. MARK PART NO. PER NOTE 5.
        </text>
      </g>

      {/* =======================================================================
          TOP SECTION VIEW (x≈330, y≈70, 560×90)
          Note: ABSENT thickness dimension (Finding 4)
      ======================================================================= */}
      <g id="top-section-view">
        {/* Plate edge-on rectangular outline */}
        <rect x="330" y="70" width="560" height="34" strokeWidth="1.8" fill="none" />

        {/* Center bore vertical dashed pairs */}
        <line x1="580" y1="70" x2="580" y2="104" strokeWidth="1" strokeDasharray="6 3" stroke="#1E43D8" />
        <line x1="540" y1="70" x2="540" y2="104" strokeWidth="1.2" strokeDasharray="3 3" />
        <line x1="620" y1="70" x2="620" y2="104" strokeWidth="1.2" strokeDasharray="3 3" />

        {/* Face hole positions as short vertical hidden lines */}
        <line x1="430" y1="70" x2="430" y2="104" strokeWidth="1" strokeDasharray="3 2" />
        <line x1="730" y1="70" x2="730" y2="104" strokeWidth="1" strokeDasharray="3 2" />

        {/* Dimension line above: "4.875" */}
        <line x1="330" y1="48" x2="890" y2="48" strokeWidth="1" />
        <line x1="330" y1="42" x2="330" y2="68" strokeWidth="0.8" />
        <line x1="890" y1="42" x2="890" y2="68" strokeWidth="0.8" />
        {/* Arrowheads */}
        <polygon points="330,48 338,45 338,51" fill="#101418" stroke="none" />
        <polygon points="890,48 882,45 882,51" fill="#101418" stroke="none" />
        <text x="610" y="44" fontSize="12" fontFamily="monospace" fontWeight="bold" textAnchor="middle" stroke="none" fill="#101418">
          4.875
        </text>
      </g>

      {/* =======================================================================
          MAIN FRONT VIEW (x≈300, y≈230, 560×500)
      ======================================================================= */}
      <g id="front-view">
        {/* Square plate outer outline */}
        <rect x="330" y="230" width="560" height="480" rx="8" strokeWidth="2.2" fill="none" />

        {/* Large central bore: outer circle r 150 + inner circle r 132 */}
        <circle cx="610" cy="470" r="150" strokeWidth="1.8" />
        <circle cx="610" cy="470" r="132" strokeWidth="1.4" />
        {/* Dash-dot center cross */}
        <line x1="420" y1="470" x2="800" y2="470" strokeWidth="1" strokeDasharray="8 3 2 3" stroke="#1E43D8" />
        <line x1="610" y1="280" x2="610" y2="660" strokeWidth="1" strokeDasharray="8 3 2 3" stroke="#1E43D8" />

        {/* FOUR face holes (circles r 11 with thread tick marks) */}
        {[
          [450, 350], // Top-Left (Pin 1)
          [770, 350], // Top-Right
          [450, 590], // Bottom-Left
          [770, 590], // Bottom-Right
        ].map(([cx, cy], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r="11" strokeWidth="1.6" />
            <circle cx={cx} cy={cy} r="8" strokeWidth="1" strokeDasharray="3 2" />
            {/* Center tick marks */}
            <line x1={cx - 15} y1={cy} x2={cx + 15} y2={cy} strokeWidth="0.8" />
            <line x1={cx} y1={cy - 15} x2={cx} y2={cy + 15} strokeWidth="0.8" />
          </g>
        ))}

        {/* Paired EDGE features: Left and Right edge pairs */}
        {/* Left edge upper & lower slots */}
        <g strokeWidth="1.4">
          <rect x="330" y="340" width="45" height="18" fill="none" />
          <line x1="375" y1="344" x2="415" y2="344" strokeDasharray="3 2" />
          <line x1="375" y1="354" x2="415" y2="354" strokeDasharray="3 2" />

          <rect x="330" y="580" width="45" height="18" fill="none" />
          <line x1="375" y1="584" x2="415" y2="584" strokeDasharray="3 2" />
          <line x1="375" y1="594" x2="415" y2="594" strokeDasharray="3 2" />
        </g>

        {/* Right edge upper & lower slots (Pin 2) */}
        <g strokeWidth="1.4">
          <rect x="845" y="340" width="45" height="18" fill="none" />
          <line x1="845" y1="344" x2="805" y2="344" strokeDasharray="3 2" />
          <line x1="845" y1="354" x2="805" y2="354" strokeDasharray="3 2" />

          <rect x="845" y="580" width="45" height="18" fill="none" />
          <line x1="845" y1="584" x2="805" y2="584" strokeDasharray="3 2" />
          <line x1="845" y1="594" x2="805" y2="594" strokeDasharray="3 2" />
        </g>

        {/* ===================================================================
            EXISTING DIMENSION LINES (Per prompt spec)
        =================================================================== */}
        {/* Top Chain: 4.125 / 4.063 / 2.688 / 2.188 / .750 */}
        <g strokeWidth="0.9">
          <line x1="330" y1="180" x2="742" y2="180" />
          <text x="536" y="174" fontSize="11" fontFamily="monospace" textAnchor="middle" stroke="none" fill="#101418">
            4.125
          </text>
          <line x1="330" y1="150" x2="736" y2="150" />
          <text x="533" y="144" fontSize="11" fontFamily="monospace" textAnchor="middle" stroke="none" fill="#101418">
            4.063
          </text>
          <line x1="330" y1="205" x2="598" y2="205" />
          <text x="464" y="201" fontSize="11" fontFamily="monospace" textAnchor="middle" stroke="none" fill="#101418">
            2.688
          </text>
          <line x1="330" y1="225" x2="548" y2="225" />
          <text x="439" y="221" fontSize="11" fontFamily="monospace" textAnchor="middle" stroke="none" fill="#101418">
            2.188
          </text>
          <line x1="330" y1="245" x2="405" y2="245" />
          <text x="367" y="241" fontSize="11" fontFamily="monospace" textAnchor="middle" stroke="none" fill="#101418">
            .750
          </text>
        </g>

        {/* Right side: 3.750 / 2.000 */}
        <g strokeWidth="0.9">
          <line x1="930" y1="230" x2="930" y2="605" />
          <line x1="890" y1="230" x2="935" y2="230" />
          <line x1="890" y1="605" x2="935" y2="605" />
          <polygon points="930,230 927,238 933,238" fill="#101418" stroke="none" />
          <polygon points="930,605 927,597 933,597" fill="#101418" stroke="none" />
          <text x="945" y="420" fontSize="11" fontFamily="monospace" textAnchor="start" stroke="none" fill="#101418">
            3.750
          </text>

          <line x1="905" y1="350" x2="905" y2="550" />
          <polygon points="905,350 902,358 908,358" fill="#101418" stroke="none" />
          <polygon points="905,550 902,542 908,542" fill="#101418" stroke="none" />
          <text x="912" y="455" fontSize="11" fontFamily="monospace" textAnchor="start" stroke="none" fill="#101418">
            2.000
          </text>
        </g>

        {/* Bottom: .813 / 2.438 */}
        <g strokeWidth="0.9">
          <line x1="330" y1="735" x2="411" y2="735" />
          <line x1="411" y1="710" x2="411" y2="740" />
          <text x="370" y="748" fontSize="11" fontFamily="monospace" textAnchor="middle" stroke="none" fill="#101418">
            .813
          </text>

          <line x1="330" y1="760" x2="574" y2="760" />
          <line x1="574" y1="710" x2="574" y2="765" />
          <text x="452" y="773" fontSize="11" fontFamily="monospace" textAnchor="middle" stroke="none" fill="#101418">
            2.438
          </text>
        </g>

        {/* Left: .250 */}
        <g strokeWidth="0.9">
          <line x1="305" y1="230" x2="305" y2="255" />
          <line x1="300" y1="230" x2="330" y2="230" />
          <line x1="300" y1="255" x2="330" y2="255" />
          <text x="295" y="246" fontSize="11" fontFamily="monospace" textAnchor="end" stroke="none" fill="#101418">
            .250
          </text>
        </g>

        {/* Leader note bottom-right */}
        <g transform="translate(680, 680)">
          <line x1="0" y1="0" x2="60" y2="50" strokeWidth="1" />
          <line x1="60" y1="50" x2="160" y2="50" strokeWidth="1" />
          <text x="62" y="65" fontSize="8.5" fontFamily="monospace" stroke="none" fill="#101418">
            LOCATION FOR PART AND SERIAL NUMBERS, SEE NOTE 5.
          </text>
        </g>
      </g>

      {/* =======================================================================
          TITLE BLOCK (Bottom-Right corner)
      ======================================================================= */}
      <g transform="translate(860, 710)">
        <rect x="0" y="0" width="305" height="115" strokeWidth="1.6" fill="#FFFBF0" />
        <line x1="0" y1="38" x2="305" y2="38" strokeWidth="1" />
        <line x1="0" y1="76" x2="305" y2="76" strokeWidth="1" />
        <line x1="150" y1="0" x2="150" y2="115" strokeWidth="1" />
        <line x1="230" y1="38" x2="230" y2="115" strokeWidth="1" />

        <text x="10" y="24" fontSize="11" fontFamily="monospace" fontWeight="bold" stroke="none" fill="#101418">
          DIFFUSER PLATE
        </text>
        <text x="160" y="24" fontSize="10" fontFamily="monospace" stroke="none" fill="#101418">
          DWG NO D1000130
        </text>
        <text x="10" y="60" fontSize="9" fontFamily="monospace" stroke="none" fill="#101418">
          MATERIAL: 304 SST
        </text>
        <text x="160" y="60" fontSize="9" fontFamily="monospace" stroke="none" fill="#101418">
          SCALE: 1:1
        </text>
        <text x="240" y="60" fontSize="9" fontFamily="monospace" stroke="none" fill="#101418">
          SHEET 1 OF 1
        </text>
        <text x="10" y="98" fontSize="9" fontFamily="monospace" stroke="none" fill="#101418">
          INSP: MANUFY REVIEW
        </text>
        <text x="160" y="98" fontSize="10" fontFamily="monospace" fontWeight="bold" stroke="none" fill="#101418">
          REV C
        </text>
      </g>
    </svg>
  );
}
