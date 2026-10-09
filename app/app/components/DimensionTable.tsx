"use client";

import React from "react";
import { DIMENSION_ROWS } from "../mockData";

export function DimensionTable() {
  return (
    <div className="w-full bg-[#FFFBF0] rounded-xl border-2 border-[#101418] p-5 sm:p-6 shadow-hard-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b-[1.5px] border-[#101418]/20">
        <div>
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-[#101418]">
            Dimension Set (GD&amp;T)
          </h2>
          <p className="font-mono text-[11px] text-[#101418]/60 mt-0.5">
            Geometric dimensioning &amp; tolerancing constraints synthesized per ASME Y14.5
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-[#101418]/70 font-semibold">Datums:</span>
          <div className="flex items-center gap-1.5 font-mono">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#E8EEFC] border border-[#101418] rounded text-xs font-bold text-[#101418] shadow-2xs">
              <span className="text-[#1E43D8]">A</span>
              <span className="text-[#101418]/50 text-[10px]">#59</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#E8EEFC] border border-[#101418] rounded text-xs font-bold text-[#101418] shadow-2xs">
              <span className="text-[#1E43D8]">B</span>
              <span className="text-[#101418]/50 text-[10px]">#14</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#E8EEFC] border border-[#101418] rounded text-xs font-bold text-[#101418] shadow-2xs">
              <span className="text-[#1E43D8]">C</span>
              <span className="text-[#101418]/50 text-[10px]">#55</span>
            </span>
          </div>
          <span className="font-mono text-xs ml-2 px-2.5 py-0.5 rounded-md font-bold bg-[#E8EEFC] text-[#1E43D8] border-[1.5px] border-[#101418] shadow-2xs">
            {DIMENSION_ROWS.length} constraints
          </span>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border-[1.5px] border-[#101418] shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#E8EEFC] border-b-[1.5px] border-[#101418] text-[#101418] font-mono text-[11px] uppercase tracking-wider">
              <th className="py-2.5 px-3 font-bold w-12 text-center">#</th>
              <th className="py-2.5 px-3 font-bold w-24">Kind</th>
              <th className="py-2.5 px-3 font-bold">Text</th>
              <th className="py-2.5 px-3 font-bold">Attaches to</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#101418]/15 bg-[#FFFBF0] font-mono">
            {DIMENSION_ROWS.map((row) => (
              <tr key={row.id} className="hover:bg-[#F3ECCE]/60 transition-colors">
                <td className="py-2.5 px-3 font-bold text-[#101418]/50 text-center">
                  {row.id}
                </td>
                <td className="py-2.5 px-3 font-sans">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono font-semibold uppercase border border-[#101418] ${
                      row.kind === "linear"
                        ? "bg-[#FFFBF0] text-[#101418]"
                        : row.kind === "leader"
                        ? "bg-[#E8EEFC] text-[#1E43D8]"
                        : "bg-[#FFC53D]/40 text-[#101418]"
                    }`}
                  >
                    {row.kind}
                  </span>
                </td>
                <td className="py-2.5 px-3 font-bold text-[#101418] text-[13px]">
                  {row.text}
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {row.attachesTo.map((face, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#E8EEFC] text-[#101418] font-mono font-bold text-[11px] border border-[#101418] shadow-2xs"
                      >
                        {face}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
