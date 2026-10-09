"use client";

import React from "react";
import { PIPELINE_STAGES } from "../mockData";

interface StepperProps {
  currentStageId: number;
  activeStageId: number;
  onSelectStage: (stageId: number) => void;
  isRunning: boolean;
  liveElapsedSeconds: number;
}

export function Stepper({
  currentStageId,
  activeStageId,
  onSelectStage,
  isRunning,
  liveElapsedSeconds,
}: StepperProps) {
  return (
    <div className="w-full bg-[#FBF6E9] border-b-[1.5px] border-[#101418] px-4 sm:px-6 py-2.5 select-none">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
        {PIPELINE_STAGES.map((step) => {
          const isDone = step.id < currentStageId || (!isRunning && currentStageId >= 8);
          const isCurrent = step.id === currentStageId && isRunning;
          const isSelected = step.id === activeStageId;

          // Format live timer if current
          const formattedLiveTime = `${liveElapsedSeconds.toFixed(1)}s`;

          return (
            <button
              key={step.id}
              onClick={() => onSelectStage(step.id)}
              disabled={step.id > currentStageId}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all text-left ${
                step.id <= currentStageId
                  ? "cursor-pointer hover:bg-[#F0E8D4]"
                  : "opacity-40 cursor-not-allowed"
              } ${
                isSelected
                  ? "bg-[#E8EEFC] border-[1.5px] border-[#101418] shadow-hard-xs"
                  : "border border-transparent"
              }`}
            >
              {/* Stepper Node: Pending, Active, Done */}
              <div className="shrink-0">
                {isDone ? (
                  /* Done: Royal-blue fill, white check, 2px ink border */
                  <div className="w-5 h-5 rounded-full bg-[#1E43D8] text-white border-2 border-[#101418] flex items-center justify-center shadow-2xs">
                    <svg className="w-2.5 h-2.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : isCurrent ? (
                  /* Active: Sunflower yellow #FFC53D fill, 2px ink border, pulsing ink ring */
                  <div className="w-5 h-5 rounded-full bg-[#FFC53D] text-[#101418] border-2 border-[#101418] ring-2 ring-[#101418]/60 flex items-center justify-center shadow-2xs animate-pulse">
                    <span className="font-mono text-[9px] font-bold text-[#101418]">
                      {step.id}
                    </span>
                  </div>
                ) : (
                  /* Pending: Ivory circle, 2px ink border */
                  <div className="w-5 h-5 rounded-full bg-[#FFFBF0] text-[#101418] border-2 border-[#101418] text-[9px] font-mono font-bold flex items-center justify-center">
                    {step.id}
                  </div>
                )}
              </div>

              {/* Step Title + Elapsed time in Plex Mono 11px */}
              <div className="flex flex-col leading-tight">
                <span
                  className={`font-semibold text-[12px] ${
                    isSelected
                      ? "text-[#1E43D8]"
                      : isDone
                      ? "text-[#101418]"
                      : isCurrent
                      ? "text-[#101418]"
                      : "text-[#101418]/60"
                  }`}
                >
                  {step.name}
                </span>
                <span className="font-mono text-[11px] text-[#101418]/60">
                  {isCurrent
                    ? formattedLiveTime
                    : isDone
                    ? step.nominalDuration
                    : step.nominalDuration}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
