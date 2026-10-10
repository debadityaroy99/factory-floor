"use client";

import React, { useEffect, useRef, useState } from "react";

// =========================================================================
// HAND-DRAWN SCRIBBLY UNDERLINE SVG (From illoca.com/tracingpaper)
// =========================================================================
function ScribbleUnderline({ isVisible }: { isVisible: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 325 5"
      className="inline-block w-20 sm:w-28 md:w-36 h-1 sm:h-1.5 transition-transform duration-700 ease-out origin-left pointer-events-none"
      style={{
        transform: isVisible ? "scaleX(1)" : "scaleX(0)",
      }}
    >
      <path
        d="M323.81 1.93c-.93-.07-5.82-.05-13.08-.03-1.87-.03-6.24-.02-12.22 0-1.87-.03-6.24-.02-12.22 0-1.87-.03-6.24-.02-12.22 0-1.87-.03-6.24-.02-12.22 0-1.87-.03-6.24-.02-12.22 0-1.87-.03-6.24-.02-12.22 0-1.87-.03-6.24-.02-12.22 0-1.87-.03-6.24-.02-12.22 0-1.87-.03-6.24-.02-12.22 0-1.87-.03-6.24-.02-12.22 0-1.87-.03-6.24-.02-12.23 0-1.87-.03-6.24-.02-12.22 0-1.87-.03-6.24-.02-12.22 0-1.87-.03-6.24-.02-12.22 0-1.87-.03-6.24-.02-12.22 0-1.87-.03-6.24-.02-12.23 0-1.87-.03-6.24-.02-12.22 0-1.87-.03-6.24-.02-12.22 0-1.87-.03-6.24-.02-12.22 0-1.87-.03-6.24-.02-12.22 0-1.87-.03-6.24-.02-12.22 0-1.87-.03-6.24-.02-12.22 0-2-.04-6.87-.02-13.52 0-1.1 0-4.44-.14-3.82.62.14.19.48.31.82.31h322.81c1.9 0 1.49-.86.14-.91Z"
        fill="#5b5b5b"
      />
    </svg>
  );
}

// =========================================================================
// DATA FOR THE 5 FEATURE SECTIONS (Exact Order & Content from prompt)
// =========================================================================
export interface FeatureSectionData {
  id: string;
  stageNum: string;
  panelSide: "left" | "right";
  eyebrow: string;
  headline: string;
  body: string;
  ctaText: string;
  hintText: string;
  primaryImage: string;
  secondaryImage: string;
  technicalLabel: string;
  sheetNumber: string;
}

