"use client";

import React from "react";
import { FEATURE_TREE_ROWS } from "../mockData";

export function FeatureTreeTable() {
  return (
    <div className="w-full bg-[#FFFBF0] rounded-xl border-2 border-[#101418] p-5 sm:p-6 shadow-hard-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-[1.5px] border-[#101418]/20 pb-3 mb-4">
        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-[#101418]">
            Manufacturing Feature Tree (F1–F10)
          </h3>
          <p className="font-mono text-[11px] text-[#101418]/60 mt-0.5">
            Autonomous topology extraction &amp; toolpath classification
          </p>
        </div>
        <span className="font-mono text-xs font-bold text-[#1E43D8] bg-[#E8EEFC] px-2.5 py-1 rounded-md border-[1.5px] border-[#101418] shadow-2xs">
          10 features synthesized
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border-[1.5px] border-[#101418] shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#E8EEFC] border-b-[1.5px] border-[#101418] text-[#101418] font-mono text-[11px] uppercase tracking-wider">
              <th className="py-2.5 px-3 font-bold">ID</th>
              <th className="py-2.5 px-3 font-bold">Type</th>
              <th className="py-2.5 px-3 font-bold">Faces</th>
              <th className="py-2.5 px-3 font-bold">Dims</th>
              <th className="py-2.5 px-3 font-bold">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#101418]/15 bg-[#FFFBF0]">
            {FEATURE_TREE_ROWS.map((row) => (
              <tr key={row.id} className="hover:bg-[#F3ECCE]/60 transition-colors">
                <td className="py-2.5 px-3 font-mono font-bold text-[#101418]">
                  {row.id}
                </td>
                <td className="py-2.5 px-3">
                  <span className="px-1.5 py-0.5 rounded bg-[#FFFBF0] border border-[#101418] font-mono text-[11px] font-semibold text-[#101418]">
                    {row.type}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex flex-wrap gap-1.5">
                    {row.faces.map((f, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#E8EEFC] text-[#101418] border border-[#101418] shadow-2xs"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-2.5 px-3 font-mono font-medium text-[#101418]">
                  {row.dims}
                </td>
                <td className="py-2.5 px-3 font-sans text-[#101418]/70 max-w-xs truncate">
                  {row.notes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
