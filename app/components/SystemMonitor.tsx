"use client";

import React, { useEffect, useRef, useState } from "react";
import { SystemHealthCheck } from "../../lib/types";

interface SystemMonitorProps {
  className?: string;
}

export function SystemMonitor({ className = "" }: SystemMonitorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [healthData, setHealthData] = useState<SystemHealthCheck | null>(null);
  const [fetchState, setFetchState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [lastCheckedTime, setLastCheckedTime] = useState<string | null>(null);
  const [lastProbeMs, setLastProbeMs] = useState<number>(24);

  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initial poll on mount, and background refresh every 45s
  useEffect(() => {
    let isMounted = true;
    const runFetch = async () => {
      try {
        const startTime = performance.now();
        const res = await fetch("/api/health", {
          method: "GET",
          headers: { "Cache-Control": "no-cache" },
        });
        const durationMs = Math.round(performance.now() - startTime);
        const json: SystemHealthCheck = await res.json();
        if (!isMounted) return;
        setHealthData(json);
        setFetchState("success");
        setLastProbeMs(durationMs);
        setLastCheckedTime(new Date().toLocaleTimeString());
      } catch {
        if (!isMounted) return;
        setFetchState("error");
        setLastCheckedTime(new Date().toLocaleTimeString());
      }
    };

    runFetch();
    const interval = setInterval(runFetch, 45000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Keyboard navigation & outside click dismissal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Smooth hover intent (prevents flickering when moving pointer into the popup)
  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 180);
  };

  const toggleOpen = () => {
    setIsOpen((prev) => !prev);
  };

  // Derive status
  const overallStatus =
    healthData?.status === "ok"
      ? "HEALTHY"
      : healthData?.status === "degraded"
      ? "DEGRADED"
      : fetchState === "error" || healthData?.status === "error"
      ? "UNAVAILABLE"
      : "CHECKING";

  // Industrial drafting status theme tokens (matching Manufy warm blueprint aesthetic)
  const statusAccent =
    overallStatus === "HEALTHY"
      ? { dot: "bg-[#16A34A]", badge: "text-[#16A34A] bg-[#DCFCE7] border-[#16A34A]/30" }
      : overallStatus === "DEGRADED"
      ? { dot: "bg-[#D97706]", badge: "text-[#B45309] bg-[#FEF3C7] border-[#D97706]/30" }
      : overallStatus === "UNAVAILABLE"
      ? { dot: "bg-[#DC2626]", badge: "text-[#DC2626] bg-[#FEE2E2] border-[#DC2626]/30" }
      : { dot: "bg-[#1E43D8]", badge: "text-[#1E43D8] bg-[#E8EEFC] border-[#1E43D8]/30" };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* ------------------------------------------------------------- */}
      {/* TRIGGER: LIVE pill with blinking green dot on the left        */}
      {/* ------------------------------------------------------------- */}
      <button
        type="button"
        onClick={toggleOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleOpen();
          }
        }}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`System Status: LIVE (${overallStatus}). Click or hover to view detailed cloud telemetry.`}
        className="group relative inline-flex items-center gap-1.5 bg-[#FFF3C4] border border-[#101418]/25 hover:border-[#101418]/60 hover:bg-[#FFEAA0] px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider text-[#101418] transition-all cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#1E43D8] focus:ring-offset-1 focus:ring-offset-[#FFFBF0]"
      >
        {/* Blinking green dot on left hand of LIVE */}
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A34A] opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#16A34A]" />
        </span>

        {/* Text */}
        <span>LIVE</span>
      </button>

      {/* ------------------------------------------------------------- */}
      {/* FLOATING STATUS WINDOW (Matching Manufy Technical Aesthetic)  */}
      {/* ------------------------------------------------------------- */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="System Monitor Telemetry"
          className="absolute right-0 top-full mt-2 w-[290px] sm:w-[320px] rounded-[4px] bg-[#FFFBF0] border-[1.5px] border-[#101418] shadow-[0_6px_20px_rgba(16,20,24,0.14)] p-3 text-[#101418] z-50 animate-in fade-in zoom-in-95 duration-150 font-mono select-none"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#101418]/20">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-[2px] ${statusAccent.dot} inline-block`} />
              <span className="text-[11px] font-bold tracking-wider text-[#101418]">
                MANUFY / SYS.MON
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-[#101418]/70">
              <span className="font-semibold">PROD</span>
              <span className="text-[#101418]/30">::</span>
              <span className="text-[#1E43D8] font-bold">asia-south1</span>
            </div>
          </div>

          {/* Overall System Status Pill */}
          <div className="flex items-center justify-between bg-[#FBF6E9] border border-[#101418]/20 rounded px-2.5 py-1.5 mb-2.5">
            <span className="text-[10px] text-[#101418]/70 uppercase tracking-wider font-semibold">
              Cluster State
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${statusAccent.dot}`} />
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${statusAccent.badge}`}>
                {overallStatus}
              </span>
            </div>
          </div>

          {/* Service telemetry rows */}
          <div className="space-y-1.5 text-[11px]">
            {/* Vertex AI Gemini */}
            <div className="flex items-center justify-between py-1 px-1.5 rounded bg-white/70 border border-[#101418]/10 hover:bg-white transition-colors">
              <div className="flex items-center gap-2">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    healthData?.services.vertexAi.status === "healthy"
                      ? "bg-[#16A34A]"
                      : healthData?.services.vertexAi.status === "mocked"
                      ? "bg-[#1E43D8]"
                      : "bg-[#DC2626]"
                  }`}
                />
                <span className="text-[#101418] font-semibold">Vertex AI</span>
                <span className="text-[9px] text-[#101418]/60 font-mono">gemini-3.8-flash</span>
              </div>
              <span className="text-[9.5px] font-bold text-[#101418]/80">
                {healthData?.services.vertexAi.status === "healthy"
                  ? "LIVE (VERIFIED)"
                  : healthData?.services.vertexAi.status === "mocked"
                  ? "MOCKED"
                  : healthData?.services.vertexAi.status === "unavailable"
                  ? "ERROR"
                  : "READY"}
              </span>
            </div>

            {/* Cloud Storage */}
            <div className="flex items-center justify-between py-1 px-1.5 rounded bg-white/70 border border-[#101418]/10 hover:bg-white transition-colors">
              <div className="flex items-center gap-2">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    healthData?.services.cloudStorage.status === "healthy"
                      ? "bg-[#16A34A]"
                      : healthData?.services.cloudStorage.status === "mocked"
                      ? "bg-[#1E43D8]"
                      : "bg-[#DC2626]"
                  }`}
                />
                <span className="text-[#101418] font-semibold">Cloud Storage</span>
                <span className="text-[9px] text-[#101418]/60 font-mono">GCS</span>
              </div>
              <span className="text-[9.5px] font-bold text-[#101418]/80">
                {healthData?.services.cloudStorage.status === "healthy"
                  ? "LIVE (BUCKET READY)"
                  : healthData?.services.cloudStorage.status === "mocked"
                  ? "LOCAL MOCK"
                  : "UNREACHABLE"}
              </span>
            </div>

            {/* Cloud Firestore */}
            <div className="flex items-center justify-between py-1 px-1.5 rounded bg-white/70 border border-[#101418]/10 hover:bg-white transition-colors">
              <div className="flex items-center gap-2">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    healthData?.services.firestore.status === "healthy"
                      ? "bg-[#16A34A]"
                      : healthData?.services.firestore.status === "mocked"
                      ? "bg-[#1E43D8]"
                      : "bg-[#DC2626]"
                  }`}
                />
                <span className="text-[#101418] font-semibold">Firestore</span>
                <span className="text-[9px] text-[#101418]/60 font-mono">(default)</span>
              </div>
              <span className="text-[9.5px] font-bold text-[#101418]/80">
                {healthData?.services.firestore.status === "healthy"
                  ? "CONNECTED"
                  : healthData?.services.firestore.status === "mocked"
                  ? "LOCAL MEMORY"
                  : "DISCONNECTED"}
              </span>
            </div>
          </div>

          {/* Telemetry Footer */}
          <div className="mt-3 pt-2 border-t border-[#101418]/20 flex items-center justify-between text-[9.5px] text-[#101418]/70">
            <div>
              <span>PROBE: </span>
              <span className="text-[#101418] font-bold">
                {lastProbeMs}ms
              </span>
            </div>
            <div>
              <span>UPDATED: </span>
              <span className="text-[#101418] font-bold">
                {lastCheckedTime || "WAITING"}
              </span>
            </div>
          </div>

          {/* Telemetry Footnote */}
          <div className="mt-1.5 text-[8.5px] text-[#101418]/60 tracking-tight leading-tight">
            Live telemetry polled every 45s from /api/health.
          </div>
        </div>
      )}
    </div>
  );
}
