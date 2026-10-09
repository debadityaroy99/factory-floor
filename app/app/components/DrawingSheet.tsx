"use client";

import React, { useState } from "react";

const LAYOUT_ISSUES = [
  {
    id: 1,
    severity: "warning",
    description: "Tight clearance on datum B callout",
    detail: "Callout positioned 6mm from edge fillet F14; offset adjusted +4mm into clear margin.",
    resolution: "Resolved (Offset +4mm)",
  },
  {
    id: 2,
    severity: "warning",
    description: "Extension line proximity to bounding boundary on D9",
    detail: "Primary horizontal baseline 150mm was within 2mm of sheet border line.",
    resolution: "Resolved (Shifted view 12mm up)",
  },
  {
    id: 3,
    severity: "info",
    description: "Dimension text overlap between D4 and D5",
    detail: "Vertical dimension lines 126mm and 88mm shared overlapping placement lane.",
    resolution: "Resolved (Staggered dimension ladders)",
  },
  {
    id: 4,
    severity: "info",
    description: "Leader line intersection on D1 (2X Ø10 THRU)",
    detail: "Leader dogleg crossed hidden center-mark lines.",
    resolution: "Resolved (Angled leader 45° north-east)",
  },
  {
    id: 5,
    severity: "info",
    description: "Arrowhead direction inverted on D3 (12mm)",
    detail: "Span < 15mm required external arrowheads pointing inwards.",
    resolution: "Resolved (External arrowheads applied)",
  },
  {
    id: 6,
    severity: "info",
    description: "Centermark generation for counterbore holes F1 & F2",
    detail: "ASME Y14.2 centerline crosshairs placed across mating faces #11 and #12.",
    resolution: "Resolved (Placed)",
  },
  {
    id: 7,
    severity: "info",
    description: "Projection alignment between front and right views",
    detail: "Horizontal baseline alignment verified at 520px datum plane.",
    resolution: "Verified (Co-planar)",
  },
  {
    id: 8,
    severity: "info",
    description: "Projection alignment between top and front views",
    detail: "Vertical centerline alignment verified at 380px datum plane.",
    resolution: "Verified (Co-planar)",
  },
  {
    id: 9,
    severity: "info",
    description: "Dimension D8 (R6 TYP) radial arc clearance",
    detail: "Radial dimension leader placed on external convex corner.",
    resolution: "Resolved (Clean arc)",
  },
  {
    id: 10,
    severity: "info",
    description: "General notes boundary clipping check",
    detail: "Note block evaluated against Zone A1 / B2 margins.",
    resolution: "Verified (Clean bounds)",
  },
  {
    id: 11,
    severity: "info",
    description: "Title block compliance per ASME Y14.1M",
    detail: "Metric projection third-angle symbol rendered and validated.",
    resolution: "Verified (Standardized)",
  },
  {
    id: 12,
    severity: "info",
    description: "Datum feature symbol attachments A, B, C",
    detail: "Datum symbols boxed and attached directly to designated functional faces.",
    resolution: "Resolved (Attached)",
  },
  {
    id: 13,
    severity: "info",
    description: "Hidden line dash pitch standardization",
    detail: "Calculated stroke dasharray 4,3 across hidden inner bores.",
    resolution: "Resolved (Applied)",
  },
  {
    id: 14,
    severity: "info",
    description: "Sheet fill density balance",
    detail: "Overall view distribution occupies 64% of active printable area.",
    resolution: "Optimal (Balance OK)",
  },
];

