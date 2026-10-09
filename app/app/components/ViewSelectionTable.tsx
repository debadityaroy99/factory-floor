"use client";

import React from "react";
import { VIEW_SELECTION_ROWS } from "../mockData";

export function ViewSelectionTable() {
  return (
    <div className="w-full bg-[#FFFBF0] rounded-xl border-2 border-[#101418] p-5 sm:p-6 shadow-hard-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-[1.5px] border-[#101418]/20 pb-3 mb-4">
        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-[#101418]">
            View Selection Reasoning
          </h3>
          <p className="font-mono text-[11px] text-[#101418]/60 mt-0.5">
            Geometric necessity vs. drafting redundancy evaluation
          </p>
        </div>
        <span className="font-mono text-xs font-bold text-[#1E43D8] bg-[#E8EEFC] px-2.5 py-1 rounded-md border-[1.5px] border-[#101418] shadow-2xs">
          Minimal basis: 3 views
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border-[1.5px] border-[#101418] shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#E8EEFC] border-b-[1.5px] border-[#101418] text-[#101418] font-mono text-[11px] uppercase tracking-wider">
              <th className="py-2.5 px-3 font-bold w-24">View</th>
              <th className="py-2.5 px-3 font-bold w-24">Required</th>
              <th className="py-2.5 px-3 font-bold">Reasoning</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#101418]/15 bg-[#FFFBF0]">
            {VIEW_SELECTION_ROWS.map((row) => (
              <tr key={row.view} className="hover:bg-[#F3ECCE]/60 transition-colors">
                <td className="py-3 px-3 font-mono font-bold text-[#101418] uppercase">
                  {row.view}
                </td>
                <td className="py-3 px-3">
                  {row.required ? (
                    <span className="font-mono text-[11px] font-bold text-white bg-[#1E43D8] border border-[#101418] px-2 py-0.5 rounded shadow-2xs">
                      yes
                    </span>
                  ) : (
                    <span className="font-mono text-[11px] font-medium text-[#101418]/60 bg-[#FFFBF0] border border-[#101418] px-2 py-0.5 rounded">
                      no
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 font-sans text-[#101418] leading-relaxed">
                  {row.reasoning}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
