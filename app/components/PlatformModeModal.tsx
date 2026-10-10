"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

export interface PlatformModeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
}

export function PlatformModeModal({
  isOpen,
  onClose,
  buttonRef,
}: PlatformModeOverlayProps) {
  const [showCards, setShowCards] = useState(false);
  const [animateLines, setAnimateLines] = useState(false);
  const [coords, setCoords] = useState<{
    startX: number;
    startY: number;
    targetLeftX: number;
    targetRightX: number;
    targetY: number;
  }>({
    startX: 800,
    startY: 48,
    targetLeftX: 360,
    targetRightX: 720,
    targetY: 260,
  });

  const leftCardRef = useRef<HTMLDivElement | null>(null);
  const rightCardRef = useRef<HTMLDivElement | null>(null);

  // Measure button and card positions dynamically
  const updatePositions = () => {
    let startX = window.innerWidth / 2 + 150;
    let startY = 46;

    if (buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      startX = rect.left + rect.width / 2;
      startY = rect.bottom;
    }

    let targetLeftX = window.innerWidth / 2 - 180;
    let targetRightX = window.innerWidth / 2 + 180;
    let targetY = 270;

    if (leftCardRef.current && rightCardRef.current) {
      const leftRect = leftCardRef.current.getBoundingClientRect();
      const rightRect = rightCardRef.current.getBoundingClientRect();
      targetLeftX = leftRect.left + leftRect.width / 2;
      targetRightX = rightRect.left + rightRect.width / 2;
      targetY = leftRect.top;
    }

    setCoords({
      startX,
      startY,
      targetLeftX,
      targetRightX,
      targetY,
    });
  };

  useEffect(() => {
    if (!isOpen) return;

    updatePositions();
    window.addEventListener("resize", updatePositions);

    // Re-measure once DOM renders the cards container
    const measureTimer = setTimeout(() => {
      updatePositions();
    }, 30);

    // 1. Immediately trigger the orange lines animation
    const lineTimer = setTimeout(() => {
      setAnimateLines(true);
    }, 60);

    // 2. Once the lines swoop down from the top navbar (~420ms), pop the 2 mode cards
    const cardsTimer = setTimeout(() => {
      setShowCards(true);
    }, 420);

    return () => {
      window.removeEventListener("resize", updatePositions);
      clearTimeout(measureTimer);
      clearTimeout(lineTimer);
      clearTimeout(cardsTimer);
      setShowCards(false);
      setAnimateLines(false);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Natural curving cubic-bezier paths from the navbar button down to the two cards
  const leftDx = coords.targetLeftX - coords.startX;
  const leftDy = coords.targetY - coords.startY;
  const pathLeft = `M ${coords.startX} ${coords.startY} C ${coords.startX + leftDx * 0.15} ${coords.startY + leftDy * 0.65}, ${coords.targetLeftX} ${coords.startY + leftDy * 0.35}, ${coords.targetLeftX} ${coords.targetY}`;

  const rightDx = coords.targetRightX - coords.startX;
  const rightDy = coords.targetY - coords.startY;
  const pathRight = `M ${coords.startX} ${coords.startY} C ${coords.startX + rightDx * 0.2} ${coords.startY + rightDy * 0.65}, ${coords.targetRightX} ${coords.startY + rightDy * 0.35}, ${coords.targetRightX} ${coords.targetY}`;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-[#101418]/50 backdrop-blur-md transition-opacity duration-300 animate-in fade-in select-none"
      onClick={onClose}
    >
      {/* Full-screen SVG for dynamic arrow paths directly from the existing navbar CTA */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        style={{ width: "100vw", height: "100vh" }}
      >
        <defs>
          <marker
            id="navbar-orange-arrowhead-left"
            markerWidth="11"
            markerHeight="11"
            refX="7.5"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0.5, 8.5 3.5, 0 6.5" fill="#ff5500" />
          </marker>
          <marker
            id="navbar-orange-arrowhead-right"
            markerWidth="11"
            markerHeight="11"
            refX="7.5"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0.5, 8.5 3.5, 0 6.5" fill="#ff5500" />
          </marker>
        </defs>

        {/* Left swooping curve from navbar button to Architect Mode card */}
        <path
          d={pathLeft}
          stroke="#ff5500"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeDasharray="700"
          strokeDashoffset={animateLines ? "0" : "700"}
          markerEnd={animateLines ? "url(#navbar-orange-arrowhead-left)" : undefined}
          className="transition-all duration-500 ease-out fill-none"
        />

        {/* Right swooping curve from navbar button to Frontline Mode card */}
        <path
          d={pathRight}
          stroke="#ff5500"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeDasharray="700"
          strokeDashoffset={animateLines ? "0" : "700"}
          markerEnd={animateLines ? "url(#navbar-orange-arrowhead-right)" : undefined}
          className="transition-all duration-500 ease-out fill-none"
        />
      </svg>

      {/* Floating Close Button in top right */}
      <div className="absolute top-4 right-6 sm:right-10 z-30">
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="w-8 h-8 rounded-full bg-[#FFFBF0] border-2 border-[#101418] text-[#101418] hover:bg-[#FF5500] hover:text-white transition-colors flex items-center justify-center font-bold text-sm shadow-[2px_2px_0_#101418] cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Mode Cards Container - Positioned nicely in the upper-mid area below the navbar */}
      <div
        className="relative w-full h-full flex flex-col items-center justify-start pt-32 sm:pt-40 md:pt-44 p-4 z-20"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10 w-full max-w-[720px] transition-all duration-500 ease-out transform ${
            showCards
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-95 translate-y-4 pointer-events-none"
          }`}
        >
          {/* Card 1: Architect Mode -> /architect */}
          <div ref={leftCardRef}>
            <Link
              href="/architect"
              className="group block relative bg-[#FFFBF0] rounded-xl border-2 border-[#101418] shadow-[6px_6px_0_#101418] hover:shadow-[8px_8px_0_#101418] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all overflow-hidden cursor-pointer"
            >
              {/* Illustration */}
              <div className="relative w-full aspect-[4/3] bg-[#EAE2CE] flex items-center justify-center p-3 sm:p-4 overflow-hidden border-b-2 border-[#101418]">
                <Image
                  src="/modes/architect-mode.png"
                  alt="Architect Mode"
                  fill
                  className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                  priority
                />
              </div>

              {/* Orange Mode Banner Button */}
              <div className="bg-[#ff5500] group-hover:bg-[#e04a00] text-white py-3 sm:py-3.5 px-4 text-center font-bold tracking-wide text-sm sm:text-base flex items-center justify-center gap-2 transition-colors">
                <span>Architect Mode</span>
                <span className="text-white/90 text-sm group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          </div>

          {/* Card 2: Frontline Mode -> /frontline */}
          <div ref={rightCardRef}>
            <Link
              href="/frontline"
              className="group block relative bg-[#FFFBF0] rounded-xl border-2 border-[#101418] shadow-[6px_6px_0_#101418] hover:shadow-[8px_8px_0_#101418] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all overflow-hidden cursor-pointer"
            >
              {/* Illustration */}
              <div className="relative w-full aspect-[4/3] bg-[#EAE2CE] flex items-center justify-center p-3 sm:p-4 overflow-hidden border-b-2 border-[#101418]">
                <Image
                  src="/modes/frontline-mode.png"
                  alt="Frontline Mode"
                  fill
                  className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                  priority
                />
              </div>

              {/* Orange Mode Banner Button */}
              <div className="bg-[#ff5500] group-hover:bg-[#e04a00] text-white py-3 sm:py-3.5 px-4 text-center font-bold tracking-wide text-sm sm:text-base flex items-center justify-center gap-2 transition-colors">
                <span>Frontline Mode</span>
                <span className="text-white/90 text-sm group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlatformModeModal;
