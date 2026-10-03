"use client";

import React, { useState, useEffect } from "react";

interface PipelineStep {
  id: "bravi" | "hera" | "sidekick";
  stepNumber: string;
  name: string;
  role: string;
  badge: string;
  accentColor: string;
  headline: string;
  specs: { label: string; value: string }[];
  terminalLog: string[];
  visualMetrics: {
    title: string;
    value: string;
    status: string;
    progress: number;
  }[];
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: "bravi",
    stepNumber: "01",
    name: "Bravi",
    role: "Sales Configuration Layer",
    badge: "AGENTIC CPQ",
    accentColor: "#38bdf8", // Electric Blue
    headline: "Real-time Field Estimation & Intelligent BOM Generation",
    specs: [
      { label: "Quote Synthesis", value: "340ms" },
      { label: "Margin Safeguard", value: "99.8%" },
      { label: "Geometry Ingestion", value: "STEP / DXF / SolidWorks" },
    ],
    terminalLog: [
      "[BRAVI::INIT] Ingesting customer spatial parameters...",
      "[BRAVI::CPQ] 42 custom tolerances resolved against raw stock pricing.",
      "[BRAVI::VALIDATE] BOM generated. Margin locked at 38.4%.",
      "[BRAVI::DISPATCH] Emitting payload to HERA CAD compiler...",
    ],
    visualMetrics: [
      { title: "Parametric Cost Curve", value: "$4,280.00 / lot", status: "LOCKED", progress: 88 },
      { title: "Material Yield Efficiency", value: "94.2% billet utilization", status: "OPTIMAL", progress: 94 },
      { title: "Field Quote Lead Time", value: "< 2 minutes", status: "INSTANT", progress: 99 },
    ],
  },
  {
    id: "hera",
    stepNumber: "02",
    name: "HERA",
    role: "Engineering Auto-Drafting",
    badge: "AUTONOMOUS CAD/CAM",
    accentColor: "#60a5fa", // Deep Electric Blue
    headline: "Parametric Blueprint Generation & Strict DFM Validation",
    specs: [
      { label: "Drafting Latency", value: "1.2s" },
      { label: "Tolerance Delta", value: "±0.005mm" },
      { label: "G-Code Toolpaths", value: "5-Axis Adaptive" },
    ],
    terminalLog: [
      "[HERA::GEOM] Reconstructing 3D manifold geometry from sales schema...",
      "[HERA::DFM] Checking wall thickness, undercut clearance, and tool reach.",
      "[HERA::PASS] 0 non-conformities found. GD&T annotation set verified.",
      "[HERA::CAM] G-Code generated. Posting to Sidekick spindle queue...",
    ],
    visualMetrics: [
      { title: "Geometric Dimensionality", value: "GD&T ASME Y14.5", status: "VALIDATED", progress: 100 },
      { title: "FEA Stress Simulation", value: "Safety Factor 2.8x", status: "NOMINAL", progress: 92 },
      { title: "CAM Toolpath Optimization", value: "-34% cycle time", status: "COMPILED", progress: 85 },
    ],
  },
  {
    id: "sidekick",
    stepNumber: "03",
    name: "Sidekick",
    role: "Shop Floor Execution",
    badge: "LIVE MACHINE DISPATCH",
    accentColor: "#f97316", // Industrial Safety Orange
    headline: "Direct CNC Spindle Dispatch & Sub-millisecond Telemetry",
    specs: [
      { label: "Floor Latency", value: "8ms" },
      { label: "Machine Protocol", value: "MTConnect / OPC-UA" },
      { label: "Defect Containment", value: "0 ppm Target" },
    ],
    terminalLog: [
      "[SIDEKICK::CELL_04] Mazak Integrex e-500H initialized & warm.",
      "[SIDEKICK::LOAD] G-Code 5X_BLISK_REV4 fed to Haas & Mazak controllers.",
      "[SIDEKICK::TELEMETRY] Spindle RPM: 14,200 | Vibration: 0.12mm/s (GREEN).",
      "[SIDEKICK::CYCLE] Part 01 of 120 completed. Laser metrology confirmed.",
    ],
    visualMetrics: [
      { title: "Spindle OEE Load", value: "96.4% utilization", status: "ACTIVE", progress: 96 },
      { title: "In-line Laser Metrology", value: "Cpk 1.82 (Six Sigma)", status: "COMPLIANT", progress: 98 },
      { title: "Floor Queue Velocity", value: "Zero human holdover", status: "DISPATCHED", progress: 100 },
    ],
  },
];

