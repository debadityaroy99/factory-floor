"use client";

import React, { useState } from "react";
import { FrameSequenceViewer } from "./FrameSequenceViewer";

interface ArchitectHeroProps {
  brandName?: string;
  transparentBg?: boolean;
}

export function ArchitectHero({
  brandName = "[YOUR BRAND NAME]",
  transparentBg = false,
}: ArchitectHeroProps) {
  const [currentBrand, setCurrentBrand] = useState(brandName);
  const [isEditingBrand, setIsEditingBrand] = useState(false);

  return (
    <div
      className={`relative min-h-screen w-full ${
        transparentBg ? "bg-[#f4ebd7]/90 backdrop-blur-[2px]" : "bg-[#f4ebd7]"
      } text-[#292929] bg-drafting-grid selection:bg-[#124ead]/20 selection:text-[#124ead] flex flex-col justify-between overflow-x-hidden pt-3 pb-6 sm:pb-8 transition-colors`}
    >
      
      {/* =========================================================
          TOP BAR: COORDINATES + FLOATING DOCK NAVBAR + FACTORY LABEL
          ========================================================= */}
      <div className="w-full px-4 sm:px-8 md:px-12 pt-1 flex items-start justify-between relative z-30">
        
        {/* Top-Left: Technical Drafting Coordinates */}
        <div className="text-[11px] sm:text-xs font-mono text-[#5c6470] tracking-tight leading-[1.3] select-none pt-1">
          <div className="flex gap-2">
            <span className="font-semibold text-[#3a3f47]">X</span>
            <span>127.65</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold text-[#3a3f47]">Y</span>
            <span>264.80</span>
          </div>
        </div>

        {/* Center: Floating Technical Dock Navbar */}
        <nav className="absolute left-1/2 -translate-x-1/2 top-1 flex items-center bg-[#fbf9f4] border border-[#292929]/30 rounded-[3px] py-1 px-2.5 sm:px-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)] z-40 max-w-[94vw]">
          
          {/* Blueprint Geometric Logo + Brand Name */}
          <div className="flex items-center gap-2 pr-3 sm:pr-4 border-r border-[#292929]/20">
            {/* 4-Quadrant Blueprint Glyph matching reference */}
            <svg
              className="w-5 h-5 text-[#124ead] flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#124ead"
              strokeWidth="1.8"
            >
              {/* Outer square */}
              <rect x="2" y="2" width="20" height="20" stroke="#124ead" strokeWidth="1.5" />
              {/* Divider lines */}
              <line x1="12" y1="2" x2="12" y2="22" stroke="#124ead" strokeWidth="1.2" />
              <line x1="2" y1="12" x2="22" y2="12" stroke="#124ead" strokeWidth="1.2" />
              {/* Top-left: 3 horizontal stripes */}
              <line x1="4.5" y1="5.5" x2="9.5" y2="5.5" stroke="#124ead" strokeWidth="1.2" />
              <line x1="4.5" y1="8" x2="9.5" y2="8" stroke="#124ead" strokeWidth="1.2" />
              <line x1="4.5" y1="10.5" x2="9.5" y2="10.5" stroke="#124ead" strokeWidth="1.2" />
              {/* Top-right: solid filled triangle */}
              <polygon points="17,5 14,10 20,10" fill="#124ead" stroke="none" />
              {/* Bottom-left: circle with center dot */}
              <circle cx="7" cy="17" r="2.8" stroke="#124ead" strokeWidth="1.2" />
              <circle cx="7" cy="17" r="1" fill="#124ead" />
              {/* Bottom-right: square inner component */}
              <rect x="14.5" y="14.5" width="5" height="5" fill="#124ead" />
            </svg>

            {/* Brand Title (Editable for quick verification) */}
            <div className="flex items-center">
              {isEditingBrand ? (
                <input
                  type="text"
                  value={currentBrand}
                  onChange={(e) => setCurrentBrand(e.target.value)}
                  onBlur={() => setIsEditingBrand(false)}
                  onKeyDown={(e) => e.key === "Enter" && setIsEditingBrand(false)}
                  autoFocus
                  className="text-xs sm:text-sm font-semibold tracking-tight text-[#292929] bg-white border border-[#124ead] px-1 py-0.5 rounded outline-none w-36"
                />
              ) : (
                <span
                  onClick={() => setIsEditingBrand(true)}
                  title="Click to edit brand name"
                  className="text-xs sm:text-sm font-bold tracking-tight text-[#292929] cursor-pointer hover:text-[#124ead] transition-colors select-none"
                >
                  {currentBrand}
                </span>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-5 sm:gap-6 px-3 sm:px-4 text-[12px] font-medium text-[#292929]">
            <a
              href="#platform"
              className="hover:text-[#124ead] transition-colors flex items-center gap-1 select-none"
            >
              <span>Platform</span>
              <svg className="w-2.5 h-2.5 text-[#292929]/70" viewBox="0 0 10 6" fill="currentColor">
                <path d="M0 0L5 5L10 0H0Z" />
              </svg>
            </a>
            <a
              href="#how-it-works"
              className="hover:text-[#124ead] transition-colors select-none"
            >
              How It Works
            </a>
            <a
              href="#solutions"
              className="hover:text-[#124ead] transition-colors select-none"
            >
              Solutions
            </a>
          </div>

          {/* Right CTA Button: Deep Cobalt Blue with Orange/Coral Icon */}
          <div className="pl-1 sm:pl-2">
            <a
              href="#explore"
              className="group inline-flex items-center gap-2 bg-[#124ead] hover:bg-[#0d3b85] text-white text-[11px] sm:text-[12px] font-semibold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-[3px] transition-all shadow-sm active:scale-95 select-none"
            >
              {/* Orange/Coral Square Graphic with Tracing/Drafting Line */}
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-[#ff5500] rounded-[2px] flex items-center justify-center p-0.5 flex-shrink-0">
                <svg viewBox="0 0 14 14" className="w-full h-full text-white" fill="none" stroke="currentColor">
                  <path d="M2 12L12 2M2 2L12 12" strokeWidth="1.6" strokeLinecap="round" />
                  <rect x="3" y="3" width="8" height="8" strokeWidth="1.2" strokeDasharray="1 1" />
                </svg>
              </div>
              <span className="whitespace-nowrap tracking-normal">Explore Platform</span>
            </a>
          </div>
        </nav>

        {/* Top-Right: Handwritten Contact Label */}
        <div className="text-[11px] sm:text-xs font-handwriting text-[#4a5260] tracking-wider select-none uppercase pt-1 text-right">
          BUILT FOR THE FACTORY FLOOR
        </div>
      </div>

      {/* =========================================================
          HERO HEADLINE + HANDWRITTEN DRAFTING ANNOTATIONS
          ========================================================= */}
      <section className="relative z-10 w-full max-w-[1400px] mx-auto px-4 sm:px-8 md:px-12 pt-8 sm:pt-10 md:pt-12 pb-2 sm:pb-3 flex flex-col items-center justify-center">
        
        {/* Headline Wrapper with Precise Placement */}
        <div className="relative w-full max-w-5xl text-center">

          {/* Left Handwritten Annotation: "INDUSTRIAL INTELLIGENCE" in Sketched Box */}
          <div className="absolute -top-6 sm:-top-8 left-2 sm:left-4 md:-left-12 lg:-left-20 transform -rotate-[5deg] select-none pointer-events-none z-20">
            <div className="relative inline-block px-2 sm:px-2.5 py-0.5">
              {/* Hand-drawn pencil sketch box borders */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 140 32"
                preserveAspectRatio="none"
              >
                <path
                  d="M3,4 Q70,2 136,3 Q138,15 137,28 Q70,30 2,29 Q3,16 3,4"
                  fill="none"
                  stroke="#5c6470"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.8"
                />
                <line
                  x1="6"
                  y1="29"
                  x2="134"
                  y2="28"
                  stroke="#5c6470"
                  strokeWidth="0.8"
                  opacity="0.6"
                />
              </svg>
              <span className="font-handwriting text-[11px] sm:text-[13px] md:text-[14px] text-[#424a56] uppercase tracking-wider font-bold">
                INDUSTRIAL INTELLIGENCE
              </span>
            </div>
          </div>

          {/* Right Handwritten Annotation: Hand-drawn arrow pointing to headline + "POWERED BY AI" */}
          <div className="absolute top-1/2 translate-y-1 sm:translate-y-2 right-1 sm:right-2 md:-right-10 lg:-right-20 transform rotate-[2deg] select-none pointer-events-none z-20 flex items-center gap-1 sm:gap-1.5">
            {/* Hand-drawn pencil arrow pointing left toward the headline */}
            <svg
              className="w-8 sm:w-12 h-4 text-[#5c6470] flex-shrink-0"
              viewBox="0 0 48 16"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M45,8 C35,7 20,8 6,8"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
              <path
                d="M14,3 L5,8 L14,13"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex flex-col text-left leading-none">
              <span className="font-handwriting text-[10px] sm:text-[12px] md:text-[13px] text-[#424a56] font-bold tracking-wider uppercase border-b border-[#5c6470]/60 pb-0.5">
                POWERED BY AI
              </span>
            </div>
          </div>

          {/* The Massive Two-Line Headline */}
          <h1 className="text-[2.6rem] sm:text-6xl md:text-7xl lg:text-[5.4rem] xl:text-[6.2rem] font-bold tracking-[-0.035em] text-[#292929] leading-[0.98] sm:leading-[0.96] select-text">
            Industrial knowledge,
            <br />
            made intelligent.
          </h1>
        </div>
      </section>

      {/* =========================================================
          FULL-WIDTH CINEMATIC HERO ILLUSTRATION (ARCHITECT AT DESK)
          ========================================================= */}
      <section className="relative z-10 w-full px-3 sm:px-6 md:px-8 lg:px-10 mt-1 sm:mt-2">
        <div className="relative w-full max-w-[1440px] mx-auto border border-[#292929] bg-[#f4ebd7] overflow-hidden shadow-sm">
          
          {/* Edge-to-edge illustration powered by 300-frame scroll-linked HTML5 canvas sequence */}
          <div className="relative w-full aspect-[2.1/1] sm:aspect-[2.8/1] md:aspect-[3.2/1] lg:aspect-[3.9/1] max-h-[520px]">
            <FrameSequenceViewer totalFrames={300} frameDir="/frames" framePrefix="frame-" />

            {/* Bottom-Right Microcopy Overlay matching reference screenshot */}
            <div className="absolute bottom-2.5 sm:bottom-3 right-2.5 sm:right-4 z-20 flex items-center gap-1.5 sm:gap-2 bg-[#024ab4]/80 md:bg-transparent px-2 py-0.5 rounded-[2px] backdrop-blur-[1px]">
              <span className="text-[10px] sm:text-[11px] md:text-[12px] font-sans text-white/95 tracking-normal font-normal drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                From engineering drawings to actionable factory intelligence.
              </span>
              
              {/* Tiny orange/coral square with arrow icon */}
              <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 bg-[#ff5500] rounded-[2px] flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg
                  className="w-2 h-2 text-white stroke-[2.5]"
                  viewBox="0 0 10 10"
                  fill="none"
                  stroke="currentColor"
                >
                  <path d="M2 5h6M5 2l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

export default ArchitectHero;
