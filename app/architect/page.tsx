"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FeatureRail, ARCHITECT_MODULES, WORKSPACE_ITEMS, ModuleItem } from "./components/FeatureRail";
import { PlaceholderModule } from "./components/PlaceholderModule";
import { BomCheckModule } from "./components/BomCheckModule";
import { DesignIntelligenceModule } from "./components/DesignIntelligenceModule";
import { GdtReviewModule } from "./components/GdtReviewModule";
import { ProjectsView, ProjectModuleNavOptions } from "./components/ProjectsView";
import { Sidebar } from "../app/components/Sidebar";
import { UploadState } from "../app/components/UploadState";
import { RunView } from "../app/components/RunView";
import { SystemMonitor } from "../components/SystemMonitor";

export default function ArchitectPage() {
  // Active rail module: defaults to "01-autodraft"
  const [activeModuleId, setActiveModuleId] = useState<string>("01-autodraft");

  // Autodraft nested states
  const [autodraftViewState, setAutodraftViewState] = useState<"upload" | "running">("upload");
  const [selectedRunId, setSelectedRunId] = useState<string>("");
  const [currentFile, setCurrentFile] = useState<string>("clevis.step");

  // Active project context when jumping from Projects workspace
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeProjectName, setActiveProjectName] = useState<string | null>(null);

  // Autodraft inspect state
  const [autodraftIsInspect, setAutodraftIsInspect] = useState<boolean>(false);

  // Module reset keys for "+ New run"
  const [bomCheckKey, setBomCheckKey] = useState<number>(0);
  const [designIntelKey, setDesignIntelKey] = useState<number>(0);
  const [gdtReviewKey, setGdtReviewKey] = useState<number>(0);

  // Navigation configs when jumping from Projects workspace
  const [designIntelConfig, setDesignIntelConfig] = useState<{
    initialSample?: boolean;
    initialStep?: 1 | 2 | 3;
    isInspect?: boolean;
  } | null>(null);

  const [gdtReviewConfig, setGdtReviewConfig] = useState<{
    initialSample?: boolean;
    initialStep?: 1 | 2 | 3;
    isInspect?: boolean;
  } | null>(null);

  const [bomCheckConfig, setBomCheckConfig] = useState<{
    initialSample?: boolean;
    initialStep?: 1 | 2 | 3;
    isInspect?: boolean;
  } | null>(null);

  // Handlers for Autodraft
  const handleStartAutodraftRun = (runId: string, file: string) => {
    setSelectedRunId(runId);
    setCurrentFile(file);
    setAutodraftViewState("running");
  };

  const handleCancelAutodraftRun = () => {
    setAutodraftIsInspect(false);
    setAutodraftViewState("upload");
  };

  const handleNewDrawing = () => {
    setAutodraftIsInspect(false);
    setAutodraftViewState("upload");
  };

  const handleSelectRun = (runId: string) => {
    setAutodraftIsInspect(false);
    setSelectedRunId(runId);
    setAutodraftViewState("running");
  };

  // Handler when any module finishes a run
  const handleRunComplete = async (runInfo: {
    moduleName: "AUTODRAFT" | "DESIGN INTELLIGENCE" | "GD&T REVIEW" | "BOM CHECK";
    moduleCode: "01-autodraft" | "02-design-intelligence" | "03-gdt-review" | "04-bom-check";
    runTitle: string;
    fileName: string;
    result: string;
    resultType: "error" | "warn" | "clear" | "neutral";
    runId?: string;
    sampleStep?: 1 | 2 | 3;
    details?: Record<string, unknown>;
  }) => {
    if (!activeProjectId) return;

    try {
      const res = await fetch("/api/architect/projects/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: activeProjectId,
          ...runInfo,
        }),
      });
      if (res.ok) {
        console.log(`[Architect] Run successfully persisted to project '${activeProjectId}'`);
      }
    } catch (err) {
      console.error("[Architect] Failed to persist run to project:", err);
    }
  };

  // Resolve valid active module with fallback to "01-autodraft"
  const validModuleIds = [...ARCHITECT_MODULES, ...WORKSPACE_ITEMS].map((m) => m.id);
  const effectiveModuleId = validModuleIds.includes(activeModuleId) ? activeModuleId : "01-autodraft";

  // Find active module metadata
  const currentModule: ModuleItem =
    ARCHITECT_MODULES.find((m) => m.id === effectiveModuleId) ||
    WORKSPACE_ITEMS.find((w) => w.id === effectiveModuleId) ||
    ARCHITECT_MODULES[0];

  // Handler for top-right "+ New run" button
  const handleNewRun = () => {
    setAutodraftIsInspect(false);
    if (effectiveModuleId === "01-autodraft") {
      handleNewDrawing();
    } else if (effectiveModuleId === "02-design-intelligence") {
      setDesignIntelConfig({ initialStep: 1, isInspect: false });
      setDesignIntelKey((prev) => prev + 1);
    } else if (effectiveModuleId === "03-gdt-review") {
      setGdtReviewConfig({ initialStep: 1, isInspect: false });
      setGdtReviewKey((prev) => prev + 1);
    } else if (effectiveModuleId === "04-bom-check") {
      setBomCheckConfig({ initialStep: 1, isInspect: false });
      setBomCheckKey((prev) => prev + 1);
    }
  };

  // Handler when navigating from Projects gallery / detail run / sample cards
  const handleOpenModuleFromProjects = (moduleCode: string, options?: ProjectModuleNavOptions) => {
    setActiveModuleId(moduleCode);
    if (options?.projectId) {
      setActiveProjectId(options.projectId);
      setActiveProjectName(options.projectName || "Project");
    }
    const isInspectMode = !!options?.isInspect;

    if (moduleCode === "01-autodraft") {
      setAutodraftIsInspect(isInspectMode);
      if (options?.initialSample || isInspectMode) {
        handleStartAutodraftRun(options?.runId || "sample-clevis", options?.fileName || "clevis.step");
      } else {
        handleNewDrawing();
      }
    } else if (moduleCode === "02-design-intelligence") {
      setDesignIntelConfig({
        initialSample: options?.initialSample,
        initialStep: isInspectMode ? 3 : (options?.initialStep || (options?.initialSample ? 3 : 1)),
        isInspect: isInspectMode,
      });
      setDesignIntelKey((prev) => prev + 1);
    } else if (moduleCode === "03-gdt-review") {
      setGdtReviewConfig({
        initialSample: options?.initialSample,
        initialStep: isInspectMode ? 3 : (options?.initialStep || (options?.initialSample ? 3 : 1)),
        isInspect: isInspectMode,
      });
      setGdtReviewKey((prev) => prev + 1);
    } else if (moduleCode === "04-bom-check") {
      setBomCheckConfig({
        initialSample: options?.initialSample,
        initialStep: isInspectMode ? 3 : (options?.initialStep ?? (options?.initialSample ? 3 : 1)),
        isInspect: isInspectMode,
      });
      setBomCheckKey((prev) => prev + 1);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#FFFBF0] flex flex-col overflow-hidden text-[#101418] font-sans antialiased relative selection:bg-[#E8EEFC] selection:text-[#1E43D8]">
      {/* =========================================================================
          TOP HEADER BAR (Unchanged Manufy Brand Header)
      ========================================================================= */}
      <header className="h-12 border-b-2 border-[#101418] px-4 sm:px-6 flex items-center justify-between bg-[#FFFBF0] shrink-0 z-20">
        <div className="flex items-center gap-3">
          {/* Manufy Wordmark & Logo Mark */}
          <Link
            href="/"
            className="flex items-center gap-2 text-[#101418] hover:opacity-90 transition-opacity group cursor-pointer"
            title="Return to Manufy Landing Page"
          >
            {/* Solid royal-blue square logo mark */}
            <div className="w-5 h-5 bg-[#1E43D8] border border-[#101418] rounded-[3px] flex items-center justify-center p-0.5 shadow-2xs group-hover:bg-[#3E6BE0] transition-colors">
              <svg viewBox="0 0 14 14" className="w-full h-full text-white" fill="none" stroke="currentColor">
                <path d="M2 12L12 2M2 2L12 12" strokeWidth="1.6" strokeLinecap="round" />
                <rect x="3" y="3" width="8" height="8" strokeWidth="1.2" strokeDasharray="1 1" />
              </svg>
            </div>
            <span className="font-display font-bold text-base tracking-tight text-[#101418]">
              Manufy
            </span>
          </Link>
        </div>

        {/* Center: Label in IBM Plex Mono uppercase */}
        <div className="font-mono text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#101418] px-2.5 py-0.5 rounded border border-[#101418]/20 bg-[#FBF6E9]">
          ARCHITECT MODE
        </div>

        {/* Right side: Linux System Monitor + All Modes Link */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          <SystemMonitor />

          <Link
            href="/"
            className="font-hand font-bold text-base sm:text-lg text-[#101418] hover:text-[#1E43D8] transition-colors -rotate-1 inline-flex items-center gap-1"
          >
            ← All modes
          </Link>
        </div>
      </header>

      {/* =========================================================================
          OUTER LAYOUT: Left Feature Rail (248px) + Main Content Area
      ========================================================================= */}
      <div className="flex-1 flex flex-col min-[900px]:flex-row overflow-hidden relative">
        {/* Left Feature Rail */}
        <FeatureRail
          activeModuleId={effectiveModuleId}
          onSelectModule={(id) => setActiveModuleId(id)}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#FFFBF0] relative">
          {/* Content Header Bar above modules (hidden for Projects which has its own integrated header) */}
          {effectiveModuleId !== "ws-projects" && (
            <div className="h-10 border-b border-[#101418]/20 bg-[#FBF6E9] px-4 sm:px-6 flex items-center justify-between shrink-0 z-10">
              {/* Left: Mono breadcrumb */}
              <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-[#101418]/70 uppercase tracking-wider">
                {activeProjectId && activeProjectName ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveModuleId("ws-projects")}
                      className="text-[#1E43D8] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                      title="Return to project"
                    >
                      <span>← {activeProjectName}</span>
                    </button>
                    <span className="text-[#101418]/30">/</span>
                  </>
                ) : (
                  <>
                    <span>HOME</span>
                    <span className="text-[#101418]/30">/</span>
                  </>
                )}
                <span className="text-[#101418] font-bold">
                  {currentModule.label}
                </span>
              </div>

              {/* Right: Black "+ New run" pill for live modules */}
              {currentModule.isLive && (
                <button
                  type="button"
                  onClick={handleNewRun}
                  className="bg-[#101418] hover:bg-[#101418]/85 text-white font-mono text-[11px] font-semibold px-3 py-1 rounded-full shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>+ New run</span>
                </button>
              )}
            </div>
          )}

          {/* Module Stage Swapping */}
          <div className="flex-1 flex overflow-hidden relative">
            {effectiveModuleId === "01-autodraft" ? (
              /* MODULE 01: AUTODRAFT (Runs sidebar 264px + UploadState / RunView workspace) */
              <div className="flex-1 flex overflow-hidden relative w-full h-full">
                <Sidebar
                  onNewDrawing={handleNewDrawing}
                  selectedRunId={selectedRunId}
                  onSelectRun={handleSelectRun}
                />
                <div className="flex-1 flex flex-col overflow-hidden bg-[#FFFBF0] relative">
                  {autodraftViewState === "upload" ? (
                    <UploadState onStartRun={handleStartAutodraftRun} />
                  ) : (
                    <RunView
                      runId={selectedRunId}
                      fileName={currentFile}
                      onCancel={handleCancelAutodraftRun}
                      onRunComplete={handleRunComplete}
                      isInspect={autodraftIsInspect}
                    />
                  )}
                </div>
              </div>
            ) : effectiveModuleId === "02-design-intelligence" ? (
              /* MODULE 02: DESIGN INTELLIGENCE */
              <DesignIntelligenceModule
                key={designIntelKey}
                initialSample={designIntelConfig?.initialSample}
                initialStep={designIntelConfig?.initialStep}
                isInspect={designIntelConfig?.isInspect}
                onNewRun={handleNewRun}
                onRunComplete={handleRunComplete}
              />
            ) : effectiveModuleId === "03-gdt-review" ? (
              /* MODULE 03: GD&T REVIEW */
              <GdtReviewModule
                key={gdtReviewKey}
                initialSample={gdtReviewConfig?.initialSample}
                initialStep={gdtReviewConfig?.initialStep}
                isInspect={gdtReviewConfig?.isInspect}
                onNewRun={handleNewRun}
                onRunComplete={handleRunComplete}
              />
            ) : effectiveModuleId === "04-bom-check" ? (
              /* MODULE 04: BOM CHECK */
              <BomCheckModule
                key={bomCheckKey}
                initialSample={bomCheckConfig?.initialSample}
                initialStep={bomCheckConfig?.initialStep}
                isInspect={bomCheckConfig?.isInspect}
                onNewRun={handleNewRun}
                onRunComplete={handleRunComplete}
              />
            ) : effectiveModuleId === "ws-projects" ? (
              /* WORKSPACE: PROJECTS VIEW */
              <ProjectsView
                initialProjectId={activeProjectId}
                onOpenModule={handleOpenModuleFromProjects}
                onBackToModules={() => setActiveModuleId("01-autodraft")}
              />
            ) : (
              /* WORKSPACE: IN PREPARATION PLACEHOLDER (e.g. My Reviews) */
              <PlaceholderModule module={currentModule} />
            )}
          </div>
        </main>
      </div>

      {/* Corner decor: "N" north-arrow badge at bottom-left */}
      <div
        className="hidden sm:flex absolute bottom-2.5 left-2.5 z-30 w-6 h-6 rounded-full bg-[#FFFBF0] border-[1.5px] border-[#101418] shadow-2xs items-center justify-center pointer-events-none select-none"
        title="Grid North"
      >
        <div className="flex items-center justify-center relative">
          <span className="font-mono font-bold text-[9px] text-[#101418] leading-none">N</span>
          <div className="absolute -top-1 w-0 h-0 border-l-[2px] border-l-transparent border-r-[2px] border-r-transparent border-b-[3px] border-b-[#101418]" />
        </div>
      </div>
    </div>
  );
}
