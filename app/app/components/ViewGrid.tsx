"use client";

import React from "react";

interface ViewCardData {
  id: string;
  name: string;
  selected: boolean;
  svg: React.ReactNode;
}

export function ViewGrid() {
  const views: ViewCardData[] = [
    {
      id: "front",
      name: "front",
      selected: true,
      svg: (
        <svg viewBox="0 0 100 80" className="w-full h-full stroke-[#101418]" fill="none" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          {/* Base plate */}
          <rect x="15" y="55" width="70" height="15" rx="1" fill="#E8EEFC" stroke="#101418" />
          <circle cx="28" cy="62.5" r="3.5" stroke="#101418" strokeDasharray="2 2" />
          <circle cx="72" cy="62.5" r="3.5" stroke="#101418" strokeDasharray="2 2" />
          {/* Upright Clevis arms */}
          <path d="M30 55 L30 18 Q30 10 38 10 L44 10 Q48 10 48 16 L48 55" fill="#FFFBF0" stroke="#101418" />
          <path d="M52 55 L52 16 Q52 10 56 10 L62 10 Q70 10 70 18 L70 55" fill="#FFFBF0" stroke="#101418" />
          <circle cx="39" cy="22" r="5" stroke="#101418" strokeDasharray="2 2" />
          <circle cx="61" cy="22" r="5" stroke="#101418" strokeDasharray="2 2" />
          {/* Central clearance gap */}
          <rect x="48" y="30" width="4" height="25" stroke="#1E43D8" fill="#FFFBF0" />
        </svg>
      ),
    },
    {
      id: "back",
      name: "back",
      selected: false,
      svg: (
        <svg viewBox="0 0 100 80" className="w-full h-full stroke-[#101418]/60" fill="none" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="15" y="55" width="70" height="15" rx="1" fill="#FFFBF0" stroke="#101418]/60" />
          <path d="M30 55 L30 18 Q30 10 38 10 L44 10 Q48 10 48 16 L48 55" fill="#FFFBF0" stroke="#101418]/60" />
          <path d="M52 55 L52 16 Q52 10 56 10 L62 10 Q70 10 70 18 L70 55" fill="#FFFBF0" stroke="#101418]/60" />
          <line x1="15" y1="62" x2="85" y2="62" strokeDasharray="2 2" />
        </svg>
      ),
    },
    {
      id: "right",
      name: "right",
      selected: true,
      svg: (
        <svg viewBox="0 0 100 80" className="w-full h-full stroke-[#101418]" fill="none" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          {/* Base */}
          <rect x="25" y="60" width="50" height="12" rx="1" fill="#E8EEFC" stroke="#101418" />
          {/* Arm curve and eye */}
          <path d="M35 60 L35 32 Q35 15 50 15 Q65 15 65 32 L65 60" fill="#FFFBF0" stroke="#101418" />
          <circle cx="50" cy="32" r="8" fill="#FFFBF0" stroke="#101418" />
          <circle cx="50" cy="32" r="4.5" stroke="#101418" />
          {/* Centerline */}
          <line x1="50" y1="10" x2="50" y2="50" stroke="#1E43D8" strokeDasharray="2 2" />
        </svg>
      ),
    },
    {
      id: "left",
      name: "left",
      selected: false,
      svg: (
        <svg viewBox="0 0 100 80" className="w-full h-full stroke-[#101418]/60" fill="none" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="25" y="60" width="50" height="12" rx="1" fill="#FFFBF0" stroke="#101418]/60" />
          <path d="M35 60 L35 32 Q35 15 50 15 Q65 15 65 32 L65 60" fill="#FFFBF0" stroke="#101418]/60" />
          <circle cx="50" cy="32" r="8" strokeDasharray="2 2" />
        </svg>
      ),
    },
    {
      id: "top",
      name: "top",
      selected: true,
      svg: (
        <svg viewBox="0 0 100 80" className="w-full h-full stroke-[#101418]" fill="none" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          {/* Base outer contour */}
          <rect x="15" y="20" width="70" height="40" rx="3" fill="#E8EEFC" stroke="#101418" />
          {/* 4 Mounting holes */}
          <circle cx="25" cy="28" r="3.5" fill="#FFFBF0" stroke="#101418" />
          <circle cx="25" cy="52" r="3.5" fill="#FFFBF0" stroke="#101418" />
          <circle cx="75" cy="28" r="3.5" fill="#FFFBF0" stroke="#101418" />
          <circle cx="75" cy="52" r="3.5" fill="#FFFBF0" stroke="#101418" />
          {/* Central boss & clevis gap */}
          <rect x="38" y="20" width="24" height="40" fill="#FFFBF0" stroke="#101418" />
          <rect x="46" y="20" width="8" height="40" stroke="#1E43D8" strokeDasharray="2 2" />
          <line x1="15" y1="40" x2="85" y2="40" stroke="#101418" strokeOpacity="0.5" strokeDasharray="3 2" />
        </svg>
      ),
    },
    {
      id: "bottom",
      name: "bottom",
      selected: false,
      svg: (
        <svg viewBox="0 0 100 80" className="w-full h-full stroke-[#101418]/60" fill="none" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="15" y="20" width="70" height="40" rx="3" fill="#FFFBF0" stroke="#101418]/60" />
          <circle cx="25" cy="28" r="3.5" strokeDasharray="2 2" />
          <circle cx="25" cy="52" r="3.5" strokeDasharray="2 2" />
          <circle cx="75" cy="28" r="3.5" strokeDasharray="2 2" />
          <circle cx="75" cy="52" r="3.5" strokeDasharray="2 2" />
          <rect x="46" y="20" width="8" height="40" strokeDasharray="2 2" />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full bg-[#FFFBF0] rounded-xl border-2 border-[#101418] p-5 sm:p-6 shadow-hard-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-[1.5px] border-[#101418]/20 pb-3 mb-5">
        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-[#101418]">
            Six Orthogonal Views
          </h3>
          <p className="font-mono text-[11px] text-[#101418]/60 mt-0.5">
            Candidate viewpoints evaluated for feature coverage &amp; geometric redundancy
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-[#1E43D8] font-bold bg-[#E8EEFC] border-[1.5px] border-[#101418] px-2.5 py-0.5 rounded-full shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1E43D8]" />
            3 Selected
          </span>
          <span className="flex items-center gap-1.5 text-[#101418]/60 font-medium bg-[#FFFBF0] border border-[#101418]/40 px-2.5 py-0.5 rounded-full">
            3 Dropped
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {views.map((v) => (
          <div
            key={v.id}
            className={`rounded-lg p-3 flex flex-col justify-between transition-all ${
              v.selected
                ? "border-2 border-[#101418] bg-[#FFFBF0] shadow-hard-xs"
                : "border-[1.5px] border-[#101418]/30 bg-[#FFFBF0]/60 opacity-60"
            }`}
          >
            {/* 2D Line Drawing Panel */}
            <div className="h-28 sm:h-32 rounded bg-[#FFFBF0] border border-[#101418]/20 flex items-center justify-center p-2 mb-2">
              {v.svg}
            </div>

            {/* Caption & Status Tag */}
            <div className="flex items-center justify-between pt-1">
              <span className="font-mono text-xs font-bold text-[#101418] uppercase">
                {v.name}
              </span>
              {v.selected ? (
                <span className="font-mono text-[10px] font-bold text-white bg-[#1E43D8] border border-[#101418] px-2 py-0.5 rounded shadow-2xs">
                  selected
                </span>
              ) : (
                <span className="font-mono text-[10px] font-medium text-[#101418]/60 bg-[#FFFBF0] border border-[#101418]/40 px-2 py-0.5 rounded">
                  dropped
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
