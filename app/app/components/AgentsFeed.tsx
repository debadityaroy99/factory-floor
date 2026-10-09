"use client";

import React, { useEffect, useRef } from "react";
import { AGENT_LOG_GROUPS, AgentLogGroup } from "../mockData";

interface AgentsFeedProps {
  currentStageId: number;
  isRunning: boolean;
}

export function AgentsFeed({ currentStageId, isRunning }: AgentsFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter logs visible up to currentStageId
  const visibleLogs = AGENT_LOG_GROUPS.filter(
    (group) => group.stageId <= currentStageId
  );

  // Auto-scroll to bottom on new visible logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentStageId, visibleLogs.length]);

  return (
    <aside className="w-80 lg:w-[320px] shrink-0 bg-[#FBF6E9] border-l-[1.5px] border-[#101418] flex flex-col h-full overflow-hidden text-xs">
      {/* Feed Header */}
      <div className="px-4 py-3 border-b-[1.5px] border-[#101418] flex items-center justify-between bg-[#FBF6E9] shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-display font-semibold text-xs tracking-tight text-[#101418]">
            Agents Log
          </span>
          <span className="text-[10px] text-[#101418]/60 font-mono uppercase tracking-wider">stream</span>
        </div>

        <div className="flex items-center gap-1.5 font-mono">
          <span
            className={`w-2 h-2 rounded-full border border-[#101418] ${
              isRunning
                ? "bg-[#FFC53D] animate-pulse"
                : "bg-[#101418]/30"
            }`}
          />
          <span className="text-[11px] font-bold text-[#101418]">
            {isRunning ? "streaming" : "idle"}
          </span>
        </div>
      </div>

      {/* Log entries container */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-3 font-mono select-text bg-[#FBF6E9]"
      >
        {visibleLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center text-[#101418]/50 font-mono p-4 text-xs">
            <p>Waiting for agent pipeline...</p>
          </div>
        ) : (
          visibleLogs.map((group) => {
            const isCurrent = group.stageId === currentStageId && isRunning;

            return (
              <div
                key={group.stageId}
                className={`rounded-lg border-[1.5px] border-[#101418] transition-all bg-[#FFFBF0] ${
                  isCurrent ? "shadow-hard-sm ring-1 ring-[#101418]" : "shadow-hard-xs"
                } p-2.5 space-y-2`}
              >
                {/* Group Stage Header */}
                <div className="flex items-center justify-between border-b border-[#101418]/20 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-[2px] bg-[#E8EEFC] border border-[#101418] text-[#101418] font-mono text-[9px] flex items-center justify-center font-bold">
                      {group.stageId}
                    </span>
                    <span className="font-display font-semibold text-[#101418] text-[11px]">
                      {group.stageName}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#101418]/60">
                    {group.model && (
                      <span className="px-1.5 py-0.2 rounded bg-[#E8EEFC] text-[#1E43D8] border border-[#101418] text-[9px] font-bold">
                        {group.model}
                      </span>
                    )}
                    <span>{group.duration}</span>
                  </div>
                </div>

                {/* Group Entries */}
                <div className="space-y-1.5 text-[11px] leading-relaxed">
                  {group.entries.map((entry, idx) => {
                    if (entry.type === "info") {
                      return (
                        <div key={idx} className="text-[#101418]/70 flex items-start gap-1 font-mono text-[11px]">
                          <span className="text-[#101418]/40 select-none">›</span>
                          <span className="break-all">{entry.text}</span>
                        </div>
                      );
                    }

                    if (entry.type === "status") {
                      return (
                        <div
                          key={idx}
                          className="text-[#1E43D8] bg-[#E8EEFC] border border-[#101418] rounded px-1.5 py-0.5 text-[10.5px] font-mono font-bold shadow-2xs"
                        >
                          ✓ {entry.text}
                        </div>
                      );
                    }

                    if (entry.type === "tool") {
                      const isRunningLine = isCurrent && idx === group.entries.length - 1;

                      return (
                        <div
                          key={idx}
                          className={`rounded border border-[#101418] p-1.5 space-y-1 shadow-2xs font-mono text-xs transition-colors ${
                            isRunningLine
                              ? "bg-[#FFC53D]/40 border-l-[3px] border-l-[#101418]"
                              : "bg-[#FFFBF0]"
                          }`}
                        >
                          {entry.turn && (
                            <div className="flex items-center justify-between text-[10px] text-[#101418]/60 border-b border-[#101418]/15 pb-0.5 font-mono">
                              <span>{entry.turn}</span>
                              {entry.durationMs && (
                                <span className="font-mono text-[#101418]/50">{entry.durationMs}</span>
                              )}
                            </div>
                          )}

                          <div className="flex items-start gap-1 text-[11px]">
                            <span className="text-[#1E43D8] font-bold select-none">λ</span>
                            <span className="font-bold text-[#101418]">
                              {entry.toolCallName}
                            </span>
                          </div>

                          {entry.toolCallArgs && (
                            <div className="text-[10px] text-[#101418] bg-[#F6EFDB] px-1 py-0.5 rounded break-all border border-[#101418]/30 font-mono">
                              {entry.toolCallArgs}
                            </div>
                          )}

                          {(entry.tokensIn || entry.tokensOut) && (
                            <div className="flex justify-end gap-1.5 text-[9px] text-[#101418]/50 font-mono">
                              <span>in: {entry.tokensIn}</span>
                              <span>·</span>
                              <span>out: {entry.tokensOut}</span>
                            </div>
                          )}
                        </div>
                      );
                    }

                    if (entry.type === "json") {
                      return (
                        <div
                          key={idx}
                          className="bg-[#101418] text-[#FFFBF0] rounded p-2 text-[10px] overflow-x-auto border border-[#101418] shadow-inner font-mono"
                        >
                          {entry.turn && (
                            <div className="text-[#FFFBF0]/60 pb-1 mb-1 border-b border-[#FFFBF0]/20 flex justify-between font-mono">
                              <span>{entry.turn}</span>
                              <span>tokens: {entry.tokensOut}</span>
                            </div>
                          )}
                          <pre className="font-mono whitespace-pre text-[10px] text-[#FFC53D]">
                            {entry.jsonSnippet}
                          </pre>
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>

                {/* Footer metrics if available */}
                {group.footer && (
                  <div className="text-[9.5px] font-mono text-[#101418]/50 border-t border-[#101418]/15 pt-1 text-right">
                    {group.footer}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Feed Bottom Context Counter */}
      <div className="px-3 py-2 border-t-[1.5px] border-[#101418] bg-[#FBF6E9] flex items-center justify-between font-mono text-[10px] text-[#101418]/70 shrink-0">
        <span>Context window</span>
        <span className="font-mono font-bold text-[#101418]">93k / 2.0M tokens</span>
      </div>
    </aside>
  );
}