export default function ManufacturingHero() {
  const [activeStepId, setActiveStepId] = useState<"bravi" | "hera" | "sidekick">("hera");
  const [projectName, setProjectName] = useState("[YOUR PROJECT NAME]");
  const [isEditingName, setIsEditingName] = useState(false);
  const [mouseCoords, setMouseCoords] = useState({ x: 127.65, y: 264.8 });
  const [autoPlay, setAutoPlay] = useState(true);

  // Active step object
  const activeStep = PIPELINE_STEPS.find((s) => s.id === activeStepId) || PIPELINE_STEPS[1];

  // Mouse coordinate tracker for authentic blueprint HUD
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = parseFloat(((e.clientX - rect.left) * 0.28).toFixed(2));
    const y = parseFloat(((e.clientY - rect.top) * 0.32).toFixed(2));
    setMouseCoords({ x, y });
  };

  // Cycle through pipeline steps periodically if autoPlay is enabled
  useEffect(() => {
    if (!autoPlay) return;
    const interval = setInterval(() => {
      setActiveStepId((prev) => {
        if (prev === "bravi") return "hera";
        if (prev === "hera") return "sidekick";
        return "bravi";
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [autoPlay]);

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative min-h-screen w-full bg-[#08090d] text-[#e2e8f0] font-sans selection:bg-[#ff5500]/30 selection:text-white overflow-hidden bg-cad-grid"
    >
      {/* Dynamic Laser Scanline Effect */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-15 overflow-hidden">
        <div className="w-full h-32 bg-gradient-to-b from-transparent via-[#00f0ff]/10 to-transparent animate-laser" />
      </div>

      {/* Blueprint Coordinate Crosshairs & Precision Markers */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute top-12 left-12 w-4 h-4 border-l border-t border-[#3b82f6]/40 text-[9px] font-mono text-[#64748b] pl-1 pt-1 select-none">
          + 0,0
        </div>
        <div className="absolute top-12 right-12 w-4 h-4 border-r border-t border-[#3b82f6]/40 text-[9px] font-mono text-[#64748b] pr-1 pt-1 text-right select-none">
          REF_E1
        </div>
        <div className="absolute bottom-12 left-12 w-4 h-4 border-l border-b border-[#3b82f6]/40 text-[9px] font-mono text-[#64748b] pl-1 pb-1 select-none">
          ISO_9001
        </div>
        <div className="absolute bottom-12 right-12 w-4 h-4 border-r border-b border-[#3b82f6]/40 text-[9px] font-mono text-[#64748b] pr-1 pb-1 text-right select-none">
          CNC_SYNC
        </div>
      </div>

      {/* TOP FLOATING TECHNICAL NAVIGATION BAR (Inspired by the snap) */}
      <header className="relative z-30 pt-6 px-4 sm:px-8 max-w-7xl mx-auto flex items-center justify-between">
        {/* Top-Left CAD Telemetry Coordinates (Exact match to snap's technical styling) */}
        <div className="hidden lg:flex flex-col text-[11px] font-mono text-[#64748b] tracking-wider select-none">
          <div className="flex items-center gap-1.5">
            <span className="text-[#38bdf8]">X:</span>
            <span className="text-slate-300 font-semibold">{mouseCoords.x.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#38bdf8]">Y:</span>
            <span className="text-slate-300 font-semibold">{mouseCoords.y.toFixed(2)}</span>
          </div>
        </div>

        {/* Floating Center Dock Header */}
        <nav className="mx-auto flex items-center justify-between gap-3 sm:gap-6 bg-[#0f131c]/90 border border-[#232b3e] rounded-xl px-4 py-2.5 backdrop-blur-md shadow-2xl shadow-black/80">
          {/* Logo Mark with Geometric Industrial Glyph */}
          <div className="flex items-center gap-2.5 border-r border-slate-700/60 pr-4">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0066ff] via-[#0284c7] to-[#0ea5e9] flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-black text-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight text-white text-sm sm:text-base leading-none">
                {projectName === "[YOUR PROJECT NAME]" ? "SYNAPSE.MFG" : projectName}
              </span>
              <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 leading-tight">
                AI Manufacturing OS
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
            <a href="#pipeline" className="hover:text-white transition-colors flex items-center gap-1">
              Pipeline
              <span className="text-[9px] text-[#38bdf8] font-mono">v4.8</span>
            </a>
            <a href="#layers" className="hover:text-white transition-colors">
              3 AI Layers
            </a>
            <a href="#specs" className="hover:text-white transition-colors">
              Machine Specs
            </a>
            <a href="#benchmarks" className="hover:text-white transition-colors">
              Changelog
            </a>
          </div>

          {/* Nav Action CTA - Vibrant Industrial Button (Like the snap's orange/blue contrast pill) */}
          <div className="flex items-center gap-2">
            <a
              href="#demo"
              className="group relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#ff5500] to-[#ff6b00] hover:from-[#ff6b00] hover:to-[#ff8533] text-white text-xs font-semibold shadow-lg shadow-orange-500/25 transition-all active:scale-95"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <span>Watch Demo</span>
              <svg
                className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </nav>

        {/* Top-Right Technical Contact / Feed (Exact match to snap's layout style) */}
        <div className="hidden lg:flex flex-col items-end text-[11px] font-mono text-[#64748b] tracking-wider select-none">
          <div className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors cursor-pointer">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>HELLO@{projectName === "[YOUR PROJECT NAME]" ? "SYNAPSE.AI" : `${projectName.toLowerCase().replace(/[^a-z0-9]/g, "")}.COM`}</span>
          </div>
          <span className="text-[10px] text-slate-500">OPC-UA TELEMETRY ACTIVE</span>
        </div>
      </header>

      {/* OVERSIZED BACKGROUND TEXT: [YOUR PROJECT NAME] */}
      {/* Sits heroically behind typography with blueprint opacity, matching the snap's architectural impact */}
      <div className="pointer-events-none absolute top-28 left-0 right-0 flex justify-center items-center z-0 select-none overflow-hidden">
        <h2
          className="text-[14vw] font-black uppercase tracking-tighter text-slate-800/[0.12] whitespace-nowrap leading-none transition-all duration-700"
          style={{
            textShadow: "0 0 80px rgba(0, 102, 255, 0.05)",
            WebkitTextStroke: "1px rgba(255, 255, 255, 0.03)",
          }}
        >
          {projectName}
        </h2>
      </div>

      {/* MAIN HERO CONTENT CONTAINER */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pt-10 sm:pt-14 pb-20">
        {/* Project Name Customizer Pill (Lets user edit or confirm project name on the fly) */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#131926]/80 border border-[#23314d] text-xs font-mono text-slate-400 backdrop-blur-md">
            <span className="text-[#38bdf8] font-bold">PROJECT:</span>
            {isEditingName ? (
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => e.key === "Enter" && setIsEditingName(false)}
                autoFocus
                className="bg-black/60 text-white font-mono text-xs px-2 py-0.5 rounded border border-[#0070f3] outline-none w-48"
              />
            ) : (
              <span
                onClick={() => setIsEditingName(true)}
                title="Click to change project name"
                className="text-white hover:text-[#38bdf8] cursor-pointer underline decoration-dotted decoration-[#38bdf8]/50"
              >
                {projectName}
              </span>
            )}
            <button
              onClick={() => setIsEditingName(!isEditingName)}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded ml-1"
            >
              {isEditingName ? "Done" : "Edit"}
            </button>
          </div>
        </div>

        {/* Technical Top Badge (As explicitly required: QUOTE-TO-FLOOR AI PIPELINE) */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#0d1424] border border-[#1e293b] shadow-inner text-xs font-mono text-slate-300 tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f0ff] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00e5ff]"></span>
            </span>
            <span className="font-bold text-[#38bdf8] tracking-widest">QUOTE-TO-FLOOR AI PIPELINE</span>
            <span className="text-slate-600">|</span>
            <span className="text-[11px] text-slate-400 font-mono">LATENCY &lt; 400MS</span>
          </div>
        </div>

        {/* HERO TITLE & ANNOTATION BLOCK (Recreating the snap's typography + blueprint handwritten badges) */}
        <div className="relative text-center max-w-5xl mx-auto mb-10">
          {/* Blueprint Annotation 1: Left Sketched Badge (Snap match: 'AGENTIC MODELING') */}
          <div className="hidden md:flex absolute -top-5 left-2 xl:-left-8 items-center gap-1.5 transform -rotate-6 select-none pointer-events-none">
            <div className="px-2.5 py-0.5 border border-dashed border-[#38bdf8]/60 bg-[#08152c]/80 text-[#38bdf8] font-mono text-[11px] rounded tracking-widest uppercase shadow-sm">
              AGENTIC MODELING
            </div>
            <span className="text-[#38bdf8]/70 font-mono text-xs">⌁</span>
          </div>

          {/* Blueprint Annotation 2: Right Hand-Drawn Arrow (Snap match: '→ WITH AI') */}
          <div className="hidden md:flex absolute top-12 -right-4 xl:-right-10 items-center gap-1.5 transform rotate-3 select-none pointer-events-none">
            <span className="text-slate-500 font-mono text-base">→</span>
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-mono text-[#f97316] font-bold tracking-wider uppercase">
                WITH 3 AI LAYERS
              </span>
              <span className="text-[9px] font-mono text-slate-400">ZERO CNC DOWNTIME</span>
            </div>
          </div>

          {/* Colossal Powerful Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08] sm:leading-[1.05]">
            From Field Sales to Shop Floor,
            <br />
            <span className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Manufactured in Milliseconds.
            </span>
          </h1>

          {/* Supporting Description Highlighting the 3 AI Layers */}
          <p className="mt-6 max-w-3xl mx-auto text-base sm:text-lg lg:text-xl text-slate-400 leading-relaxed font-normal">
            Eliminate weeks of engineering backlogs. Our quote-to-floor intelligence coordinates{" "}
            <span className="text-[#38bdf8] font-semibold border-b border-[#38bdf8]/40 pb-0.5">Bravi</span> for
            instant field sales configuration,{" "}
            <span className="text-white font-semibold border-b border-white/40 pb-0.5">HERA</span> for autonomous
            engineering auto-drafting, and{" "}
            <span className="text-[#f97316] font-semibold border-b border-[#f97316]/40 pb-0.5">Sidekick</span> for
            deterministic shop floor machine execution.
          </p>

          {/* CTA Group with Vibrant Industrial Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Primary Action Button: Vibrant Industrial Orange / Electric Blue */}
            <a
              href="#deploy"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-[#ff5500] via-[#ff6a00] to-[#ff7700] hover:from-[#ff6a00] hover:to-[#ff8533] text-white font-bold text-base shadow-xl shadow-orange-600/30 hover:shadow-orange-500/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 border border-orange-400/40"
            >
              <svg className="w-5 h-5 text-amber-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span>Deploy Now</span>
              <span className="text-xs bg-black/20 text-orange-100 px-2 py-0.5 rounded font-mono">v4.8</span>
            </a>

            {/* Secondary Action Button: Steel Gray Industrial Outline */}
            <a
              href="#demo"
              className="w-full sm:w-auto px-7 py-4 rounded-xl bg-[#101624]/90 hover:bg-[#162035] text-slate-200 hover:text-white font-semibold text-base border border-[#27354f] hover:border-[#3b82f6]/60 shadow-lg transition-all flex items-center justify-center gap-2.5 backdrop-blur-md"
            >
              <svg className="w-5 h-5 text-[#38bdf8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Watch the Demo</span>
              <span className="text-slate-500 font-mono text-xs">2:40</span>
            </a>
          </div>

          {/* Quick Stat Micro-Indicators */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="text-slate-400">GD&T Tolerance:</span>
              <span className="text-slate-200 font-semibold">±0.005mm</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]"></span>
              <span className="text-slate-400">Quote-to-Toolpath:</span>
              <span className="text-slate-200 font-semibold">&lt; 90 Seconds</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f97316]"></span>
              <span className="text-slate-400">Machine Protocol:</span>
              <span className="text-slate-200 font-semibold">Universal CNC / MTConnect</span>
            </div>
          </div>
        </div>

        {/* 
          EXPANSIVE 3-STEP PIPELINE VISUALIZATION & ABSTRACT DASHBOARD GRAPHIC
          (Directly replaces the person at the desk from the user snap with a high-end industrial CAD viewport)
        */}
        <div className="relative rounded-2xl border border-[#232f48] bg-gradient-to-b from-[#0e1422] to-[#070a12] p-4 sm:p-6 lg:p-8 shadow-2xl shadow-black overflow-hidden">
          {/* Top Panel Bar with System Status & Pipeline Stage Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#1c273e]">
            {/* Left: Pipeline Interactive Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#00f0ff] animate-ping" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  PIPELINE WORKFLOW:
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#090d16] p-1 rounded-xl border border-[#1b253b]">
                {PIPELINE_STEPS.map((step) => {
                  const isActive = activeStepId === step.id;
                  return (
                    <button
                      key={step.id}
                      onClick={() => {
                        setActiveStepId(step.id);
                        setAutoPlay(false);
                      }}
                      className={`relative px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-2 ${
                        isActive
                          ? "bg-[#182338] text-white shadow-md border border-[#2e3e60]"
                          : "text-slate-400 hover:text-slate-200 hover:bg-[#101726]"
                      }`}
                    >
                      <span
                        className="text-[10px] font-bold px-1 rounded"
                        style={{
                          backgroundColor: isActive ? `${step.accentColor}25` : "transparent",
                          color: step.accentColor,
                        }}
                      >
                        {step.stepNumber}
                      </span>
                      <span>{step.name}</span>
                      {isActive && (
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: step.accentColor }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Autoplay Toggle & Live Spindle Heartbeat */}
            <div className="flex items-center gap-4 text-xs font-mono text-slate-400 justify-between md:justify-end">
              <button
                onClick={() => setAutoPlay(!autoPlay)}
                className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    autoPlay ? "bg-emerald-400" : "bg-slate-600"
                  }`}
                />
                <span>Auto-Cycle: {autoPlay ? "ON" : "PAUSED"}</span>
              </button>
              <div className="flex items-center gap-2 border-l border-slate-700/60 pl-4">
                <span className="text-slate-500">HEARTBEAT:</span>
                <span className="text-emerald-400 font-bold">99.98% OK</span>
              </div>
            </div>
          </div>

          {/* MAIN DASHBOARD CONTENT GRID */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left Column: Active Layer Specification Details (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <span
                    className="text-xs font-mono font-bold px-2.5 py-0.5 rounded border"
                    style={{
                      borderColor: `${activeStep.accentColor}50`,
                      backgroundColor: `${activeStep.accentColor}15`,
                      color: activeStep.accentColor,
                    }}
                  >
                    STEP {activeStep.stepNumber} // {activeStep.badge}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{activeStep.role}</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {activeStep.name} Engine
                </h3>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed font-normal">
                  {activeStep.headline}
                </p>
              </div>

              {/* Technical Specifications Matrix */}
              <div className="grid grid-cols-3 gap-3 bg-[#0a0f1b] p-3.5 rounded-xl border border-[#1b253c]">
                {activeStep.specs.map((spec, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                      {spec.label}
                    </span>
                    <span className="text-sm font-mono font-bold text-white mt-0.5 truncate">
                      {spec.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Progress Gauges for Active Layer */}
              <div className="space-y-3">
                {activeStep.visualMetrics.map((metric, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-300">{metric.title}</span>
                      <span className="text-slate-200 font-bold">{metric.value}</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#162033] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${metric.progress}%`,
                          backgroundColor: activeStep.accentColor,
                          boxShadow: `0 0 8px ${activeStep.accentColor}`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Mini Terminal / Agent Execution Trace */}
              <div className="bg-[#05070c] rounded-xl p-3 border border-[#172033] font-mono text-[11px] space-y-1 shadow-inner">
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 text-slate-400 text-[10px]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE RUNTIME TELEMETRY
                  </span>
                  <span>PID: 8842</span>
                </div>
                {activeStep.terminalLog.map((log, idx) => (
                  <div
                    key={idx}
                    className={`truncate ${
                      idx === activeStep.terminalLog.length - 1
                        ? "text-emerald-300 font-medium"
                        : "text-slate-400"
                    }`}
                  >
                    {log}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Abstract CAD 3D Viewport & Interactive Pipeline Schematic (7 Cols) */}
            <div className="lg:col-span-7 relative h-[360px] sm:h-[420px] rounded-xl bg-[#090d16] border border-[#1e2a42] p-4 flex flex-col justify-between overflow-hidden shadow-2xl">
              {/* CAD Viewport Coordinates Overlay */}
              <div className="flex items-center justify-between z-10 text-[10px] font-mono text-slate-400 select-none">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-blue-950/70 border border-blue-800/40 text-blue-300 font-bold">
                    CAD.VIEW 5-AXIS
                  </span>
                  <span>GRID: 0.10mm</span>
                  <span>ORTHO: ON</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">PART_ID:</span>
                  <span className="text-white font-bold">AEROSPACE-TURBINE-042</span>
                </div>
              </div>

              {/* Central Abstract CAD Graphic / Isometric Blueprint Model */}
              <div className="relative flex-1 flex items-center justify-center my-2">
                {/* Concentric Radar / Machining Path Rings */}
                <div className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full border border-blue-500/10 animate-pulse-slow pointer-events-none" />
                <div className="absolute w-48 h-48 sm:w-56 sm:h-56 rounded-full border border-blue-500/15 pointer-events-none" />
                <div className="absolute w-32 h-32 sm:w-36 sm:h-36 rounded-full border border-dashed border-[#38bdf8]/20 animate-spin" style={{ animationDuration: "35s" }} />

                {/* SVG Isometric Manufacturing Component & Toolpath Wireframe */}
                <svg
                  viewBox="0 0 400 300"
                  className="w-full max-w-[380px] h-auto drop-shadow-[0_0_25px_rgba(0,112,243,0.3)] transition-all duration-700"
                >
                  <defs>
                    <linearGradient id="cadGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#0066ff" stopOpacity="0.4" />
                    </linearGradient>
                    <linearGradient id="orangeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ff5500" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#ff8533" stopOpacity="0.4" />
                    </linearGradient>
                  </defs>

                  {/* Blueprint Coordinate Axes */}
                  <line x1="50" y1="250" x2="350" y2="250" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="200" y1="30" x2="200" y2="270" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />

                  {/* Isometric Machined Block (3D Part Wireframe) */}
                  <g className="transition-transform duration-700">
                    {/* Top Face */}
                    <polygon
                      points="200,60 290,110 200,160 110,110"
                      fill={activeStepId === "sidekick" ? "rgba(249, 115, 22, 0.08)" : "rgba(56, 189, 248, 0.08)"}
                      stroke={activeStepId === "sidekick" ? "#f97316" : "#38bdf8"}
                      strokeWidth="1.8"
                    />

                    {/* Left Face */}
                    <polygon
                      points="110,110 200,160 200,240 110,190"
                      fill={activeStepId === "sidekick" ? "rgba(249, 115, 22, 0.04)" : "rgba(0, 102, 255, 0.05)"}
                      stroke={activeStepId === "sidekick" ? "#ea580c" : "#2563eb"}
                      strokeWidth="1.8"
                    />

                    {/* Right Face */}
                    <polygon
                      points="200,160 290,110 290,190 200,240"
                      fill={activeStepId === "sidekick" ? "rgba(249, 115, 22, 0.06)" : "rgba(14, 165, 233, 0.05)"}
                      stroke={activeStepId === "sidekick" ? "#f97316" : "#38bdf8"}
                      strokeWidth="1.8"
                    />

                    {/* Cylindrical Precision Bore (Hole cut through top face) */}
                    <ellipse
                      cx="200"
                      cy="110"
                      rx="35"
                      ry="20"
                      fill="#070a12"
                      stroke={activeStepId === "sidekick" ? "#ff5500" : "#00f0ff"}
                      strokeWidth="2"
                    />

                    {/* Simulated Toolpath Spiral or Laser Contour */}
                    <path
                      d="M 175,100 C 185,85 215,85 225,100 C 235,115 205,125 185,115 C 170,108 190,95 210,105"
                      fill="none"
                      stroke={activeStepId === "sidekick" ? "#ff7700" : "#38bdf8"}
                      strokeWidth="1.5"
                      className="animate-flow-dash"
                    />

                    {/* Dimension Callout Lines & Ticks */}
                    <line x1="290" y1="110" x2="340" y2="85" stroke="#64748b" strokeWidth="1" />
                    <circle cx="290" cy="110" r="3" fill="#38bdf8" />
                    <text x="345" y="85" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                      R: 14.25mm
                    </text>

                    <line x1="110" y1="190" x2="60" y2="215" stroke="#64748b" strokeWidth="1" />
                    <circle cx="110" cy="190" r="3" fill="#f97316" />
                    <text x="15" y="220" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                      Z: -80.00mm
                    </text>
                  </g>

                  {/* Active Tool / Spindle Head Indicator */}
                  <g transform={activeStepId === "sidekick" ? "translate(200, 70)" : "translate(200, 50)"}>
                    <line x1="0" y1="-30" x2="0" y2="0" stroke="#f97316" strokeWidth="3" />
                    <polygon points="-6,0 6,0 0,10" fill="#ff5500" />
                    <circle cx="0" cy="10" r="2" fill="#ffffff" />
                  </g>
                </svg>

                {/* Live Floating Status Badge in Viewport */}
                <div className="absolute bottom-2 left-2 bg-[#0d1424]/90 border border-[#22314e] px-3 py-1.5 rounded-lg backdrop-blur-md flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: activeStep.accentColor }}
                  />
                  <span className="text-[10px] font-mono text-slate-300">
                    ACTIVE AGENT: <span className="font-bold text-white">{activeStep.name.toUpperCase()}</span>
                  </span>
                </div>

                <div className="absolute top-2 right-2 bg-[#0d1424]/90 border border-[#22314e] px-3 py-1.5 rounded-lg backdrop-blur-md text-[10px] font-mono text-slate-400">
                  FEED: <span className="text-emerald-400 font-bold">1,850 mm/min</span>
                </div>
              </div>

              {/* Bottom Framing Strip with Quote/Caption (Direct tribute to snap's bottom-right signature) */}
              <div className="pt-3 border-t border-[#1a253b] flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] font-mono text-slate-400 gap-2">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-[#38bdf8] font-bold">FLOW:</span>
                  <span>Field CPQ (Bravi)</span>
                  <span className="text-slate-600">→</span>
                  <span>Auto-Draft (HERA)</span>
                  <span className="text-slate-600">→</span>
                  <span className="text-[#f97316]">CNC Floor (Sidekick)</span>
                </div>

                {/* Exact Snap-Inspired Signature Caption */}
                <div className="flex items-center gap-1.5 text-slate-300 sm:text-right">
                  <span className="text-[10px] text-slate-400">
                    The quote-to-floor neural engine that thinks with you, at spindle velocity.
                  </span>
                  <div className="w-3.5 h-3.5 rounded bg-orange-600/80 flex items-center justify-center text-[8px] text-white font-bold ml-1">
                    ⚡
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3-STEP PIPELINE ARCHITECTURE CARDS (Detailed underneath the viewport) */}
          <div className="mt-8 pt-6 border-t border-[#1c273e] grid grid-cols-1 md:grid-cols-3 gap-4">
            {PIPELINE_STEPS.map((step) => {
              const isCurrent = activeStepId === step.id;
              return (
                <div
                  key={step.id}
                  onClick={() => {
                    setActiveStepId(step.id);
                    setAutoPlay(false);
                  }}
                  className={`cursor-pointer rounded-xl p-4 transition-all border ${
                    isCurrent
                      ? "bg-[#131b2c] border-[#38bdf8]/60 shadow-lg shadow-blue-500/10"
                      : "bg-[#0a0e18] border-[#182337] hover:border-slate-600 hover:bg-[#0e1422]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: `${step.accentColor}20`,
                        color: step.accentColor,
                      }}
                    >
                      LAYER {step.stepNumber}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {isCurrent ? "ACTIVE" : "SELECT TO INSPECT"}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    {step.name}
                    <span className="text-xs font-normal text-slate-400 font-mono">({step.role})</span>
                  </h4>
                  <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                    {step.id === "bravi" &&
                      "Empowers field sales reps to configure complex assemblies with dynamic price books, margin lock, and instantaneous BOM validation."}
                    {step.id === "hera" &&
                      "Ingests quote parameters to auto-generate parametric CAD models, verify DFM compliance, and author precision fabrication prints in seconds."}
                    {step.id === "sidekick" &&
                      "Streams compiled toolpaths directly into CNC machines, tracks live spindle load, and guarantees zero-defect shop floor execution."}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* INDUSTRIAL TRUST & ENTERPRISE PERFORMANCE PROOF BAR */}
        <div className="mt-14 pt-8 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">98.4%</span>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider mt-1">
              Quote-to-Spindle Velocity
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#38bdf8] font-mono">±0.005mm</span>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider mt-1">
              Parametric DFM Precision
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#f97316] font-mono">3.8x</span>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider mt-1">
              Shop Floor Yield Throughput
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">Zero</span>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider mt-1">
              Engineering Drafting Backlog
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
