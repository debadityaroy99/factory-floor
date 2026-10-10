"use client";

import React from "react";
import { MOCK_RUNS, RunHistoryItem } from "../mockData";

interface SidebarProps {
  onNewDrawing: () => void;
  selectedRunId: string;
  onSelectRun: (runId: string) => void;
}

export function Sidebar({ onNewDrawing, selectedRunId, onSelectRun }: SidebarProps) {
  return (
    <aside className="w-[264px] bg-[#FBF6E9] border-r-[1.5px] border-[#101418] flex flex-col shrink-0 select-none overflow-hidden h-full">
      {/* Top Action Button */}
      <div className="p-3 pb-1">
        <button
          onClick={onNewDrawing}
          className="btn-royal w-full h-8 px-2.5 rounded-lg text-white text-[13px] font-semibold flex items-center justify-center gap-2 cursor-pointer"
        >
          <svg className="w-4 h-4 text-white shrink-0 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span className="truncate">New drawing</span>
        </button>
      </div>

      {/* Runs Section Label */}
      <div className="px-3 pt-3.5 pb-1">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[#101418]/70 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-[#FF6B2C] border border-[#101418] inline-block shrink-0" />
          <span>RUNS</span>
        </div>
      </div>

      {/* Runs List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1 text-left pt-1">
        {MOCK_RUNS.map((run) => {
          const isSelected = run.id === selectedRunId;
          return (
            <button
              key={run.id}
              onClick={() => onSelectRun(run.id)}
              className={`w-full p-2 rounded-lg text-left transition-all cursor-pointer flex items-start gap-2 ${
                isSelected
                  ? "bg-[#E8EEFC] text-[#101418] font-medium border-[1.5px] border-[#101418] shadow-hard-xs"
                  : "text-[#101418]/80 hover:bg-[#F0E9D8] border border-transparent"
              }`}
            >
              {/* Status Icon */}
              <div className="mt-0.5 shrink-0">
                {run.status === "warning" ? (
                  <svg className="w-3.5 h-3.5 text-[#FF6B2C]" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : run.status === "running" ? (
                  <div className="w-3.5 h-3.5 rounded-full border-[2px] border-[#1E43D8] border-t-transparent animate-spin" />
                ) : (
                  /* Completed = royal-blue circle-check */
                  <svg className="w-3.5 h-3.5 text-[#1E43D8]" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>

              {/* Title & Timestamp */}
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium leading-tight truncate text-[#101418]">
                  {run.name}
                </div>
                <div className="font-mono text-[10px] text-[#101418]/50 leading-normal truncate mt-0.5">
                  {run.timestamp} · {run.stagesCompleted}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