const SECTIONS_DATA: FeatureSectionData[] = [
  {
    id: "parsed-drawings",
    stageNum: "①",
    panelSide: "left",
    eyebrow: "① DRAWINGS, DECODED!",
    headline: "Parsed Drawings",
    body: "Drop in PDFs, DWGs, or scanned sheets. Every drawing becomes structured, searchable data — dimensions, callouts, revisions, all extracted.",
    ctaText: "Watch the demo",
    hintText: "↳ explore features",
    primaryImage: "/frames/frame-080.jpg",
    secondaryImage: "/frames/frame-070.jpg",
    technicalLabel: "VECTOR SPECIFICATION & METROLOGY EXTRACTION",
    sheetNumber: "SHT. A-101 // FEAT. 01",
  },
  {
    id: "standards-checking",
    stageNum: "②",
    panelSide: "right",
    eyebrow: "② INTENT, VERIFIED!",
    headline: "Standards Checking",
    body: "GD&T, tolerances, and callouts checked against ASME, ISO, and your own shop standards — before metal gets cut.",
    ctaText: "Watch the demo",
    hintText: "↳ explore features",
    primaryImage: "/frames/frame-135.jpg",
    secondaryImage: "/frames/frame-150.jpg",
    technicalLabel: "TOLERANCE COMPLIANCE & ASME/ISO CHECK",
    sheetNumber: "SHT. E-204 // FEAT. 02",
  },
  {
    id: "revision-intelligence",
    stageNum: "③",
    panelSide: "left",
    eyebrow: "③ CHANGES, CAUGHT!",
    headline: "Revision Intelligence",
    body: "Every revision diffed automatically. Nothing slips through between rev A and rev C — every change traced to its source.",
    ctaText: "Watch the demo",
    hintText: "↳ explore features",
    primaryImage: "/frames/frame-180.jpg",
    secondaryImage: "/frames/frame-165.jpg",
    technicalLabel: "AUTOMATED REVISION DIFFING & PROVENANCE",
    sheetNumber: "SHT. R-305 // FEAT. 03",
  },
  {
    id: "agentic-answers",
    stageNum: "④",
    panelSide: "right",
    eyebrow: "④ QUESTIONS, ANSWERED!",
    headline: "Agentic Answers",
    body: "Ask anything about the drawing in plain language. Every answer cites the exact callout and governing requirement it came from.",
    ctaText: "Watch the demo",
    hintText: "↳ explore features",
    primaryImage: "/frames/frame-160.jpg",
    secondaryImage: "/frames/frame-170.jpg",
    technicalLabel: "CONTEXTUAL SEMANTIC QUERY & GOVERNING CITATION",
    sheetNumber: "SHT. Q-409 // FEAT. 04",
  },
  {
    id: "shop-floor-handoff",
    stageNum: "⑤",
    panelSide: "left",
    eyebrow: "⑤ KNOWLEDGE, MOBILIZED!",
    headline: "Shop-Floor Handoff",
    body: "Export cut lists, inspection plans, and work instructions the floor can actually build from — intelligence that leaves the drawing.",
    ctaText: "Watch the demo",
    hintText: "↳ explore features",
    primaryImage: "/frames/frame-183.jpg",
    secondaryImage: "/frames/frame-175.jpg",
    technicalLabel: "WORK INSTRUCTION DISPATCH & FIELD MEASUREMENT SYNC",
    sheetNumber: "SHT. X-512 // FEAT. 05",
  },
];

