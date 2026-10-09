"use client";

import React from "react";

export function DerivedViews() {
  return (
    <div className="w-full bg-[#FFFBF0] rounded-xl border-2 border-[#101418] p-5 sm:p-6 shadow-hard-sm">
      <div className="flex items-center justify-between pb-4 border-b-[1.5px] border-[#101418]/20">
        <div>
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-[#101418]">
            Derived Views
          </h2>
          <p className="font-mono text-[11px] text-[#101418]/60 mt-0.5">
            Auxiliary, detail, or section views automatically requested by the classifier
          </p>
        </div>
        <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#FFFBF0] text-[#101418] border border-[#101418]/40">
          0 views needed
        </span>
      </div>

      <div className="py-12 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-[#E8EEFC] text-[#1E43D8] border-2 border-[#101418] flex items-center justify-center mb-3 shadow-hard-xs">
          <svg className="w-6 h-6 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-display text-sm font-bold text-[#101418] mb-1">
          The classifier called for none.
        </h3>
        <p className="font-sans text-xs text-[#101418]/70 max-w-sm">
          All critical geometry, internal bores, and mating faces are fully visible and dimensionable across the three selected principal views (front, top, right).
        </p>
      </div>
    </div>
  );
}
