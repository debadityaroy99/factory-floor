"use client";

import React from "react";

interface OrientationViewProps {
  isPending?: boolean;
}

export function OrientationView({ isPending = false }: OrientationViewProps) {
  if (isPending) {
    return (
      <div className="w-full bg-[#FFFBF0] rounded-xl border-2 border-[#101418] p-8 shadow-hard-sm flex flex-col items-center justify-center min-h-[200px]">
        <div className="flex items-center gap-3 text-xs text-[#101418] bg-[#FFC53D] px-4 py-3 rounded-lg border-[1.5px] border-[#101418] shadow-hard-xs font-mono font-bold">
          <div className="w-4 h-4 rounded-full border-2 border-[#101418] border-t-transparent animate-spin" />
          <span>Gemini is deciding whether to turn the part…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#FFFBF0] rounded-xl border-2 border-[#101418] p-5 sm:p-6 shadow-hard-sm">
      <div className="border-b-[1.5px] border-[#101418]/20 pb-3 mb-5">
        <h3 className="font-display text-sm font-bold uppercase tracking-wider text-[#101418]">
          Part Orientation on Sheet
        </h3>
      </div>

      <div className="space-y-4">
        {/* Turned Status Row */}
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-[#101418]/60 font-semibold w-24">Turned</span>
          <span className="inline-flex items-center font-mono text-xs font-bold text-[#101418] bg-[#FFFBF0] border-[1.5px] border-[#101418] px-2.5 py-1 rounded shadow-2xs">
            kept as modelled
          </span>
        </div>

        {/* Reasoning Row */}
        <div className="flex items-start gap-4">
          <span className="font-mono text-xs text-[#101418]/60 font-semibold w-24 shrink-0 mt-0.5">Reasoning</span>
          <p className="font-sans text-sm text-[#101418] leading-relaxed max-w-xl">
            The front view already displays the part in its natural, stable working attitude with the vertical axis of symmetry upright and the characteristic outline clearly shown. No rotation is required.
          </p>
        </div>
      </div>
    </div>
  );
}