// =========================================================================
// SINGLE FEATURE SECTION RUNWAY & PINNED VIEWPORT
// =========================================================================
function FeatureSectionItem({
  data,
  onOpenDemo,
}: {
  data: FeatureSectionData;
  onOpenDemo: (title: string) => void;
}) {
  const runwayRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleMotionChange);
    return () => mediaQuery.removeEventListener("change", handleMotionChange);
  }, []);

  // Scroll tracking & in-between scroll reveal trigger
  useEffect(() => {
    const handleScroll = () => {
      const el = runwayRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const totalScrollable = rect.height - window.innerHeight;
      if (totalScrollable > 0) {
        const scrolled = -rect.top;
        const progress = Math.max(0, Math.min(1, scrolled / totalScrollable));
        setScrollProgress(progress);

        // REVEAL IN BETWEEN THE SCROLL:
        // Triggers smoothly at ~15% into the section runway and stays active through ~90%,
        // reversing cleanly when scrolling back up.
        if (progress >= 0.12 && progress <= 0.92) {
          setIsVisible(true);
        } else if (progress < 0.08 || progress > 0.96) {
          setIsVisible(false);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const isDesktopLeft = data.panelSide === "left";

  // Slow Ken Burns parallax: scale 1.05 -> 1.0, translateY ±40px
  const kenBurnsScale = prefersReducedMotion ? 1 : 1.05 - scrollProgress * 0.05;
  const kenBurnsY = prefersReducedMotion ? 0 : (scrollProgress - 0.5) * 40;
  // Crossfade between feature illustrations across runway scroll range
  const crossfadeOpacity = Math.min(1, Math.max(0, (scrollProgress - 0.2) * 2));

  return (
    <div
      ref={runwayRef}
      id={`section-${data.id}`}
      className="relative w-full h-[150dvh] lg:h-[500dvh] bg-[#f4ebd7] bg-drafting-grid"
    >
      {/* PINNED VIEWPORT (100dvh, sticky top-0 inside the runway wrapper) */}
      <div className="sticky top-0 w-full h-[100dvh] overflow-hidden flex flex-col justify-between select-none">
        
        {/* =================================================================== */}
        {/* 1. ILLUSTRATION PANEL: PINNED FULL-VIEWPORT BEHIND THE TEXT */}
        {/* =================================================================== */}
        <div className="absolute inset-0 w-full h-full overflow-hidden z-10 pointer-events-none">
          {/* Framed drafting window container matching illoca reference */}
          <div className="absolute inset-2 sm:inset-4 lg:inset-6 border border-[#292929]/30 rounded-[2px] overflow-hidden bg-[#e6dcbe] shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
            
            {/* Primary Illustration with Ken Burns Transform */}
            <div
              className="absolute inset-0 w-full h-full transition-transform duration-100 ease-out will-change-transform"
              style={{
                transform: `scale(${kenBurnsScale}) translateY(${kenBurnsY}px)`,
              }}
            >
              <img
                src={data.primaryImage}
                alt={`${data.headline} industrial illustration`}
                className="w-full h-full object-cover object-center block"
                loading="lazy"
              />
            </div>

            {/* Secondary Illustration Crossfade on Scroll */}
            <div
              className="absolute inset-0 w-full h-full transition-opacity duration-300 ease-out will-change-transform"
              style={{
                opacity: crossfadeOpacity,
                transform: `scale(${kenBurnsScale}) translateY(${kenBurnsY * 0.6}px)`,
              }}
            >
              <img
                src={data.secondaryImage}
                alt={`${data.headline} progression view`}
                className="w-full h-full object-cover object-center block"
                loading="lazy"
              />
            </div>

            {/* Subtle Editorial Blueprint Multiply Tint */}
            <div className="absolute inset-0 bg-[#0046b4]/5 mix-blend-multiply pointer-events-none" />

            {/* Soft parchment drafting gradient overlay behind the text panel side for pristine legibility */}
            <div
              className={`hidden lg:block absolute inset-y-0 w-[55%] pointer-events-none ${
                isDesktopLeft
                  ? "left-0 bg-gradient-to-r from-[#f4ebd7]/95 via-[#f4ebd7]/80 to-transparent"
                  : "right-0 bg-gradient-to-l from-[#f4ebd7]/95 via-[#f4ebd7]/80 to-transparent"
              }`}
            />

            {/* Mobile Top Gradient */}
            <div className="lg:hidden absolute inset-0 bg-gradient-to-b from-[#f4ebd7]/95 via-[#f4ebd7]/80 to-transparent pointer-events-none" />
          </div>
        </div>

        {/* =================================================================== */}
        {/* 2. DRAFTING SHEET FRAME & TOP METADATA */}
        {/* =================================================================== */}
        <div className="relative w-full z-30 flex items-center justify-between pt-3 px-4 sm:px-8 md:px-12 text-[10px] sm:text-xs font-mono text-[#5c6470] tracking-wider pointer-events-none">
          <div className="flex items-center gap-3 bg-[#f4ebd7]/90 px-2 py-0.5 rounded-[2px] backdrop-blur-[2px] border border-[#292929]/20">
            <span className="font-bold text-[#124ead]">{data.sheetNumber}</span>
            <span className="hidden sm:inline-block text-[#292929]/40">//</span>
            <span className="hidden sm:inline-block uppercase">{data.technicalLabel}</span>
          </div>
          <div className="flex items-center gap-2 bg-[#f4ebd7]/90 px-2 py-0.5 rounded-[2px] backdrop-blur-[2px] border border-[#292929]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#124ead] animate-ping" />
            <span className="font-mono text-[#292929]">{data.stageNum} OF 5</span>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 3. TEXT PANEL: ~500px wide, vertically centered, alternating sides */}
        {/* =================================================================== */}
        <div className="relative w-full flex-1 flex items-center px-4 sm:px-8 md:px-12 z-30 pointer-events-none">
          <div
            className={`w-full lg:w-[480px] xl:w-[520px] pointer-events-auto flex flex-col justify-center py-6 lg:py-0
              ${
                isDesktopLeft
                  ? "lg:absolute lg:left-10 xl:left-20"
                  : "lg:absolute lg:right-16 xl:right-28"
              }
            `}
          >
            {/* 1. EYEBROW: Fade + translateY(12px -> 0) in 400ms, with scribble draw-in SVGs */}
            <div
              className="flex items-center gap-2 mb-3 text-left transition-all duration-400 ease-out"
              style={{
                opacity: prefersReducedMotion || isVisible ? 1 : 0,
                transform:
                  prefersReducedMotion || isVisible
                    ? "translateY(0)"
                    : "translateY(12px)",
              }}
            >
              <ScribbleUnderline isVisible={prefersReducedMotion || isVisible} />
              <span className="font-mono text-xs sm:text-sm font-bold tracking-wider text-[#4a5260] uppercase whitespace-nowrap">
                {data.eyebrow}
              </span>
              <ScribbleUnderline isVisible={prefersReducedMotion || isVisible} />
            </div>

            {/* 2. HEADLINE: Stroke-fill wipe effect */}
            <div className="relative mb-4 sm:mb-5">
              {/* Bottom Layer: Outlined text via -webkit-text-stroke */}
              <h2 className="text-stroke-outline text-4xl sm:text-5xl lg:text-[3.8rem] xl:text-[4.4rem] font-bold tracking-tight leading-[1.0] select-text">
                {data.headline}
              </h2>

              {/* Top Layer: Solid black (#212121) overlaid with animated clip-path */}
              <h2
                className="absolute inset-0 text-[#212121] text-4xl sm:text-5xl lg:text-[3.8rem] xl:text-[4.4rem] font-bold tracking-tight leading-[1.0] select-text"
                style={{
                  clipPath:
                    prefersReducedMotion || isVisible
                      ? "inset(0 0 0 0)"
                      : "inset(0 100% 0 0)",
                  transition: prefersReducedMotion
                    ? "none"
                    : "clip-path 900ms cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                aria-hidden="true"
              >
                {data.headline}
              </h2>
            </div>

            {/* 3. BODY COPY: Fade-up reveal (opacity 0->1, translateY 24px->0, 600ms, delay 150ms) */}
            <p
              className="text-[#2b303a] text-sm sm:text-base lg:text-[17px] leading-relaxed mb-6 font-normal max-w-lg select-text transition-all duration-600 ease-out"
              style={{
                opacity: prefersReducedMotion || isVisible ? 1 : 0,
                transform:
                  prefersReducedMotion || isVisible
                    ? "translateY(0)"
                    : "translateY(24px)",
                transitionDelay: prefersReducedMotion ? "0ms" : "150ms",
              }}
            >
              {data.body}
            </p>

            {/* 4. CTA BUTTON & HINT TEXT: Fade-up with delay +250ms & +350ms */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Illoca-Style Modal Button */}
              <button
                onClick={() => onOpenDemo(data.headline)}
                className="group h-12 inline-flex rounded-[3px] overflow-hidden border border-[#A19D94] shadow-sm hover:shadow transition-all active:scale-[0.98] cursor-pointer"
                style={{
                  opacity: prefersReducedMotion || isVisible ? 1 : 0,
                  transform:
                    prefersReducedMotion || isVisible
                      ? "translateY(0)"
                      : "translateY(24px)",
                  transitionDuration: "600ms",
                  transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                  transitionDelay: prefersReducedMotion ? "0ms" : "250ms",
                }}
              >
                {/* Left orange/coral icon square */}
                <div className="w-12 h-12 bg-[#ff5500] group-hover:bg-[#e04a00] flex items-center justify-center text-white transition-colors flex-shrink-0">
                  <svg
                    className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d="M6 3L11 8L6 13"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {/* Right label area */}
                <div className="bg-[#fbf9f4] group-hover:bg-white px-5 flex items-center justify-center text-xs sm:text-sm font-semibold tracking-tight text-[#212121] transition-colors border-l border-[#A19D94]">
                  {data.ctaText}
                </div>
              </button>

              {/* 5. Hint text: "↳ explore features" */}
              <div
                className="flex items-center gap-1.5 text-[#737c8a] transition-all duration-600 ease-out"
                style={{
                  opacity: prefersReducedMotion || isVisible ? 1 : 0,
                  transform:
                    prefersReducedMotion || isVisible
                      ? "translateY(0)"
                      : "translateY(12px)",
                  transitionDelay: prefersReducedMotion ? "0ms" : "350ms",
                }}
              >
                <span className="font-mono text-sm leading-none font-bold text-[#8D8D8D]">↳</span>
                <span className="font-handwriting text-xs sm:text-sm tracking-wide text-[#5c6470]">
                  {data.hintText.replace("↳ ", "")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM METADATA BAR */}
        <div className="relative w-full z-30 flex items-center justify-between pb-3 px-4 sm:px-8 md:px-12 text-[10px] sm:text-xs font-mono text-[#5c6470] tracking-wider pointer-events-none">
          <div className="bg-[#f4ebd7]/90 px-2 py-0.5 rounded-[2px] backdrop-blur-[2px] border border-[#292929]/20">
            FACTORY FLOOR INTELLIGENCE // STAGE {data.stageNum}
          </div>
          <div className="flex items-center gap-3 bg-[#f4ebd7]/90 px-2 py-0.5 rounded-[2px] backdrop-blur-[2px] border border-[#292929]/20">
            <span className="hidden sm:inline-block">PROGRESS: {Math.round(scrollProgress * 100)}%</span>
            <div className="w-16 h-1.5 bg-[#292929]/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#124ead] transition-all duration-75"
                style={{ width: `${Math.round(scrollProgress * 100)}%` }}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// =========================================================================
// INTERACTIVE DEMO MODAL COMPONENT
// =========================================================================
function DemoModal({
  isOpen,
  title,
  onClose,
}: {
  isOpen: boolean;
  title: string;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#f4ebd7] bg-drafting-grid border border-[#292929] rounded-[4px] p-6 sm:p-8 shadow-2xl text-[#292929]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#292929]/30 pb-3 mb-5">
          <div className="flex items-center gap-2 text-xs font-mono text-[#124ead] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#ff5500] animate-ping" />
            <span>INTERACTIVE DEMO // {title.toUpperCase()}</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-[2px] bg-[#292929]/10 hover:bg-[#292929]/20 text-[#292929] text-sm font-mono cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Blueprint Simulation Video/Graphic Area */}
        <div className="relative w-full aspect-video bg-[#12284b] rounded-[3px] border border-[#292929]/40 overflow-hidden mb-6 flex flex-col items-center justify-center text-center p-6 text-white">
          <div className="w-12 h-12 rounded-full bg-[#ff5500] flex items-center justify-center text-white mb-3 shadow-md">
            <svg className="w-5 h-5 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <h4 className="text-lg font-bold tracking-tight mb-1">{title} Interactive Simulation</h4>
          <p className="text-xs text-white/70 max-w-md font-mono">
            Autonomous drafting verification connected to real-time engineering CAD models and shop-floor SOP specifications.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs font-mono text-[#5c6470]">STATUS: SIMULATION READY</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#124ead] hover:bg-[#0d3b85] text-white text-xs font-semibold rounded-[3px] transition-colors cursor-pointer"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// EXPORTED CONTAINER WITH ALL 5 FEATURE WORKFLOW SECTIONS
// =========================================================================
export function FeatureWorkflowSections() {
  const [activeModalTitle, setActiveModalTitle] = useState<string | null>(null);

  return (
    <div className="relative w-full z-20 bg-[#f4ebd7]">
      {/* 5 Sequential Pinned Feature Sections */}
      {SECTIONS_DATA.map((section) => (
        <FeatureSectionItem
          key={section.id}
          data={section}
          onOpenDemo={(title) => setActiveModalTitle(title)}
        />
      ))}

      {/* Interactive Demo Modal */}
      <DemoModal
        isOpen={Boolean(activeModalTitle)}
        title={activeModalTitle || ""}
        onClose={() => setActiveModalTitle(null)}
      />
    </div>
  );
}

export default FeatureWorkflowSections;
