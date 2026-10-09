"use client";

import React from "react";

export function PartSummary() {
  const handleDownloadFaceTable = (e: React.MouseEvent) => {
    e.preventDefault();
    const content = `FACE_TABLE // CLEVIS.STEP\nSOLID_ID: 1\nTOTAL_FACES: 114\nCAD_FRAME: SOLIDWORKS\nBOUNDING_BOX: 150.0 x 120.0 x 88.0 mm\nUNITS: MM\n\nFACES:\n` +
      Array.from({ length: 114 }, (_, i) => `FACE_${i + 1}: CYLINDRICAL / PLANAR / TOROIDAL`).join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "face-table.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full bg-[#FFFBF0] rounded-xl border-2 border-[#101418] p-5 sm:p-6 shadow-hard-sm">
      <div className="flex items-center justify-between border-b-[1.5px] border-[#101418]/20 pb-3 mb-5">
        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-[#101418]">
            Part Definition
          </h3>
          <p className="font-mono text-[11px] text-[#101418]/60 mt-0.5">
            Geometry extracted from STEP AP214 protocol
          </p>
        </div>
        <button
          onClick={handleDownloadFaceTable}
          className="btn-ivory text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 font-mono font-semibold text-[#101418] cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>face-table.txt</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Definition Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-[#FFFBF0] border-[1.5px] border-[#101418] shadow-2xs">
            <span className="font-mono text-[10px] font-semibold text-[#101418]/60 uppercase tracking-wider block">File</span>
            <span className="font-mono font-bold text-sm text-[#101418] mt-0.5 block">clevis.step</span>
          </div>

          <div className="p-3 rounded-lg bg-[#FFFBF0] border-[1.5px] border-[#101418] shadow-2xs">
            <span className="font-mono text-[10px] font-semibold text-[#101418]/60 uppercase tracking-wider block">Faces</span>
            <span className="font-mono font-bold text-sm text-[#101418] mt-0.5 block">114</span>
          </div>

          <div className="p-3 rounded-lg bg-[#FFFBF0] border-[1.5px] border-[#101418] shadow-2xs">
            <span className="font-mono text-[10px] font-semibold text-[#101418]/60 uppercase tracking-wider block">Solids</span>
            <span className="font-mono font-bold text-sm text-[#101418] mt-0.5 block">1</span>
          </div>

          <div className="p-3 rounded-lg bg-[#FFFBF0] border-[1.5px] border-[#101418] shadow-2xs">
            <span className="font-mono text-[10px] font-semibold text-[#101418]/60 uppercase tracking-wider block">Units</span>
            <span className="font-mono font-bold text-sm text-[#101418] mt-0.5 block">mm</span>
          </div>

          <div className="p-3 rounded-lg bg-[#FFFBF0] border-[1.5px] border-[#101418] shadow-2xs col-span-2 sm:col-span-1">
            <span className="font-mono text-[10px] font-semibold text-[#101418]/60 uppercase tracking-wider block">Bounding box</span>
            <span className="font-mono font-bold text-sm text-[#101418] mt-0.5 block">150 × 120 × 88 mm</span>
          </div>

          <div className="p-3 rounded-lg bg-[#FFFBF0] border-[1.5px] border-[#101418] shadow-2xs col-span-2 sm:col-span-1">
            <span className="font-mono text-[10px] font-semibold text-[#101418]/60 uppercase tracking-wider block">CAD frame</span>
            <span className="font-mono font-bold text-sm text-[#101418] mt-0.5 block">solidworks</span>
          </div>
        </div>

        {/* 3D Wireframe Preview Graphic */}
        <div className="h-44 rounded-lg bg-[#FFFBF0] border-[1.5px] border-[#101418] flex flex-col items-center justify-center p-3 relative overflow-hidden shadow-2xs">
          <div className="absolute top-2 left-2 text-[10px] font-mono font-semibold text-[#101418]/70 uppercase tracking-wider">
            ISO Axonometric // clevis
          </div>
          <svg className="w-36 h-32" viewBox="0 0 160 140" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            {/* Base block */}
            <polygon points="30,80 80,105 130,80 80,55" fill="#E8EEFC" stroke="#101418" />
            <polygon points="30,80 80,105 80,120 30,95" fill="#DCE7FB" stroke="#101418" />
            <polygon points="80,105 130,80 130,95 80,120" fill="#E8EEFC" stroke="#101418" />

            {/* Left Clevis Arm */}
            <path d="M45,72 L45,35 A 15 15 0 0 1 70,35 L70,60" fill="#E8EEFC" stroke="#101418" />
            <circle cx="58" cy="35" r="6" fill="#FFFBF0" stroke="#101418" />

            {/* Right Clevis Arm */}
            <path d="M90,60 L90,35 A 15 15 0 0 1 115,35 L115,72" fill="#E8EEFC" stroke="#101418" />
            <circle cx="102" cy="35" r="6" fill="#FFFBF0" stroke="#101418" />

            {/* Pivot Axis line */}
            <line x1="50" y1="35" x2="110" y2="35" stroke="#1E43D8" strokeDasharray="3 3" />
          </svg>
          <div className="text-[10px] text-[#101418]/70 font-mono mt-1">
            Vol: 184,320 mm³ · Mass: 1.44 kg (Steel)
          </div>
        </div>
      </div>
    </div>
  );
}