export function DrawingSheet() {
  const [downloadNotice, setDownloadNotice] = useState(false);

  const handleDownload = () => {
    const svgElement = document.getElementById("manufy-drawing-svg");
    if (!svgElement) return;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "clevis-smart.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadNotice(true);
    setTimeout(() => setDownloadNotice(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Card: Sheet Header & Actions */}
      <div className="w-full bg-white rounded-xl border-2 border-[#101418] p-5 sm:p-6 shadow-hard-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b-[1.5px] border-[#101418]/20">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base font-bold uppercase tracking-wider text-[#101418]">
                Drawing Sheet
              </h2>
              <span className="font-mono inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#E8EEFC] text-[#1E43D8] border-[1.5px] border-[#101418] shadow-2xs">
                ASME Y14.100 Complete
              </span>
            </div>
            <p className="font-mono text-[11px] text-[#101418]/60 mt-0.5">
              Automated production drawing generated in 10m 9s · 3 principal views + axonometric iso · 14 dimensions placed
            </p>
          </div>

          <div className="flex items-center gap-3">
            {downloadNotice && (
              <span className="font-mono text-xs text-[#1E43D8] font-bold animate-fade-in">
                Downloaded clevis-smart.svg
              </span>
            )}
            <button
              onClick={handleDownload}
              className="btn-royal text-xs px-3.5 py-2 rounded-lg flex items-center gap-2 cursor-pointer font-semibold"
            >
              <svg className="w-4 h-4 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download smart.svg</span>
            </button>
          </div>
        </div>

        {/* SVG Drawing Canvas: White Background */}
        <div className="mt-5 p-3 sm:p-5 bg-stone-100/70 border-2 border-[#101418] rounded-lg overflow-x-auto flex justify-center shadow-inner">
          <div className="w-full min-w-[700px] max-w-6xl bg-white rounded border-2 border-[#101418] shadow-hard-xs select-none">
            <svg
              id="manufy-drawing-svg"
              viewBox="0 0 1200 840"
              className="w-full h-auto text-[#101418] font-sans"
              style={{ backgroundColor: "#ffffff" }}
            >
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="5"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#101418" />
                </marker>
                <marker
                  id="arrow-rev"
                  viewBox="0 0 10 10"
                  refX="5"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto"
                >
                  <path d="M 10 1.5 L 0 5 L 10 8.5 z" fill="#101418" />
                </marker>
                <pattern id="manufy-grid" width="28" height="28" patternUnits="userSpaceOnUse">
                  <path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(31,58,138,0.08)" strokeWidth="0.8" />
                </pattern>
              </defs>

              <rect width="1200" height="840" fill="url(#manufy-grid)" />

              {/* Outer Border (ASME Zone Margin) */}
              <rect x="20" y="20" width="1160" height="800" fill="none" stroke="#101418" strokeWidth="2.5" />
              {/* Inner Margin */}
              <rect x="40" y="40" width="1120" height="760" fill="none" stroke="#101418" strokeWidth="1.5" />

              {/* Zone Markers - Top & Bottom: 1 to 6 */}
              {[
                { zone: "6", x: 133 },
                { zone: "5", x: 320 },
                { zone: "4", x: 507 },
                { zone: "3", x: 693 },
                { zone: "2", x: 880 },
                { zone: "1", x: 1067 },
              ].map(({ zone, x }) => (
                <g key={`top-${zone}`}>
                  <line x1={x} y1="20" x2={x} y2="40" stroke="#101418" strokeWidth="1.2" />
                  <text x={x} y="33" textAnchor="middle" fontSize="11" fontWeight="700" fontFamily="monospace" fill="#101418">{zone}</text>
                  <line x1={x} y1="800" x2={x} y2="820" stroke="#101418" strokeWidth="1.2" />
                  <text x={x} y="813" textAnchor="middle" fontSize="11" fontWeight="700" fontFamily="monospace" fill="#101418">{zone}</text>
                </g>
              ))}

              {/* Zone Markers - Left & Right: A to D */}
              {[
                { zone: "A", y: 135 },
                { zone: "B", y: 325 },
                { zone: "C", y: 515 },
                { zone: "D", y: 705 },
              ].map(({ zone, y }) => (
                <g key={`side-${zone}`}>
                  <line x1="20" y1={y} x2="40" y2={y} stroke="#101418" strokeWidth="1.2" />
                  <text x="31" y={y + 4} textAnchor="middle" fontSize="11" fontWeight="700" fontFamily="monospace" fill="#101418">{zone}</text>
                  <line x1="1160" y1={y} x2="1180" y2={y} stroke="#101418" strokeWidth="1.2" />
                  <text x={1171} y={y + 4} textAnchor="middle" fontSize="11" fontWeight="700" fontFamily="monospace" fill="#101418">{zone}</text>
                </g>
              ))}

              {/* GENERAL NOTES BLOCK */}
              <g transform="translate(60, 60)">
                <rect width="320" height="120" fill="#FFFBF0" stroke="#101418" strokeWidth="1.5" />
                <text x="12" y="20" fontSize="11" fontWeight="700" fontFamily="monospace" fill="#101418">GENERAL NOTES (UNLESS SPECIFIED):</text>
                <text x="12" y="38" fontSize="9.5" fill="#101418" fontFamily="monospace">1. ALL DIMENSIONS ARE IN MILLIMETERS [MM].</text>
                <text x="12" y="54" fontSize="9.5" fill="#101418" fontFamily="monospace">2. TOLERANCES: .X ±0.2, .XX ±0.05, ANG ±0.5°.</text>
                <text x="12" y="70" fontSize="9.5" fill="#101418" fontFamily="monospace">3. BREAK ALL SHARP EDGES R0.3 MAX.</text>
                <text x="12" y="86" fontSize="9.5" fill="#101418" fontFamily="monospace">4. MATERIAL: 6061-T6 ALUMINUM ALLOY.</text>
                <text x="12" y="102" fontSize="9.5" fill="#101418" fontFamily="monospace">5. FINISH: CLEAR ANODIZE MIL-A-8625 TYPE II.</text>
              </g>

              {/* VIEW 1: TOP VIEW */}
              <g transform="translate(360, 100)">
                <text x="0" y="30" fontSize="11" fontWeight="700" fontFamily="monospace" fill="#101418" letterSpacing="1">TOP VIEW</text>
                
                {/* Centerlines */}
                <line x1="-20" y1="120" x2="300" y2="120" stroke="#1E43D8" strokeWidth="0.9" strokeDasharray="12,3,2,3" />
                <line x1="140" y1="20" x2="140" y2="220" stroke="#1E43D8" strokeWidth="0.9" strokeDasharray="12,3,2,3" />

                {/* Base Plate Outline */}
                <rect x="0" y="50" width="280" height="140" rx="10" fill="#FFFBF0" stroke="#101418" strokeWidth="2" />

                {/* Mounting Holes */}
                <circle cx="40" cy="80" r="14" fill="#E8EEFC" stroke="#101418" strokeWidth="1.5" />
                <circle cx="40" cy="160" r="14" fill="#E8EEFC" stroke="#101418" strokeWidth="1.5" />
                <circle cx="240" cy="80" r="14" fill="#E8EEFC" stroke="#101418" strokeWidth="1.5" />
                <circle cx="240" cy="160" r="14" fill="#E8EEFC" stroke="#101418" strokeWidth="1.5" />

                {/* Center Boss & Slot */}
                <rect x="90" y="75" width="100" height="90" rx="4" fill="#FFFBF0" stroke="#101418" strokeWidth="1.8" />
                <rect x="115" y="50" width="50" height="140" fill="none" stroke="#101418" strokeWidth="1.2" strokeDasharray="4,3" />
                <circle cx="140" cy="120" r="22" fill="#E8EEFC" stroke="#101418" strokeWidth="1.5" />

                {/* Dimensions Top View */}
                <line x1="0" y1="40" x2="0" y2="15" stroke="#101418" strokeWidth="0.8" />
                <line x1="280" y1="40" x2="280" y2="15" stroke="#101418" strokeWidth="0.8" />
                <line x1="0" y1="20" x2="280" y2="20" stroke="#101418" strokeWidth="1.2" markerStart="url(#arrow-rev)" markerEnd="url(#arrow)" />
                <rect x="125" y="12" width="30" height="16" fill="#FFFBF0" />
                <text x="140" y="24" textAnchor="middle" fontSize="10.5" fontWeight="700" fontFamily="monospace" fill="#101418">126</text>

                <line x1="290" y1="50" x2="330" y2="50" stroke="#101418" strokeWidth="0.8" />
                <line x1="290" y1="190" x2="330" y2="190" stroke="#101418" strokeWidth="0.8" />
                <line x1="320" y1="50" x2="320" y2="190" stroke="#101418" strokeWidth="1.2" markerStart="url(#arrow-rev)" markerEnd="url(#arrow)" />
                <rect x="306" y="112" width="28" height="16" fill="#FFFBF0" />
                <text x="320" y="124" textAnchor="middle" fontSize="10.5" fontWeight="700" fontFamily="monospace" fill="#101418">88</text>

                <line x1="40" y1="80" x2="15" y2="40" stroke="#101418" strokeWidth="1.2" markerStart="url(#arrow-rev)" />
                <line x1="15" y1="40" x2="-25" y2="40" stroke="#101418" strokeWidth="1.2" />
                <text x="-20" y="35" textAnchor="start" fontSize="9.5" fontWeight="700" fontFamily="monospace" fill="#101418">4X Ø18</text>
              </g>

              {/* VIEW 2: FRONT VIEW */}
              <g transform="translate(360, 390)">
                <text x="0" y="0" fontSize="11" fontWeight="700" fontFamily="monospace" fill="#101418" letterSpacing="1">FRONT VIEW (PRIMARY)</text>

                <line x1="140" y1="0" x2="140" y2="240" stroke="#1E43D8" strokeWidth="0.9" strokeDasharray="12,3,2,3" />

                <path
                  d="M 0 170 L 280 170 L 280 200 L 0 200 Z"
                  fill="#E8EEFC"
                  stroke="#101418"
                  strokeWidth="2"
                />
                <path
                  d="M 60 170 L 60 40 Q 60 10 90 10 Q 120 10 120 40 L 120 170 Z"
                  fill="#FFFBF0"
                  stroke="#101418"
                  strokeWidth="2"
                />
                <path
                  d="M 160 170 L 160 40 Q 160 10 190 10 Q 220 10 220 40 L 220 170 Z"
                  fill="#FFFBF0"
                  stroke="#101418"
                  strokeWidth="2"
                />
                <circle cx="90" cy="50" r="16" fill="#E8EEFC" stroke="#101418" strokeWidth="1.5" />
                <circle cx="190" cy="50" r="16" fill="#E8EEFC" stroke="#101418" strokeWidth="1.5" />

                {/* Datum Feature Symbol A */}
                <g transform="translate(140, 200)">
                  <line x1="0" y1="0" x2="0" y2="18" stroke="#101418" strokeWidth="1.5" />
                  <polygon points="0,0 -6,-10 6,-10" fill="#101418" />
                  <rect x="-9" y="18" width="18" height="18" fill="#FFFBF0" stroke="#101418" strokeWidth="1.5" />
                  <text x="0" y="32" textAnchor="middle" fontSize="12" fontWeight="700" fontFamily="monospace" fill="#101418">A</text>
                </g>

                <line x1="0" y1="210" x2="0" y2="245" stroke="#101418" strokeWidth="0.8" />
                <line x1="280" y1="210" x2="280" y2="245" stroke="#101418" strokeWidth="0.8" />
                <line x1="0" y1="235" x2="280" y2="235" stroke="#101418" strokeWidth="1.2" markerStart="url(#arrow-rev)" markerEnd="url(#arrow)" />
                <rect x="125" y="227" width="30" height="16" fill="#FFFBF0" />
                <text x="140" y="239" textAnchor="middle" fontSize="10.5" fontWeight="700" fontFamily="monospace" fill="#101418">150</text>

                <line x1="120" y1="120" x2="160" y2="120" stroke="#101418" strokeWidth="1.2" markerStart="url(#arrow-rev)" markerEnd="url(#arrow)" />
                <rect x="132" y="112" width="16" height="16" fill="#FFFBF0" />
                <text x="140" y="124" textAnchor="middle" fontSize="9" fontWeight="700" fontFamily="monospace" fill="#101418">40</text>

                <line x1="90" y1="50" x2="30" y2="20" stroke="#101418" strokeWidth="1.2" markerStart="url(#arrow-rev)" />
                <line x1="30" y1="20" x2="-20" y2="20" stroke="#101418" strokeWidth="1.2" />
                <text x="-15" y="15" textAnchor="start" fontSize="9.5" fontWeight="700" fontFamily="monospace" fill="#101418">2X Ø10 THRU</text>
              </g>

              {/* VIEW 3: RIGHT VIEW */}
              <g transform="translate(760, 390)">
                <text x="0" y="0" fontSize="11" fontWeight="700" fontFamily="monospace" fill="#101418" letterSpacing="1">RIGHT VIEW</text>

                <line x1="70" y1="0" x2="70" y2="240" stroke="#1E43D8" strokeWidth="0.9" strokeDasharray="12,3,2,3" />

                <path
                  d="M 10 200 L 130 200 L 130 170 L 100 170 L 100 60 Q 100 20 70 20 Q 40 20 40 60 L 40 170 L 10 170 Z"
                  fill="#FFFBF0"
                  stroke="#101418"
                  strokeWidth="2"
                />
                <circle cx="70" cy="50" r="16" fill="#E8EEFC" stroke="#101418" strokeWidth="1.5" />
                <line x1="40" y1="120" x2="100" y2="120" stroke="#101418" strokeWidth="1.2" strokeDasharray="4,3" />

                {/* Datum Feature Symbol B */}
                <g transform="translate(130, 185)">
                  <line x1="0" y1="0" x2="18" y2="0" stroke="#101418" strokeWidth="1.5" />
                  <polygon points="0,0 10,-6 10,6" fill="#101418" />
                  <rect x="18" y="-9" width="18" height="18" fill="#FFFBF0" stroke="#101418" strokeWidth="1.5" />
                  <text x="27" y="5" textAnchor="middle" fontSize="12" fontWeight="700" fontFamily="monospace" fill="#101418">B</text>
                </g>

                <line x1="70" y1="50" x2="120" y2="25" stroke="#101418" strokeWidth="1.2" markerStart="url(#arrow-rev)" />
                <line x1="120" y1="25" x2="160" y2="25" stroke="#101418" strokeWidth="1.2" />
                <text x="125" y="20" textAnchor="start" fontSize="9.5" fontWeight="700" fontFamily="monospace" fill="#101418">Ø12 THRU</text>

                <line x1="100" y1="170" x2="140" y2="150" stroke="#101418" strokeWidth="1.2" markerStart="url(#arrow-rev)" />
                <line x1="140" y1="150" x2="175" y2="150" stroke="#101418" strokeWidth="1.2" />
                <text x="145" y="145" textAnchor="start" fontSize="9.5" fontWeight="700" fontFamily="monospace" fill="#101418">R6 TYP</text>
              </g>

              {/* VIEW 4: ISOMETRIC AXONOMETRIC */}
              <g transform="translate(770, 90)">
                <text x="40" y="20" fontSize="11" fontWeight="700" fontFamily="monospace" fill="#101418" letterSpacing="1">ISOMETRIC (1:2)</text>
                <g transform="translate(60, 40) scale(0.65)">
                  <polygon points="120,30 220,80 220,180 120,130" fill="#DCE7FB" stroke="#101418" strokeWidth="2" />
                  <polygon points="20,80 120,30 120,130 20,180" fill="#FFFBF0" stroke="#101418" strokeWidth="2" />
                  <polygon points="20,80 120,30 220,80 120,130" fill="#E8EEFC" stroke="#101418" strokeWidth="2" />

                  <polygon points="50,110 90,90 90,170 50,190" fill="#FFFBF0" stroke="#101418" strokeWidth="2" />
                  <ellipse cx="70" cy="140" rx="14" ry="18" fill="#E8EEFC" stroke="#101418" strokeWidth="1.8" />

                  <polygon points="150,110 190,90 190,170 150,190" fill="#FFFBF0" stroke="#101418" strokeWidth="2" />
                  <ellipse cx="170" cy="140" rx="14" ry="18" fill="#E8EEFC" stroke="#101418" strokeWidth="1.8" />
                </g>
              </g>

              {/* TITLE BLOCK: MANUFY */}
              <g transform="translate(680, 680)">
                <rect width="480" height="120" fill="#FFFBF0" stroke="#101418" strokeWidth="2" />
                <line x1="0" y1="36" x2="480" y2="36" stroke="#101418" strokeWidth="1.5" />
                <line x1="0" y1="78" x2="480" y2="78" stroke="#101418" strokeWidth="1.5" />
                <line x1="160" y1="0" x2="160" y2="78" stroke="#101418" strokeWidth="1.5" />
                <line x1="330" y1="0" x2="330" y2="120" stroke="#101418" strokeWidth="1.5" />
                <line x1="410" y1="78" x2="410" y2="120" stroke="#101418" strokeWidth="1.5" />

                {/* Organization */}
                <text x="12" y="16" fontSize="8" fontWeight="700" fontFamily="monospace" fill="#101418">ORGANIZATION</text>
                <text x="12" y="30" fontSize="11" fontWeight="700" fontFamily="monospace" fill="#101418">MANUFY AUTODRAFT SYSTEM</text>

                {/* Title */}
                <text x="172" y="16" fontSize="8" fontWeight="700" fontFamily="monospace" fill="#101418">TITLE</text>
                <text x="172" y="31" fontSize="13" fontWeight="800" fontFamily="sans-serif" fill="#101418">CLEVIS MOUNT BRACKET</text>

                {/* Drawing No */}
                <text x="12" y="52" fontSize="8" fontWeight="700" fontFamily="monospace" fill="#101418">DRAWING NO.</text>
                <text x="12" y="70" fontSize="13" fontWeight="700" fontFamily="monospace" fill="#101418">MF-2026-0881</text>

                {/* Revision */}
                <text x="172" y="52" fontSize="8" fontWeight="700" fontFamily="monospace" fill="#101418">REVISION</text>
                <text x="172" y="70" fontSize="12" fontWeight="700" fontFamily="monospace" fill="#101418">REV A (APPROVED)</text>

                {/* Projection Symbol */}
                <g transform="translate(350, 8)">
                  <text x="0" y="8" fontSize="7" fontWeight="700" fontFamily="monospace" fill="#101418">PROJECTION</text>
                  <circle cx="20" cy="20" r="8" fill="none" stroke="#101418" strokeWidth="1" />
                  <circle cx="20" cy="20" r="4" fill="none" stroke="#101418" strokeWidth="0.8" />
                  <polygon points="36,12 56,16 56,24 36,28" fill="none" stroke="#101418" strokeWidth="1" />
                </g>

                <text x="12" y="94" fontSize="8" fontWeight="700" fontFamily="monospace" fill="#101418">DRAWN BY</text>
                <text x="12" y="110" fontSize="10.5" fontWeight="700" fontFamily="monospace" fill="#101418">MANUFY AGENT</text>

                <text x="172" y="94" fontSize="8" fontWeight="700" fontFamily="monospace" fill="#101418">DATE</text>
                <text x="172" y="110" fontSize="10" fontWeight="700" fontFamily="monospace" fill="#101418">2026-09-26</text>

                <text x="342" y="94" fontSize="8" fontWeight="700" fontFamily="monospace" fill="#101418">SCALE</text>
                <text x="342" y="110" fontSize="10" fontWeight="700" fontFamily="monospace" fill="#101418">1:1</text>

                <text x="422" y="94" fontSize="8" fontWeight="700" fontFamily="monospace" fill="#101418">SHEET</text>
                <text x="422" y="110" fontSize="10" fontWeight="700" fontFamily="monospace" fill="#101418">1 OF 1 (A3)</text>
              </g>
            </svg>
          </div>
        </div>
      </div>

      {/* Bottom Card: Layout Report / 14 Issues Table */}
      <div className="w-full bg-white rounded-xl border-2 border-[#101418] p-5 sm:p-6 shadow-hard-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b-[1.5px] border-[#101418]/20">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#101418]">
                LAYOUT REPORT · 14 ISSUES
              </h3>
            </div>
            <p className="font-mono text-[11px] text-[#101418]/60 mt-0.5">
              Automated spatial constraint solver resolving dimension collisions, leader cross-overs, and border margins
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="inline-flex items-center gap-1.5 bg-[#FFC53D] text-[#101418] px-2 py-0.5 rounded border border-[#101418] font-bold shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#101418]"></span>
              2 warnings adjusted
            </span>
            <span className="inline-flex items-center gap-1.5 bg-[#E8EEFC] text-[#1E43D8] px-2 py-0.5 rounded border border-[#101418] font-bold shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1E43D8]"></span>
              12 optimal checks
            </span>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-lg border-[1.5px] border-[#101418] shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#E8EEFC] border-b-[1.5px] border-[#101418] text-[#101418] font-mono text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3 font-bold w-12 text-center">#</th>
                <th className="py-2.5 px-3 font-bold w-28">Severity</th>
                <th className="py-2.5 px-3 font-bold">Issue description</th>
                <th className="py-2.5 px-3 font-bold">Detail</th>
                <th className="py-2.5 px-3 font-bold w-48 text-right">Resolution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#101418]/15 bg-white font-sans">
              {LAYOUT_ISSUES.map((issue) => (
                <tr
                  key={issue.id}
                  className={`transition-colors ${
                    issue.severity === "warning"
                      ? "bg-[#FFC53D]/30 border-y-[1.5px] border-[#101418]"
                      : "hover:bg-[#F3ECCE]/60"
                  }`}
                >
                  <td className="py-2.5 px-3 font-mono font-bold text-[#101418]/60 text-center">
                    {issue.id}
                  </td>
                  <td className="py-2.5 px-3">
                    {issue.severity === "warning" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-[#FFC53D] text-[#101418] border-[1.5px] border-[#101418] shadow-2xs">
                        Warning
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-[#E8EEFC] text-[#1E43D8] border border-[#101418]">
                        Info
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-[#101418]">
                    {issue.description}
                  </td>
                  <td className="py-2.5 px-3 text-[#101418]/70">
                    {issue.detail}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-[11px] font-semibold text-[#101418]">
                    {issue.resolution}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
