"use client";

import React from "react";
import { ModuleItem } from "./FeatureRail";

interface PlaceholderModuleProps {
  module: ModuleItem;
}

export function PlaceholderModule({ module }: PlaceholderModuleProps) {
  const Icon = module.icon;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 animate-slide-up">
      <div className="w-full max-w-lg bg-[#FFFBF0] border-2 border-[#101418] rounded-[16px] p-8 sm:p-10 shadow-hard text-center space-y-5">
        {/* Module Icon in styled circle */}
        <div className="w-16 h-16 rounded-2xl bg-[#E8EEFC] border-2 border-[#101418] flex items-center justify-center mx-auto text-[#1E43D8] shadow-hard-xs">
          <Icon className="w-8 h-8 stroke-[2]" />
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          {module.number && (
            <div className="font-mono text-xs font-bold text-[#1E43D8] uppercase tracking-widest">
              MODULE {module.number}
            </div>
          )}
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#101418] tracking-tight">
            {module.label}
          </h2>
        </div>

        {/* Description */}
        <p className="font-sans text-[14px] sm:text-[15px] text-[#3C4356] leading-relaxed max-w-md mx-auto">
          {module.description}
        </p>

        {/* Butter chip: IN PREPARATION */}
        <div className="pt-2">
          <span className="inline-flex items-center gap-1.5 bg-[#FFF3C4] border-[1.5px] border-[#101418] text-[#101418] px-4 py-1.5 rounded-full font-mono text-[11px] font-bold uppercase tracking-wider shadow-hard-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#101418]" />
            <span>IN PREPARATION</span>
          </span>
        </div>

        {/* Footnote note */}
        <div className="pt-3 border-t border-[#101418]/15 text-[11px] font-mono text-[#101418]/50">
          Scheduled for upcoming release · Architecture review rules locked
        </div>
      </div>
    </div>
  );
}

