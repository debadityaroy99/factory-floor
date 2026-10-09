"use client";

import React from "react";
import Link from "next/link";
import { Sidebar } from "./Sidebar";

interface AppShellProps {
  children: React.ReactNode;
  onNewDrawing: () => void;
  selectedRunId: string;
  onSelectRun: (runId: string) => void;
  titleLabel?: string;
}

export function AppShell({
  children,
  onNewDrawing,
  selectedRunId,
  onSelectRun,
  titleLabel = "New drawing",
}: AppShellProps) {
  return (
    <div className="min-h-screen w-full bg-graphpaper p-2 sm:p-4 md:p-6 flex flex-col justify-center items-center text-[#101418] font-sans antialiased relative selection:bg-[#E8EEFC] selection:text-[#1E43D8]">
      {/* 1440px wide Manufy ivory drafting sheet window */}
      <div className="w-full max-w-[1440px] h-[calc(100vh-1rem)] sm:h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)] bg-[#FFFBF0] rounded-xl border-2 border-[#101418] shadow-hard flex flex-col overflow-hidden relative">
        {/* Top Bar */}
        <header className="h-12 border-b-2 border-[#101418] px-4 sm:px-5 flex items-center justify-between bg-[#FFFBF0] shrink-0">
          <div className="flex items-center gap-3">
            {/* Manufy Wordmark & Logo Mark */}
            <Link
              href="/"
              className="flex items-center gap-2 text-[#101418] hover:opacity-90 transition-opacity group cursor-pointer"
              title="Return to Manufy Landing Page"
            >
              {/* Solid royal-blue square logo mark */}
              <div className="w-5 h-5 bg-[#1E43D8] border border-[#101418] rounded-[3px] flex items-center justify-center p-0.5 shadow-2xs group-hover:bg-[#3E6BE0] transition-colors">
                <svg viewBox="0 0 14 14" className="w-full h-full text-white" fill="none" stroke="currentColor">
                  <path d="M2 12L12 2M2 2L12 12" strokeWidth="1.6" strokeLinecap="round" />
                  <rect x="3" y="3" width="8" height="8" strokeWidth="1.2" strokeDasharray="1 1" />
                </svg>
              </div>
              <span className="font-display font-bold text-base tracking-tight text-[#101418]">
                Manufy
              </span>
            </Link>

            <span className="text-[#101418]/30 select-none font-mono">/</span>

            {/* Label in Plex Mono uppercase */}
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#101418]/70 truncate max-w-[200px] sm:max-w-none">
              {titleLabel}
            </span>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            {/* Sparse decor: Tiny mono coordinate readout */}
            <span className="hidden sm:inline-block font-mono text-[11px] tracking-widest text-[#101418]/60 select-none">
              X 127.05 · Y 264.89
            </span>

            {/* Right side: Hand-drawn Caveat annotation link */}
            <Link
              href="/"
              className="font-hand text-base font-bold text-[#101418] hover:text-[#1E43D8] transition-colors underline decoration-[#101418]/30 hover:decoration-[#1E43D8] flex items-center gap-1"
            >
              <span>← Back to Home</span>
            </Link>
          </div>
        </header>

        {/* Content Area: Sidebar + Main Stage */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Sidebar */}
          <Sidebar
            onNewDrawing={onNewDrawing}
            selectedRunId={selectedRunId}
            onSelectRun={onSelectRun}
          />

          {/* Main workspace */}
          <main className="flex-1 flex flex-col overflow-hidden bg-[#FFFBF0]">
            {children}
          </main>
        </div>

        {/* Sparse decor: "N" north-arrow badge at bottom-left corner of the app sheet */}
        <div
          className="absolute bottom-2.5 left-2.5 z-30 w-6 h-6 rounded-full bg-[#FFFBF0] border-[1.5px] border-[#101418] shadow-2xs flex items-center justify-center pointer-events-none select-none"
          title="Grid North"
        >
          <div className="flex items-center justify-center relative">
            <span className="font-mono font-bold text-[9px] text-[#101418] leading-none">N</span>
            <div className="absolute -top-1 w-0 h-0 border-l-[2px] border-l-transparent border-r-[2px] border-r-transparent border-b-[3px] border-b-[#101418]" />
          </div>
        </div>
      </div>
    </div>
  );
}
