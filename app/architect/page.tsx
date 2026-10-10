"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FeatureRail, ARCHITECT_MODULES, WORKSPACE_ITEMS, ModuleItem } from "./components/FeatureRail";
import { PlaceholderModule } from "./components/PlaceholderModule";
import { BomCheckModule } from "./components/BomCheckModule";
import { Sidebar } from "../app/components/Sidebar";
import { UploadState } from "../app/components/UploadState";
import { RunView } from "../app/components/RunView";
import { SystemMonitor } from "../components/SystemMonitor";

export default function ArchitectPage() {
  // Active rail module: defaults to "01-autodraft"
  const [activeModuleId, setActiveModuleId] = useState<string>("01-autodraft");

  // Autodraft nested states
  const [autodraftViewState, setAutodraftViewState] = useState<"upload" | "running">("upload");
  const [selectedRunId, setSelectedRunId] = useState<string>("run-1");
  const [currentFile, setCurrentFile] = useState<string>("clevis.step");

  // BOM Check reset key for "+ New run"
  const [bomCheckKey, setBomCheckKey] = useState<number>(0);

  // Handlers for Autodraft
  const handleStartAutodraftRun = (runId: string, file: string) => {
    setSelectedRunId(runId);
    setCurrentFile(file);
    setAutodraftViewState("running");
  };

  const handleCancelAutodraftRun = () => {
    setAutodraftViewState("upload");
  };

  const handleNewDrawing = () => {
    setAutodraftViewState("upload");
  };

  const handleSelectRun = (runId: string) => {
    setSelectedRunId(runId);
    setAutodraftViewState("running");
  };

  // Find active module metadata
  const currentModule: ModuleItem =
    ARCHITECT_MODULES.find((m) => m.id === activeModuleId) ||
    WORKSPACE_ITEMS.find((w) => w.id === activeModuleId) ||
    ARCHITECT_MODULES[0];

  // Handler for top-right "+ New run" button
  const handleNewRun = () => {
    if (activeModuleId === "01-autodraft") {
      handleNewDrawing();
    } else if (activeModuleId === "07-bom-check") {
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
          activeModuleId={activeModuleId}
          onSelectModule={(id) => setActiveModuleId(id)}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#FFFBF0] relative">
          {/* Content Header Bar above every module */}
          <div className="h-10 border-b border-[#101418]/20 bg-[#FBF6E9] px-4 sm:px-6 flex items-center justify-between shrink-0 z-10">
            {/* Left: Mono breadcrumb */}
            <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-[#101418]/70 uppercase tracking-wider">
              <span>HOME</span>
              <span className="text-[#101418]/30">/</span>
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

          {/* Module Stage Swapping */}
          <div className="flex-1 flex overflow-hidden relative">
            {activeModuleId === "01-autodraft" ? (
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
                    <RunView runId={selectedRunId} fileName={currentFile} onCancel={handleCancelAutodraftRun} />
                  )}
                </div>
              </div>
            ) : activeModuleId === "07-bom-check" ? (
              /* MODULE 07: BOM CHECK */
              <BomCheckModule key={bomCheckKey} onNewRun={handleNewRun} />
            ) : (
              /* MODULES 02-06 & WORKSPACE: IN PREPARATION PLACEHOLDER */
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
