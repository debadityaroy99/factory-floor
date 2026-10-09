"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import PlatformModeModal from "./PlatformModeModal";


// =========================================================================
// 1. FULL-SCREEN SCROLL CANVAS COMPONENT (Internal & Self-Contained)
// =========================================================================
function FullScreenCanvas({ totalFrames = 183 }: { totalFrames?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animation & Frame tracking references
  const currentFrameRef = useRef<number>(1);
  const targetFrameRef = useRef<number>(1);
  const lastDrawnFrameRef = useRef<number>(-1);
  const needsRedrawRef = useRef<boolean>(true);
  const rafIdRef = useRef<number | null>(null);

  // Frame Cache
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);
  const loadedFlagsRef = useRef<boolean[]>([]);
  const [isReady, setIsReady] = useState<boolean>(false);

  const getFrameUrl = (index: number) => {
    const padded = index.toString().padStart(3, "0");
    return `/frames/frame-${padded}.jpg`;
  };

  // Find closest loaded image if target frame is still decoding
  const getClosestImage = (targetIndex: number): HTMLImageElement | null => {
    const images = imagesRef.current;
    const loaded = loadedFlagsRef.current;

    if (loaded[targetIndex] && images[targetIndex]) {
      return images[targetIndex];
    }

    for (let offset = 1; offset < totalFrames; offset++) {
      const prev = targetIndex - offset;
      if (prev >= 1 && loaded[prev] && images[prev]) return images[prev];
      const next = targetIndex + offset;
      if (next <= totalFrames && loaded[next] && images[next]) return images[next];
    }

    return null;
  };

  // Draw frame on canvas with aspect ratio cover & retina DPR
  const drawFrame = (frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const img = getClosestImage(frameIndex);
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (width === 0 || height === 0) return;

    const targetW = Math.floor(width * dpr);
    const targetH = Math.floor(height * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Calculate aspect ratio cover math so image covers 100% of viewport without bars
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = width / height;

    let renderW = width;
    let renderH = height;
    let offsetX = 0;
    let offsetY = 0;

    if (canvasRatio > imgRatio) {
      renderW = width;
      renderH = width / imgRatio;
      offsetY = (height - renderH) / 2;
    } else {
      renderH = height;
      renderW = height * imgRatio;
      offsetX = (width - renderW) / 2;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
    ctx.restore();
  };

  // Progressive preloader
  useEffect(() => {
    imagesRef.current = new Array(totalFrames + 1).fill(null);
    loadedFlagsRef.current = new Array(totalFrames + 1).fill(false);

    let isMounted = true;

    const loadSingleFrame = (idx: number): Promise<HTMLImageElement> => {
      return new Promise((resolve) => {
        if (imagesRef.current[idx]) {
          resolve(imagesRef.current[idx]!);
          return;
        }

        const img = new Image();
        img.src = getFrameUrl(idx);
        img.onload = () => {
          if (!isMounted) return;
          imagesRef.current[idx] = img;
          loadedFlagsRef.current[idx] = true;

          if (idx === 1) {
            setIsReady(true);
            drawFrame(1);
            needsRedrawRef.current = true;
          }
          resolve(img);
        };
        img.onerror = () => {
          resolve(img);
        };
      });
    };

    // Priority 1: Load Frame 1 immediately
    loadSingleFrame(1).then(() => {
      if (isMounted) {
        drawFrame(1);
        needsRedrawRef.current = true;
      }
    });

    // Priority 2: Preload next 25 frames for immediate scrolling responsiveness
    const preloadAll = async () => {
      for (let i = 2; i <= Math.min(25, totalFrames); i++) {
        if (!isMounted) return;
        await loadSingleFrame(i);
      }

      // Priority 3: Milestones across timeline (every 10th frame)
      for (let i = 30; i <= totalFrames; i += 10) {
        if (!isMounted) return;
        await loadSingleFrame(i);
      }

      // Priority 4: Fill remaining frames in background batches
      const remaining: number[] = [];
      for (let i = 1; i <= totalFrames; i++) {
        if (!loadedFlagsRef.current[i]) remaining.push(i);
      }

      const batchSize = 6;
      for (let i = 0; i < remaining.length; i += batchSize) {
        if (!isMounted) return;
        await Promise.all(remaining.slice(i, i + batchSize).map(loadSingleFrame));
      }
    };

    preloadAll();

    return () => {
      isMounted = false;
    };
  }, [totalFrames]);

  // Scroll listener & continuous Lerp animation loop
  useEffect(() => {
    const handleScroll = () => {
      const scrollTrack = document.getElementById("scroll-story-track");
      let progress = 0;

      if (scrollTrack) {
        const rect = scrollTrack.getBoundingClientRect();
        const totalDist = rect.height - window.innerHeight;
        if (totalDist > 0) {
          const scrolled = -rect.top;
          progress = Math.max(0, Math.min(1, scrolled / totalDist));
        }
      } else {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        if (maxScroll > 0) {
          progress = Math.max(0, Math.min(1, window.scrollY / maxScroll));
        }
      }

      targetFrameRef.current = 1 + progress * (totalFrames - 1);
    };

    const handleResize = () => {
      handleScroll();
      needsRedrawRef.current = true;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });
    handleScroll();

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lerpFactor = prefersReducedMotion ? 1.0 : 0.12;

    const renderLoop = () => {
      const diff = targetFrameRef.current - currentFrameRef.current;

      if (Math.abs(diff) > 0.001) {
        currentFrameRef.current += diff * lerpFactor;
      } else {
        currentFrameRef.current = targetFrameRef.current;
      }

      const frameToDraw = Math.round(currentFrameRef.current);

      if (frameToDraw !== lastDrawnFrameRef.current || needsRedrawRef.current) {
        drawFrame(frameToDraw);
        lastDrawnFrameRef.current = frameToDraw;
        needsRedrawRef.current = false;
      }

      rafIdRef.current = requestAnimationFrame(renderLoop);
    };

    rafIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [totalFrames]);

  return (
    <div
      className="fixed inset-0 w-screen h-screen overflow-hidden pointer-events-none z-0"
      style={{ width: "100vw", height: "100vh" }}
    >
      {/* Full-Screen HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block object-cover"
        style={{ width: "100%", height: "100%" }}
      />

      {/* Loading state indicator before frame 1 paints */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#f4ebd7] z-10 pointer-events-none">
          <div className="flex items-center gap-2 text-xs font-mono text-[#5c6470]">
            <span className="w-2 h-2 rounded-full bg-[#124ead] animate-ping" />
            <span>INITIALIZING CINEMATIC SEQUENCE...</span>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// 2. MAIN ARCHITECT HERO COMPONENT (Full-Screen illoca.com Architecture)
// =========================================================================
export interface ArchitectHeroProps {
  brandName?: string;
}

export function ArchitectHero({
  brandName = "[YOUR BRAND NAME]",
}: ArchitectHeroProps) {
  const [currentBrand, setCurrentBrand] = useState(brandName);
  const [isEditingBrand, setIsEditingBrand] = useState(false);
  const [isPastHero, setIsPastHero] = useState(false);
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);
  const exploreBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const checkScroll = () => {
      const track = document.getElementById("scroll-story-track");
      if (track) {
        const rect = track.getBoundingClientRect();
        setIsPastHero(rect.bottom <= window.innerHeight * 0.2);
      }
    };
    window.addEventListener("scroll", checkScroll, { passive: true });
    checkScroll();
    return () => window.removeEventListener("scroll", checkScroll);
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-[#f4ebd7] text-[#292929] selection:bg-[#124ead]/20 selection:text-[#124ead] overflow-x-hidden">
      
      {/* 1. FIXED FULL-SCREEN HTML5 CANVAS (100vw x 100vh) */}
      <FullScreenCanvas totalFrames={183} />

      {/* 2. FIXED TOP MARGINALIA & FLOATING NAVBAR (Z-40) */}
      <header className="fixed top-0 left-0 w-full z-40 pointer-events-none px-4 sm:px-8 md:px-12 pt-3">
        <div className="w-full flex items-start justify-between relative">
          
          {/* Top-Left: Technical Drafting Coordinates */}
          <div className="text-[11px] sm:text-xs font-mono text-[#5c6470] tracking-tight leading-[1.3] select-none pt-1 pointer-events-auto">
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
          <nav className="absolute left-1/2 -translate-x-1/2 top-0 flex items-center bg-[#fbf9f4] border border-[#292929]/30 rounded-[3px] py-1 px-2.5 sm:px-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)] pointer-events-auto max-w-[94vw]">
            {/* Blueprint Geometric Logo + Brand Name */}
            <div className="flex items-center gap-2 pr-3 sm:pr-4 border-r border-[#292929]/20">
              <svg
                className="w-5 h-5 text-[#124ead] flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#124ead"
                strokeWidth="1.8"
              >
                <rect x="2" y="2" width="20" height="20" stroke="#124ead" strokeWidth="1.5" />
                <line x1="12" y1="2" x2="12" y2="22" stroke="#124ead" strokeWidth="1.2" />
                <line x1="2" y1="12" x2="22" y2="12" stroke="#124ead" strokeWidth="1.2" />
                <line x1="4.5" y1="5.5" x2="9.5" y2="5.5" stroke="#124ead" strokeWidth="1.2" />
                <line x1="4.5" y1="8" x2="9.5" y2="8" stroke="#124ead" strokeWidth="1.2" />
                <line x1="4.5" y1="10.5" x2="9.5" y2="10.5" stroke="#124ead" strokeWidth="1.2" />
                <polygon points="17,5 14,10 20,10" fill="#124ead" stroke="none" />
                <circle cx="7" cy="17" r="2.8" stroke="#124ead" strokeWidth="1.2" />
                <circle cx="7" cy="17" r="1" fill="#124ead" />
                <rect x="14.5" y="14.5" width="5" height="5" fill="#124ead" />
              </svg>

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
              <a href="#platform" className="hover:text-[#124ead] transition-colors flex items-center gap-1 select-none">
                <span>Platform</span>
                <svg className="w-2.5 h-2.5 text-[#292929]/70" viewBox="0 0 10 6" fill="currentColor">
                  <path d="M0 0L5 5L10 0H0Z" />
                </svg>
              </a>
              <a href="#how-it-works" className="hover:text-[#124ead] transition-colors select-none">
                How It Works
              </a>
              <a href="#solutions" className="hover:text-[#124ead] transition-colors select-none">
                Solutions
              </a>
            </div>

            {/* Right CTA Button */}
            <div className="pl-1 sm:pl-2">
              <button
                ref={exploreBtnRef}
                type="button"
                onClick={() => setIsModeModalOpen(true)}
                className="group inline-flex items-center gap-2 bg-[#124ead] hover:bg-[#0d3b85] text-white text-[11px] sm:text-[12px] font-semibold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-[3px] transition-all shadow-sm active:scale-95 select-none cursor-pointer"
              >
                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-[#ff5500] rounded-[2px] flex items-center justify-center p-0.5 flex-shrink-0">
                  <svg viewBox="0 0 14 14" className="w-full h-full text-white" fill="none" stroke="currentColor">
                    <path d="M2 12L12 2M2 2L12 12" strokeWidth="1.6" strokeLinecap="round" />
                    <rect x="3" y="3" width="8" height="8" strokeWidth="1.2" strokeDasharray="1 1" />
                  </svg>
                </div>
                <span className="whitespace-nowrap tracking-normal">Explore Platform</span>
              </button>
            </div>
          </nav>

          {/* Top-Right: Contact Label */}
          <div className="text-[11px] sm:text-xs font-handwriting text-[#4a5260] tracking-wider select-none uppercase pt-1 text-right pointer-events-auto">
            BUILT FOR THE FACTORY FLOOR
          </div>
        </div>
      </header>

      {/* 3. FIXED BOTTOM-RIGHT MICROCOPY (Z-40) */}
      <div
        className={`fixed bottom-3 sm:bottom-4 right-3 sm:right-6 z-40 flex items-center gap-1.5 sm:gap-2 bg-[#024ab4]/85 px-2.5 py-1 rounded-[2px] backdrop-blur-[2px] pointer-events-none select-none transition-opacity duration-300 ${
          isPastHero ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <span className="text-[10px] sm:text-[11px] md:text-[12px] font-sans text-white/95 tracking-normal font-normal drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
          From engineering drawings to actionable factory intelligence.
        </span>
        <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 bg-[#ff5500] rounded-[2px] flex items-center justify-center flex-shrink-0 shadow-sm">
          <svg className="w-2 h-2 text-white stroke-[2.5]" viewBox="0 0 10 10" fill="none" stroke="currentColor">
            <path d="M2 5h6M5 2l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* 4. SCROLL STORY TRACK (450vh) */}
      <div id="scroll-story-track" className="relative w-full min-h-[450vh] z-10 pointer-events-none">
        
        {/* Initial Hero Headline Section:
            Sits at the top of the page on warm parchment grid.
            As user scrolls down, this block scrolls UP and reveals
            the fixed canvas full-screen underneath! */}
        <section className="relative w-full min-h-[50vh] bg-[#f4ebd7] bg-drafting-grid border-b border-[#292929] pt-28 sm:pt-32 pb-10 sm:pb-12 px-4 sm:px-8 md:px-12 flex flex-col items-center justify-center pointer-events-auto">
          <div className="relative w-full max-w-5xl text-center">

            {/* Left Sketched Annotation: "INDUSTRIAL INTELLIGENCE" */}
            <div className="absolute -top-6 sm:-top-8 left-2 sm:left-4 md:-left-12 lg:-left-20 transform -rotate-[5deg] select-none pointer-events-none z-20">
              <div className="relative inline-block px-2 sm:px-2.5 py-0.5">
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
                  <line x1="6" y1="29" x2="134" y2="28" stroke="#5c6470" strokeWidth="0.8" opacity="0.6" />
                </svg>
                <span className="font-handwriting text-[11px] sm:text-[13px] md:text-[14px] text-[#424a56] uppercase tracking-wider font-bold">
                  INDUSTRIAL INTELLIGENCE
                </span>
              </div>
            </div>

            {/* Right Sketched Annotation: "POWERED BY AI" */}
            <div className="absolute top-1/2 translate-y-1 sm:translate-y-2 right-1 sm:right-2 md:-right-10 lg:-right-20 transform rotate-[2deg] select-none pointer-events-none z-20 flex items-center gap-1 sm:gap-1.5">
              <svg className="w-8 sm:w-12 h-4 text-[#5c6470] flex-shrink-0" viewBox="0 0 48 16" fill="none" stroke="currentColor">
                <path d="M45,8 C35,7 20,8 6,8" strokeWidth="1.3" strokeLinecap="round" />
                <path d="M14,3 L5,8 L14,13" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
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

        {/* The Transparent Scroll Track:
            Allows the full-screen canvas underneath to cover 100% of the viewport!
            As the user scrolls through this area, the canvas scrubs through all 183 frames! */}
        <div className="w-full h-[400vh] pointer-events-none" />

      </div>

      {/* Feature Selection Modal */}
      <PlatformModeModal
        isOpen={isModeModalOpen}
        onClose={() => setIsModeModalOpen(false)}
        buttonRef={exploreBtnRef}
      />
    </div>
  );
}

export default ArchitectHero;
