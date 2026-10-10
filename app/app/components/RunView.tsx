"use client";

import React, { useState, useEffect, useRef } from "react";
import { PIPELINE_STAGES, PipelineStage } from "../mockData";
import { Stepper } from "./Stepper";
import { PartSummary } from "./PartSummary";
import { ViewGrid } from "./ViewGrid";
import { OrientationView } from "./OrientationView";
import { FeatureTreeTable } from "./FeatureTreeTable";
import { ViewSelectionTable } from "./ViewSelectionTable";
import { DerivedViews } from "./DerivedViews";
import { DimensionTable } from "./DimensionTable";
import { DrawingSheet } from "./DrawingSheet";
import { AgentsFeed } from "./AgentsFeed";

interface RunViewProps {
  runId?: string;
  fileName?: string;
  onCancel: () => void;
  initialStage?: number;
  isInspect?: boolean;
  onRunComplete?: (info: {
    runId?: string;
    fileName: string;
    moduleName: "AUTODRAFT";
    moduleCode: "01-autodraft";
    runTitle: string;
    result: string;
    resultType: "error" | "warn" | "clear" | "neutral";
    details?: Record<string, unknown>;
  }) => void;
}

export function RunView({
  runId,
  fileName = "clevis.step",
  onCancel,
  initialStage = 1,
  isInspect = false,
  onRunComplete,
}: RunViewProps) {
  // Current pipeline progression stage (1 to 8) - directly 8 when inspecting
  const [pipelineStage, setPipelineStage] = useState<number>(isInspect ? 8 : (initialStage || 1));
  // Selected stage for inspection
  const [inspectedStage, setInspectedStage] = useState<number>(isInspect ? 8 : (initialStage || 1));
  const [isFinished, setIsFinished] = useState<boolean>(isInspect || (initialStage ? initialStage >= 8 : false));
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(isInspect ? 14 : 0);
  const [liveRunData, setLiveRunData] = useState<unknown | null>(null);
  const hasNotifiedComplete = useRef(isInspect);

  useEffect(() => {
    if (isFinished && !hasNotifiedComplete.current && !isInspect) {
      hasNotifiedComplete.current = true;
      onRunComplete?.({
        runId,
        fileName,
        moduleName: "AUTODRAFT",
        moduleCode: "01-autodraft",
        runTitle: `STEP to drawing · ${fileName}`,
        result: "DRAWING GENERATED",
        resultType: "clear",
        details: (liveRunData as Record<string, unknown>) || {},
      });
    }
  }, [isFinished, runId, fileName, liveRunData, isInspect, onRunComplete]);

  // Trigger live backend pipeline execution when runId is provided (skip if inspecting)
  useEffect(() => {
    if (!runId || isInspect) return;

    let isMounted = true;
    async function executeLivePipeline() {
      try {
        const res = await fetch("/api/architect/pipeline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ runId, targetStage: 8 }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.run && isMounted) {
            setLiveRunData(data.run);
            setPipelineStage(8);
            setInspectedStage(8);
            setIsFinished(true);
          }
        }
      } catch (err) {
        console.warn("[RunView] Pipeline API execution notice:", err);
      }
    }

    executeLivePipeline();
    return () => {
      isMounted = false;
    };
  }, [runId]);

  // Auto-play timeline simulation if running locally without backend completion
  useEffect(() => {
    if (isFinished || isInspect) return;

    const STAGE_DURATIONS: { [key: number]: number } = {
      1: 1400, // Load STEP
      2: 1800, // Six views
      3: 2200, // Orientation
      4: 2600, // Feature tree
      5: 1800, // View selection
      6: 1200, // Derived views
      7: 2400, // Dimension set
      8: 2000, // Drawing sheet
    };

    const timer = setTimeout(() => {
      setPipelineStage((current) => {
        if (current >= 8) {
          setIsFinished(true);
          setInspectedStage(8);
          return 8;
        }
        const next = current + 1;
        setInspectedStage(next);
        return next;
      });
    }, STAGE_DURATIONS[pipelineStage] || 2000);

    return () => clearTimeout(timer);
  }, [pipelineStage, isFinished, isInspect]);

  // Overall wall-clock ticker for live effect
  useEffect(() => {
    if (isFinished || isInspect) return;
    const ticker = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(ticker);
  }, [isFinished, isInspect]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleStageSelect = (stageId: number) => {
    if (stageId <= pipelineStage) {
      setInspectedStage(stageId);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#FFFBF0]">
      {/* Run Header */}
      <div className="px-5 py-3 border-b-[1.5px] border-[#101418] flex items-center justify-between bg-[#FFFBF0] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[#101418]">
              <svg className="w-4 h-4 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
            <h1 className="text-xs sm:text-sm font-bold text-[#101418] font-mono tracking-tight">
              Run {fileName}
            </h1>
          </div>

          {/* Status Pill per specs: yellow fill + 1.5px ink border + mono text */}
          {isFinished ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#1E43D8] text-white border-[1.5px] border-[#101418] shadow-2xs">
              <svg className="w-3.5 h-3.5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Finished (8/8 stages)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#FFC53D] text-[#101418] border-[1.5px] border-[#101418] shadow-2xs">
              <span className="w-2 h-2 rounded-full border-[2px] border-[#101418] border-t-transparent animate-spin" />
              Running Stage {pipelineStage}/8 ({formatTimer(elapsedSeconds)})
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!isFinished && (
            <button
              onClick={() => {
                setPipelineStage(8);
                setInspectedStage(8);
                setIsFinished(true);
              }}
              className="font-mono text-xs text-[#1E43D8] hover:underline font-semibold cursor-pointer"
            >
              Skip to finish ⚡
            </button>
          )}

          {/* Cancel run: ivory button with 1.5px ink border (secondary button style) */}
          <button
            onClick={onCancel}
            className="btn-ivory text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer text-[#101418]"
          >
            {isFinished ? "Back to upload" : "Cancel run"}
          </button>
        </div>
      </div>

      {/* Stepper Bar */}
      <Stepper
        currentStageId={pipelineStage}
        activeStageId={inspectedStage}
        onSelectStage={handleStageSelect}
        isRunning={!isFinished}
        liveElapsedSeconds={elapsedSeconds}
      />

      {/* Main Workspace + Right Agents Feed */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left / Center Stage Workspace with drafting paper grid background */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F6EFDB] bg-drafting-grid">
          <div className="w-full max-w-7xl mx-auto space-y-5">
            {/* Stage Inspection Bar */}
            {inspectedStage !== pipelineStage && (
              <div className="bg-[#FFC53D]/30 border-[1.5px] border-[#101418] rounded-lg px-3.5 py-2 text-xs font-mono flex items-center justify-between text-[#101418] shadow-hard-xs">
                <span>
                  Inspecting Stage {inspectedStage}: <strong>{PIPELINE_STAGES.find(s => s.id === inspectedStage)?.name}</strong>
                </span>
                <button
                  onClick={() => setInspectedStage(pipelineStage)}
                  className="font-bold underline hover:text-[#1E43D8] cursor-pointer ml-2"
                >
                  Return to active ({pipelineStage})
                </button>
              </div>
            )}

            {/* Active Stage Card Switching */}
            {inspectedStage === 1 && <PartSummary />}
            {inspectedStage === 2 && <ViewGrid />}
            {inspectedStage === 3 && (
              <OrientationView isPending={pipelineStage === 3 && !isFinished} />
            )}
            {inspectedStage === 4 && <FeatureTreeTable />}
            {inspectedStage === 5 && <ViewSelectionTable />}
            {inspectedStage === 6 && <DerivedViews />}
            {inspectedStage === 7 && <DimensionTable />}
            {inspectedStage === 8 && <DrawingSheet />}
          </div>
        </div>

        {/* Right: Agents Streaming Log */}
        <AgentsFeed currentStageId={pipelineStage} isRunning={!isFinished} />
      </div>
    </div>
  );
}
