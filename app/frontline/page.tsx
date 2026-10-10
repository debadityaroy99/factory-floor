"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { SystemMonitor } from "../components/SystemMonitor";

// =========================================================================
// TYPES & DATA
// =========================================================================
import {
  PERSONAS,
  FRONTLINE_GUARDRAIL_MESSAGE,
  type Persona,
  type Ticket,
  type TicketStatus,
} from "@/lib/mock/frontlineData";
import { classifyFrontlineIntent } from "@/lib/frontline/router";
import { formatFrontlinePlainText } from "@/lib/frontline/format";

export { PERSONAS };
export type { Persona, Ticket, TicketStatus };

type MessageType =
  | { type: "user"; text: string }
  | { type: "agent_text"; text: string; showLabel?: boolean }
  | { type: "alert"; text: string }
  | {
      type: "plan_card" | "plan_turn";
      title?: string;
      checklist?: string[];
      badge?: string;
      ackText?: string;
      outcomeText?: string;
      showPills?: boolean;
    }
  | { type: "training_card" }
  | { type: "live_count_card"; showApproveBtn?: boolean }
  | { type: "history_card" }
  | { type: "status_pill"; text: string; dotColor?: string }
  | { type: "outcome_pill"; text: string };

const ROTATING_WORDS = [
  { text: "fixing", bg: "#1E43D8", color: "#FFFFFF" },
  { text: "asking", bg: "#FFC53D", color: "#101418" },
  { text: "planning", bg: "#3E6BE0", color: "#FFFFFF" },
  { text: "doing", bg: "#FF6B2C", color: "#FFFFFF" },
];

// =========================================================================
// SUB-COMPONENTS (ICONS & FRAME CARDS)
// =========================================================================

function TicketIcon({ icon }: { icon: Ticket["icon"] }) {
  const common = "w-14 h-14 text-[#1E43D8] stroke-[#1E43D8] group-hover:scale-110 transition-transform duration-300";
  switch (icon) {
    case "wrench":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          <circle cx="6" cy="18" r="1.5" />
        </svg>
      );
    case "thermometer":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
        </svg>
      );
    case "droplet":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          <circle cx="12" cy="14" r="3" />
        </svg>
      );
    case "flask":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 2v7.31L4.62 18.66A2 2 0 0 0 6.36 21h11.28a2 2 0 0 0 1.74-2.34L14 9.31V2" />
          <line x1="8.5" y1="2" x2="15.5" y2="2" />
          <line x1="7" y1="16" x2="17" y2="16" />
        </svg>
      );
    case "gear":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    case "ruler":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.3 8.7l-6-6a2 2 0 0 0-2.8 0L2.7 12.5a2 2 0 0 0 0 2.8l6 6a2 2 0 0 0 2.8 0l9.8-9.8a2 2 0 0 0 0-2.8z" />
          <line x1="8.5" y1="14.5" x2="11" y2="12" />
          <line x1="12" y1="11" x2="14.5" y2="8.5" />
          <line x1="15.5" y1="7.5" x2="18" y2="5" />
        </svg>
      );
    case "bolt":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case "oil-drop":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v6" />
          <path d="M12 22a7 7 0 0 0 7-7c0-4-7-11-7-11s-7 7-7 7a7 7 0 0 0 7 7z" />
        </svg>
      );
    case "battery":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="16" height="10" rx="2" ry="2" />
          <line x1="22" y1="11" x2="22" y2="13" />
          <line x1="6" y1="11" x2="6" y2="13" />
          <line x1="10" y1="11" x2="10" y2="13" />
        </svg>
      );
    case "clipboard":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          <line x1="9" y1="12" x2="15" y2="12" />
          <line x1="9" y1="16" x2="13" y2="16" />
        </svg>
      );
  }
}

function StatusPill({ status }: { status: TicketStatus }) {
  if (status === "HIGH") {
    return (
      <span className="bg-[#D92D20] text-white font-mono font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded shadow-xs">
        HIGH
      </span>
    );
  }
  if (status === "IN PROGRESS") {
    return (
      <span className="bg-[#1E43D8] text-white font-mono font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded shadow-xs">
        IN PROGRESS
      </span>
    );
  }
  if (status === "WAITING PARTS") {
    return (
      <span className="bg-[#FFF3C4] text-[#101418] border border-[#101418]/30 font-mono font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded shadow-xs">
        WAITING PARTS
      </span>
    );
  }
  return (
    <span className="bg-[#FFFBF0] text-[#101418] border-[1.5px] border-[#101418] font-mono font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded shadow-xs">
      OPEN
    </span>
  );
}

// (a) PLAN Turn (animated checklist + stage-sequenced pills)
function PlanTurn({
  title = "● SIDEKICK'S PLAN",
  checklist = [
    "Flag the drift: Press 3 · Line 2",
    "Create work order W-3318",
    "Text Devin the fix history",
    "Save the fix to knowledge",
  ],
  badge = "W-3318 · HIGH",
  ackText,
  outcomeText,
  showPills = true,
}: {
  title?: string;
  checklist?: string[];
  badge?: string;
  ackText?: string;
  outcomeText?: string;
  showPills?: boolean;
}) {
  const [stage, setStage] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 6 : 0;
    }
    return 0;
  });

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (prefersReducedMotion) {
      setStage(6);
      return;
    }

    // Timeline:
    // 0ms mount: all unchecked, pills hidden
    // 500ms: tick 1 lands
    // 1250ms (750ms later): tick 2 lands
    // 2000ms (750ms later): tick 3 lands
    // 2750ms (750ms later): tick 4 lands
    // 3200ms (450ms later): ack pill slides in
    // 3850ms (650ms later): outcome pill slides in (final state)
    const t1 = setTimeout(() => setStage(1), 500);
    const t2 = setTimeout(() => setStage(2), 1250);
    const t3 = setTimeout(() => setStage(3), 2000);
    const t4 = setTimeout(() => setStage(4), 2750);
    const t5 = setTimeout(() => setStage(5), 3200);
    const t6 = setTimeout(() => setStage(6), 3850);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
    };
  }, [prefersReducedMotion]);

  return (
    <div className="w-full max-w-[560px] space-y-3">
      {/* Plan Card */}
      <div className="w-full bg-[#FFFBF0] border-2 border-[#101418] rounded-[14px] p-4 sm:p-5 shadow-hard space-y-3 animate-slide-up">
        <div className="flex items-center justify-between pb-2 border-b border-[#101418]/15">
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#101418]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1E43D8]" />
            <span>{title}</span>
          </div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FDECEA] text-[#D92D20] border border-[#D92D20]/20">
            {badge}
          </span>
        </div>

        <div className="space-y-2">
          {checklist.map((task, i) => {
            const isChecked = stage > i;
            return (
              <div key={i} className="flex items-center gap-2.5">
                <div
                  className={`w-4 h-4 rounded-[4px] border-[1.5px] border-[#101418] flex items-center justify-center flex-shrink-0 shadow-xs transition-colors duration-[120ms] ${
                    isChecked
                      ? "bg-[#1E43D8] text-white animate-check-pop"
                      : "bg-white text-transparent"
                  }`}
                >
                  {isChecked && (
                    <svg
                      className="w-2.5 h-2.5 stroke-[2.5]"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        d="M2.5 6.5L4.5 8.5L9.5 3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        pathLength={1}
                        className={prefersReducedMotion ? "" : "animate-draw-check"}
                        style={{
                          strokeDasharray: 1,
                          strokeDashoffset: prefersReducedMotion ? 0 : undefined,
                        }}
                      />
                    </svg>
                  )}
                </div>
                <span className="text-[13.5px] font-sans text-[#101418] leading-tight">
                  {task}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Acknowledged Status Pill */}
      {showPills && ackText && stage >= 5 && (
        <div className="flex justify-start animate-slide-up">
          <div className="inline-flex items-center gap-2 bg-[#FFFBF0] border-[1.5px] border-[#101418] rounded-full px-3.5 py-1 text-[12px] font-sans text-[#101418] shadow-hard-xs">
            <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
            <span>{ackText}</span>
          </div>
        </div>
      )}

      {showPills && outcomeText && stage >= 6 && (
        <div className="flex justify-start animate-slide-up">
          <div className="inline-flex items-center gap-1.5 bg-[#1E43D8] text-white rounded-full px-4 py-1.5 text-[12.5px] font-sans font-medium shadow-hard-xs">
            <span>✓</span>
            <span>{outcomeText.replace(/^✓\s*/, "")}</span>
          </div>
        </div>
      )}
    </div>
  );
}

const PlanCard = PlanTurn;

// (b) TRAINING Card
function TrainingCard() {
  return (
    <div className="w-full max-w-[560px] bg-[#FFFBF0] border-2 border-[#101418] rounded-[14px] p-4 sm:p-5 shadow-hard space-y-3 animate-slide-up">
      <div className="flex items-center justify-between pb-2 border-b border-[#101418]/15">
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#101418]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1E43D8]" />
          <span>TRAINING RECORD</span>
        </div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FFFBF0] text-[#101418] border-[1.5px] border-[#101418]">
          PRIYA S. · NEW HIRE
        </span>
      </div>

      <div className="divide-y divide-[#101418]/10 text-[12.5px] font-sans">
        <div className="flex items-center justify-between py-1.5">
          <span className="text-[#5C6470]">Role</span>
          <span className="text-[#101418] font-medium">CNC operator · station 4</span>
        </div>
        <div className="flex items-center justify-between py-1.5">
          <span className="text-[#5C6470]">Started</span>
          <span className="text-[#101418] font-medium">Monday · second shift</span>
        </div>
        <div className="flex items-center justify-between py-1.5">
          <span className="text-[#5C6470]">Forklift basics</span>
          <span className="text-[#12805C] font-semibold">✓ certified</span>
        </div>
        <div className="flex items-center justify-between py-1.5">
          <span className="text-[#5C6470]">Lockout/tagout</span>
          <span className="text-[#12805C] font-semibold">✓ certified</span>
        </div>
        <div className="flex items-center justify-between py-1.5">
          <span className="text-[#5C6470]">Chemical handling</span>
          <span className="px-2 py-0.5 rounded bg-[#FFF3C4] text-[#8A6D00] font-mono font-bold text-[10px] border border-[#8A6D00]/20">
            MISSING
          </span>
        </div>
      </div>
    </div>
  );
}

// (c) LIVE COUNT Card
function LiveCountCard() {
  return (
    <div className="w-full max-w-[560px] bg-[#FFFBF0] border-2 border-[#101418] rounded-[14px] p-4 sm:p-5 shadow-hard space-y-3 animate-slide-up">
      <div className="flex items-center justify-between pb-2 border-b border-[#101418]/15">
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#101418]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1E43D8]" />
          <span>LIVE COUNT</span>
        </div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FFFBF0] text-[#101418] border border-[#101418]/25">
          TOOL CRIB B
        </span>
      </div>

      <div className="space-y-1.5 text-[12.5px] font-sans">
        <div className="flex items-center justify-between py-0.5">
          <span className="text-[#5C6470]">Item</span>
          <span className="text-[#101418] font-medium">CNMG 432 inserts</span>
        </div>
        <div className="flex items-center justify-between py-0.5">
          <span className="text-[#5C6470]">Supplier</span>
          <span className="text-[#101418] font-medium">MSC Industrial · net-30</span>
        </div>
        <div className="flex items-center justify-between py-0.5">
          <span className="text-[#5C6470]">Reorder point</span>
          <span className="text-[#101418] font-medium">12 on hand</span>
        </div>

        <div className="pt-1.5">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-[#5C6470]">On hand</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-display font-bold text-[#D92D20] leading-none">
                3
              </span>
              <span className="text-[11px] font-mono font-bold text-[#D92D20]">
                9 under
              </span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-[#EFE9DC] rounded-full overflow-hidden">
            <div className="h-full bg-[#D92D20] rounded-full w-[25%]" />
          </div>
        </div>
      </div>
    </div>
  );
}

// (d) HISTORY Card
function HistoryCard() {
  return (
    <div className="w-full max-w-[560px] bg-[#FFFBF0] border-2 border-[#101418] rounded-[14px] p-4 sm:p-5 shadow-hard space-y-3.5 animate-slide-up">
      <div className="bg-[#FFF3C4] border-[1.5px] border-[#101418] rounded-[10px] p-3 space-y-1 shadow-xs">
        <p className="font-sans text-[13px] text-[#101418] leading-relaxed">
          ISO 46 change on Apr 02 by Devin. Next due at 1,500 hrs. Cage D has 2 in stock.
        </p>
        <div className="font-mono text-[10px] text-[#5C6470] tracking-wider uppercase font-semibold">
          CITES SOP-HYD-11 · APR 02 · VERIFIED
        </div>
      </div>

      <div className="bg-white border border-[#101418]/15 rounded-xl overflow-hidden divide-y divide-[#101418]/10 shadow-xs">
        {[
          {
            title: "Conveyor 3 bearing failure",
            sub: "Replace 6205-2RS · resolved by Mike T.",
            date: "Today",
            highlight: false,
          },
          {
            title: "CNC-3 coolant PSI drop",
            sub: "Check pump seal · cited SOP-CNC-07 p3",
            date: "Apr 14",
            highlight: false,
          },
          {
            title: "Forklift battery rotation",
            sub: "Bank A → C every Tues · per Mike",
            date: "Apr 11",
            highlight: false,
          },
          {
            title: "Allen-Bradley fault E-04",
            sub: "Reset sequence + photo · per Devin",
            date: "Apr 06",
            highlight: false,
          },
          {
            title: "Hydraulic press oil change",
            sub: "ISO 46 · every 500 hrs · Cage D",
            date: "Apr 02",
            highlight: true,
          },
        ].map((entry, idx) => (
          <div
            key={idx}
            className={`px-3.5 py-2.5 flex items-center justify-between transition-colors ${
              entry.highlight
                ? "bg-[#FFF3C4] border-t border-[#101418]/10"
                : "hover:bg-[#E8EEFC]"
            }`}
          >
            <div className="space-y-0.5">
              <div className="font-sans font-medium text-[13.5px] text-[#101418]">
                {entry.title}
              </div>
              <div className="font-sans text-[12px] text-[#5C6470]">
                {entry.sub}
              </div>
            </div>
            <div className="font-mono text-[11px] text-[#5C6470] uppercase tracking-wider font-semibold">
              {entry.date}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 pt-0.5 text-[12px] font-sans">
        <span className="w-1.5 h-1.5 rounded-full bg-[#1E43D8] flex-shrink-0" />
        <span className="text-[#5C6470]">+12 entries captured this week.</span>
        <span className="font-bold text-[#101418]">Nothing walks out the door</span>
      </div>
    </div>
  );
}

// =========================================================================
// MAIN PAGE COMPONENT: 'gate' | 'home' | 'chat'
// =========================================================================
export default function FrontlinePage() {
  const [view, setView] = useState<"gate" | "home" | "chat">("gate");
  const [currentPersona, setCurrentPersona] = useState<Persona>(PERSONAS[0]);
  const [selectedGateId, setSelectedGateId] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Rotating Word State in Home
  const [wordIndex, setWordIndex] = useState(0);
  const [pillWidth, setPillWidth] = useState<number | undefined>(undefined);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const dropdownButtonRef = useRef<HTMLButtonElement | null>(null);

  // Read localStorage on initial mount
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", listener);

    try {
      const storedId = localStorage.getItem("frontline.persona");
      if (storedId) {
        const found = PERSONAS.find((p) => p.id === storedId);
        if (found) {
          setCurrentPersona(found);
          setSelectedGateId(found.id);
          setView("home");
          return () => mediaQuery.removeEventListener("change", listener);
        }
      }
    } catch {
      // localStorage may fail in restricted mode, default to gate
    }

    setView("gate");
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  // Measure word widths and update pill width for rotating H1
  useEffect(() => {
    const updateWidth = () => {
      const isMobile = window.innerWidth <= 700;
      if (isMobile) {
        const planningSpan = wordRefs.current[2];
        if (planningSpan) {
          setPillWidth(planningSpan.offsetWidth + 28);
        }
      } else {
        const activeSpan = wordRefs.current[wordIndex];
        if (activeSpan) {
          setPillWidth(activeSpan.offsetWidth + 28);
        }
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [wordIndex, view]);

  // Rotate words every 1500ms in Home
  useEffect(() => {
    if (prefersReducedMotion || view !== "home") return;

    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 1500);

    return () => clearInterval(interval);
  }, [prefersReducedMotion, view]);

  // Home composer state
  const [homeInput, setHomeInput] = useState("");

  // Chat conversation state
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [canApprovePo, setCanApprovePo] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (view === "chat") {
      scrollToBottom("smooth");
    }
  }, [messages, isTyping, view]);

  const suggestionChips = [
    "When was the press oil last changed?",
    "Any equipment drifting?",
    "Priya's training status",
    "Stock check: CNMG inserts",
  ];

  // Centralized route executor across chat input and home launcher
  const executeRoute = async (raw: string) => {
    setIsTyping(true);

    const decision = classifyFrontlineIntent(raw, {
      canApprovePo,
      currentPersonaId: currentPersona.id,
    });

    // PATH_A: Existing supported mock interactions
    if (decision.path === "PATH_A") {
      setTimeout(() => {
        setIsTyping(false);

        if (decision.scenario === "approve") {
          setCanApprovePo(false);
          setMessages((prev) => [
            ...prev,
            {
              type: "outcome_pill",
              text: "✓ PO-1042 sent, arrives Thursday",
            },
          ]);
        } else if (decision.scenario === "oil_history") {
          setMessages((prev) => [
            ...prev,
            {
              type: "agent_text",
              text: "Here's the last change — straight from the floor record.",
              showLabel: true,
            },
            {
              type: "history_card",
            },
          ]);
        } else if (decision.scenario === "equipment_drift") {
          setMessages((prev) => [
            ...prev,
            {
              type: "alert",
              text: "Two things nobody has reported yet.",
            },
            {
              type: "plan_turn",
              checklist: [
                "Flag the drift: Press 3 · Line 2",
                "Create work order W-3318",
                `Text ${currentPersona.assigneeName} the fix history`,
                "Save the fix to knowledge",
              ],
              ackText: `${currentPersona.firstName} acknowledged, ETA 10 min`,
              outcomeText: "✓ Fix saved to the knowledge base",
            },
          ]);
        } else if (decision.scenario === "training") {
          setMessages((prev) => [
            ...prev,
            {
              type: "training_card",
            },
            {
              type: "alert",
              text: "Station 4 needs the cert — nobody has scheduled it",
            },
            {
              type: "agent_text",
              text: "Ready for chemical handling? Six short steps with a quiz — I'll check each one as you go.",
              showLabel: false,
            },
            {
              type: "outcome_pill",
              text: "✓ Module assigned, verified step by step",
            },
          ]);
        } else if (decision.scenario === "inventory_stock") {
          setCanApprovePo(true);
          setMessages((prev) => [
            ...prev,
            {
              type: "live_count_card",
              showApproveBtn: true,
            },
            {
              type: "alert",
              text: "Below the reorder point — nobody has ordered",
            },
            {
              type: "agent_text",
              text: "Down to 3 CNMG inserts. I've drafted a PO to MSC for 50 — reply APPROVE to send it.",
              showLabel: false,
            },
          ]);
        }
      }, 900);
      return;
    }

    // PATH_C: Unsupported, unrelated, or nonsensical input -> exact existing guardrail message
    if (decision.path === "PATH_C") {
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            type: "agent_text",
            text: decision.guardrailText || FRONTLINE_GUARDRAIL_MESSAGE,
            showLabel: true,
          },
        ]);
      }, 600);
      return;
    }

    // PATH_B: Valid analytical / reasoning question over mock operational data via Vertex AI
    try {
      const res = await fetch("/api/frontline/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: raw,
          personaId: currentPersona.id,
          canApprovePo,
        }),
      });

      const data = await res.json();
      setIsTyping(false);

      if (!res.ok || data.error) {
        setMessages((prev) => [
          ...prev,
          {
            type: "agent_text",
            text: `⚠️ Operational summary unavailable: ${data.details || data.error || "Vertex AI service error"}`,
            showLabel: true,
          },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          type: "agent_text",
          text: formatFrontlinePlainText(data.text),
          showLabel: true,
        },
      ]);
    } catch (err: any) {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          type: "agent_text",
          text: `⚠️ Network error communicating with Frontline intelligence: ${err?.message || "Failed to fetch"}`,
          showLabel: true,
        },
      ]);
    }
  };

  // Send message in Chat mode
  const sendChatMessage = (rawText: string) => {
    const raw = rawText.trim();
    if (!raw || isTyping) return;

    setChatInput("");
    setMessages((prev) => [...prev, { type: "user", text: raw }]);
    executeRoute(raw);
  };

  // Launch Chat mode from Home composer or chips
  const handleLaunchFromHome = (query: string) => {
    const text = query.trim();
    if (!text || isTyping) return;

    setHomeInput("");
    setView("chat");
    setMessages([{ type: "user", text }]);
    executeRoute(text);
  };

  // Launch Chat mode from Ticket cards
  const handleSelectTicket = (ticket: Ticket) => {
    setView("chat");
    setIsTyping(true);

    setMessages([
      {
        type: "user",
        text: `${ticket.code}: ${ticket.title}`,
      },
    ]);

    setTimeout(() => {
      setIsTyping(false);

      if (ticket.code === "W-3321") {
        setMessages((prev) => [
          ...prev,
          {
            type: "agent_text",
            text: `Here's the bracket ticket, ${currentPersona.firstName}.`,
            showLabel: true,
          },
          {
            type: "plan_turn",
            title: `● TICKET ${ticket.code} · ENGINE LINE 2`,
            badge: `${ticket.code} · HIGH`,
            checklist: [
              "Isolate Engine Line 2 and lock out",
              "Torque all 6 bracket bolts to 45 Nm",
              "Check for fretting on the mount face",
              "Log torque values to the floor record",
            ],
            showPills: false,
          },
        ]);
      } else if (ticket.code === "W-3318") {
        setMessages((prev) => [
          ...prev,
          {
            type: "alert",
            text: "Hydraulic temp 13° over spec — nobody has reported it",
          },
          {
            type: "plan_turn",
            title: "● SIDEKICK'S PLAN",
            badge: "W-3318 · HIGH",
            checklist: [
              "Flag the drift: Press 3 · Line 2",
              "Create work order W-3318",
              `Text ${currentPersona.assigneeName} the fix history`,
              "Save the fix to knowledge",
            ],
            ackText: `${currentPersona.firstName} acknowledged, ETA 10 min`,
            outcomeText: "✓ Fix saved to the knowledge base",
          },
        ]);
      } else if (ticket.code === "T-118") {
        setMessages((prev) => [
          ...prev,
          {
            type: "training_card",
          },
          {
            type: "alert",
            text: "Station 4 needs the cert — nobody has scheduled it",
          },
          {
            type: "agent_text",
            text: "Ready for chemical handling? Six short steps with a quiz — I'll check each one as you go.",
            showLabel: false,
          },
          {
            type: "outcome_pill",
            text: "✓ Module assigned, verified step by step",
          },
        ]);
      } else if (ticket.code === "P-1042") {
        setCanApprovePo(true);
        setMessages((prev) => [
          ...prev,
          {
            type: "live_count_card",
            showApproveBtn: true,
          },
          {
            type: "alert",
            text: "Below the reorder point — nobody has ordered",
          },
          {
            type: "agent_text",
            text: "Down to 3 CNMG inserts. I've drafted a PO to MSC for 50 — reply APPROVE to send it.",
            showLabel: false,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            type: "agent_text",
            text: `Here's the history for ${ticket.code}, ${currentPersona.firstName}.`,
            showLabel: true,
          },
          {
            type: "history_card",
          },
        ]);
      }
    }, 700);
  };

  // Clock in from Gate
  const handleClockIn = () => {
    if (!selectedGateId) return;
    const persona = PERSONAS.find((p) => p.id === selectedGateId);
    if (persona) {
      setCurrentPersona(persona);
      try {
        localStorage.setItem("frontline.persona", persona.id);
      } catch {
        // ignore
      }
      setView("home");
    }
  };

  // Calculate open / high counts
  const highCount = currentPersona.tickets.filter((t) => t.status === "HIGH").length;
  const openCount = currentPersona.tickets.length;

  return (
    <div className="h-[100dvh] flex flex-col bg-[#F6EFDB] bg-drafting-grid text-[#101418] font-sans overflow-hidden select-none">
      {/* =========================================================================
          HEADER BAR (SHARED ACROSS VIEWS)
      ========================================================================= */}
      <header className="h-14 sm:h-16 border-b-[1.5px] border-[#101418] bg-[#FFFBF0] px-4 sm:px-8 flex items-center justify-between flex-shrink-0 z-30">
        {/* Left: Manufy logo + optional "← Today" button in chat mode */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-5 h-5 bg-[#1E43D8] rounded-[2px] flex items-center justify-center text-white font-bold text-xs shadow-sm">
              M
            </div>
            <span className="font-display font-bold text-lg sm:text-xl tracking-tight text-[#101418]">
              Manufy
            </span>
          </Link>

          {view === "chat" && (
            <>
              <span className="text-[#101418]/30 font-mono text-xs">/</span>
              <button
                type="button"
                onClick={() => setView("home")}
                className="font-mono text-xs font-semibold text-[#1E43D8] hover:underline uppercase tracking-wider flex items-center gap-1 cursor-pointer"
              >
                ← Today
              </button>
            </>
          )}
        </div>

        {/* Center: Label in IBM Plex Mono uppercase */}
        <div className="font-mono text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#101418] px-2.5 py-0.5 rounded border border-[#101418]/20 bg-[#FBF6E9]">
          FRONTLINE MODE
        </div>

        {/* Right side: Persona chip + Butter pill + "← All modes" link */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {view !== "gate" && (
            <button
              type="button"
              onClick={() => {
                setSelectedGateId(currentPersona.id);
                setView("gate");
              }}
              title="Switch worker"
              className="inline-flex items-center gap-2 bg-white border-[1.5px] border-[#101418] px-2 sm:px-2.5 py-1 rounded-full shadow-xs hover:bg-[#E8EEFC] transition-colors cursor-pointer"
            >
              <div
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-[11px] flex-shrink-0"
                style={{
                  backgroundColor: currentPersona.avatarColor,
                  color: currentPersona.avatarTextColor || "#FFFFFF",
                }}
              >
                {currentPersona.initials}
              </div>
              <span className="font-sans font-semibold text-[11px] sm:text-xs text-[#101418]">
                {currentPersona.firstName}
              </span>
            </button>
          )}

          <SystemMonitor />

          <Link
            href="/"
            className="font-hand font-bold text-base sm:text-lg text-[#101418] hover:text-[#1E43D8] transition-colors -rotate-1 inline-flex items-center gap-1"
          >
            ← All modes
          </Link>
        </div>
      </header>

      {/* =========================================================================
          VIEW 1: 'gate' (WORKER SIGN-IN GATE)
      ========================================================================= */}
      {view === "gate" && (
        <div className="flex-1 overflow-y-auto px-4 py-12 flex flex-col items-center justify-center animate-slide-up">
          <div className="w-full max-w-[560px] mx-auto flex flex-col items-center space-y-7">
            
            {/* Eyebrow */}
            <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-[#5C6470] uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#1E43D8]" />
              <span>SHIFT SIGN-IN</span>
            </div>

            {/* Title & Sub */}
            <div className="text-center space-y-2.5">
              <h1 className="font-display font-bold text-[36px] sm:text-[44px] text-[#101418] tracking-tight leading-[1.08]">
                Who&apos;s on the floor today?
              </h1>
              <p className="font-sans text-[14px] text-[#3C4356] max-w-md mx-auto">
                Pick your name — your tickets, station and floor history load with you.
              </p>
            </div>

            {/* Custom Dropdown Field */}
            <div className="w-full relative space-y-4">
              <button
                ref={dropdownButtonRef}
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isDropdownOpen}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
                    e.preventDefault();
                    setIsDropdownOpen(true);
                  } else if (e.key === "Escape") {
                    setIsDropdownOpen(false);
                  }
                }}
                className="w-full h-14 bg-[#FFFBF0] border-2 border-[#101418] rounded-[12px] shadow-hard px-4 flex items-center justify-between text-left cursor-pointer hover:bg-white transition-colors"
              >
                <div className="flex items-center gap-3">
                  {selectedGateId ? (
                    (() => {
                      const sel = PERSONAS.find((p) => p.id === selectedGateId);
                      if (!sel) return <span className="text-[#5C6470]">Select worker</span>;
                      return (
                        <>
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs"
                            style={{
                              backgroundColor: sel.avatarColor,
                              color: sel.avatarTextColor || "#FFFFFF",
                            }}
                          >
                            {sel.initials}
                          </div>
                          <div>
                            <span className="font-sans font-semibold text-[15px] text-[#101418]">
                              {sel.name}
                            </span>
                            <span className="ml-2 font-mono text-[10px] text-[#5C6470] uppercase">
                              · {sel.role}
                            </span>
                          </div>
                        </>
                      );
                    })()
                  ) : (
                    <span className="font-sans text-[15px] text-[#5C6470]">Select worker</span>
                  )}
                </div>

                <div className={`transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}>
                  <svg className="w-4 h-4 text-[#101418]" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>

              {/* Dropdown Options List */}
              {isDropdownOpen && (
                <div
                  role="listbox"
                  className="w-full bg-[#FFFBF0] border-2 border-[#101418] rounded-[12px] shadow-hard overflow-hidden divide-y divide-[#101418]/10 z-40 relative animate-slide-up"
                >
                  {PERSONAS.map((p, idx) => {
                    const isSelected = selectedGateId === p.id;
                    const hasHigh = p.tickets.some((t) => t.status === "HIGH");
                    const openTickets = p.tickets.length;

                    return (
                      <div
                        key={p.id}
                        role="option"
                        aria-selected={isSelected}
                        tabIndex={0}
                        onClick={() => {
                          setSelectedGateId(p.id);
                          setIsDropdownOpen(false);
                          dropdownButtonRef.current?.focus();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedGateId(p.id);
                            setIsDropdownOpen(false);
                            dropdownButtonRef.current?.focus();
                          } else if (e.key === "Escape") {
                            setIsDropdownOpen(false);
                            dropdownButtonRef.current?.focus();
                          }
                        }}
                        style={{ animationDelay: `${idx * 40}ms` }}
                        className={`h-16 px-4 flex items-center justify-between cursor-pointer transition-colors relative outline-none ${
                          isSelected
                            ? "bg-[#E8EEFC] border-l-[3px] border-l-[#1E43D8]"
                            : "hover:bg-[#E8EEFC]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0"
                            style={{
                              backgroundColor: p.avatarColor,
                              color: p.avatarTextColor || "#FFFFFF",
                            }}
                          >
                            {p.initials}
                          </div>
                          <div>
                            <div className="font-sans font-semibold text-[15px] text-[#101418]">
                              {p.name}
                            </div>
                            <div className="font-mono text-[10px] text-[#5C6470] uppercase">
                              {p.role} · {p.shift}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10.5px] uppercase tracking-wider px-2 py-0.5 rounded bg-white border border-[#101418]/20 text-[#101418] flex items-center gap-1.5">
                            {hasHigh && <span className="w-2 h-2 rounded-full bg-[#D92D20] flex-shrink-0" />}
                            <span>{openTickets} OPEN</span>
                          </span>

                          {isSelected && (
                            <span className="text-[#1E43D8] font-bold text-sm ml-1">✓</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Clock-In Button */}
              <button
                type="button"
                disabled={!selectedGateId}
                onClick={handleClockIn}
                className={`w-full h-[52px] rounded-lg font-sans font-semibold text-[15px] flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  selectedGateId
                    ? "btn-royal"
                    : "bg-[#E8EEFC] text-[#101418]/40 border-2 border-[#101418]/25 cursor-not-allowed shadow-none"
                }`}
              >
                <span>Clock in</span>
                <span>→</span>
              </button>
            </div>

            {/* Caveat Footer */}
            <div className="font-hand text-base sm:text-[17px] text-[#5C6470] text-center pt-2">
              Demo sign-in — not a security login.
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: 'home' ("TODAY" WORKER HOME VIEW)
      ========================================================================= */}
      {view === "home" && (
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-8 sm:py-12 animate-slide-up">
          <div className="max-w-5xl mx-auto flex flex-col items-center space-y-8 sm:space-y-10">
            
            {/* 1. Worker Eyebrow (from currentPersona) */}
            <div className="flex items-center gap-2 font-mono text-[10px] sm:text-[11px] font-semibold text-[#5C6470] uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#1E43D8]" />
              <span>
                {currentPersona.name.toUpperCase()} · {currentPersona.role.toUpperCase()} · {currentPersona.shift.toUpperCase()}
              </span>
            </div>

            {/* 2 & 3. Heading & Subline */}
            <div className="text-center space-y-3 max-w-4xl w-full">
              <div className="flex items-center justify-center py-1 overflow-visible">
                <h1
                  aria-label="What are we fixing today?"
                  className="font-display font-bold text-[28px] sm:text-[38px] md:text-[46px] lg:text-[54px] text-[#101418] tracking-[-0.02em] leading-[1.15] text-center whitespace-nowrap"
                >
                  What are we{" "}
                  {prefersReducedMotion ? (
                    <span
                      aria-hidden="true"
                      className="inline-block relative px-[14px] rounded-[10px] border-2 border-[#101418] bg-[#1E43D8] text-white"
                      style={{ height: "1.22em", verticalAlign: "bottom" }}
                    >
                      <span className="inline-block" style={{ lineHeight: "1.22em" }}>
                        fixing
                      </span>
                    </span>
                  ) : (
                    <span
                      aria-hidden="true"
                      className="inline-block relative rounded-[10px] border-2 border-[#101418] transition-[width,background-color,color] duration-700 ease-in-out align-bottom"
                      style={{
                        height: "1.22em",
                        verticalAlign: "bottom",
                        width: pillWidth ? `${pillWidth}px` : "auto",
                        minWidth: "2em",
                        backgroundColor: ROTATING_WORDS[wordIndex].bg,
                        color: ROTATING_WORDS[wordIndex].color,
                      }}
                    >
                      {/* Hidden measuring spans */}
                      <span className="sr-only" aria-hidden="true">
                        {ROTATING_WORDS.map((w, i) => (
                          <span
                            key={`measure-${w.text}`}
                            ref={(el) => {
                              wordRefs.current[i] = el;
                            }}
                            className="font-display font-bold text-[28px] sm:text-[38px] md:text-[46px] lg:text-[54px] tracking-[-0.02em] whitespace-nowrap inline-block"
                          >
                            {w.text}
                          </span>
                        ))}
                      </span>

                      {/* Rotating Word Sliders */}
                      {ROTATING_WORDS.map((w, i) => {
                        const isCurrent = i === wordIndex;
                        const isNext = i === (wordIndex + 1) % ROTATING_WORDS.length;

                        let transform = "translate(-50%, -105%)";
                        let opacity = 0;

                        if (isCurrent) {
                          transform = "translate(-50%, 0)";
                          opacity = 1;
                        } else if (isNext) {
                          transform = "translate(-50%, 105%)";
                          opacity = 0;
                        }

                        return (
                          <span
                            key={w.text}
                            className="absolute left-1/2 whitespace-nowrap pointer-events-none select-none transition-transform duration-700 ease-in-out"
                            style={{
                              transform,
                              opacity,
                              transitionProperty: "transform, opacity",
                              transitionDuration: "0.7s, 0.25s",
                              transitionDelay: isCurrent ? "0s, 0.25s" : "0s, 0s",
                              lineHeight: "1.18em",
                              bottom: "0.02em",
                            }}
                          >
                            {w.text}
                          </span>
                        );
                      })}
                    </span>
                  )}{" "}
                  today?
                </h1>
              </div>
              <p className="font-sans text-[14px] text-[#3C4356]">
                {currentPersona.subline}
              </p>
            </div>

            {/* 4. Composer Card */}
            <div className="w-full max-w-3xl bg-[#FFFBF0] border-2 border-[#101418] rounded-[18px] p-4 sm:p-5 shadow-hard flex flex-col justify-between min-h-[130px] space-y-3">
              <textarea
                value={homeInput}
                onChange={(e) => setHomeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleLaunchFromHome(homeInput);
                  }
                }}
                placeholder="Ask Frontline anything — try 'when was the press oil last changed?'"
                rows={2}
                className="w-full bg-transparent resize-none outline-none font-sans text-[14px] sm:text-[15px] text-[#101418] placeholder:text-[#5C6470]/80 leading-relaxed"
              />

              <div className="flex items-center justify-between pt-2 border-t border-[#101418]/10">
                <button
                  type="button"
                  title="Attach file"
                  className="w-8 h-8 rounded-full bg-white border-[1.5px] border-[#101418] text-[#101418] flex items-center justify-center font-bold text-sm shadow-xs hover:bg-[#E8EEFC] transition-colors cursor-pointer"
                >
                  +
                </button>

                <button
                  type="button"
                  onClick={() => handleLaunchFromHome(homeInput)}
                  className="btn-royal inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-sans text-xs sm:text-[13px] font-semibold cursor-pointer select-none"
                >
                  <span>Ask</span>
                  <span>→</span>
                </button>
              </div>
            </div>

            {/* 5. Chips Row */}
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl pt-1">
              {suggestionChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleLaunchFromHome(chip)}
                  className="bg-white hover:bg-[#E8EEFC] active:bg-[#DCE7FB] text-[#101418] text-[12px] font-sans font-medium px-3.5 py-1.5 rounded-full border-[1.5px] border-[#101418] shadow-xs hover:-translate-y-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* 6. Tickets Section (staggered cards from persona) */}
            <div className="w-full space-y-4 pt-4 sm:pt-6">
              <div className="flex items-center justify-between border-b border-[#101418]/15 pb-2">
                <h2 className="font-display font-semibold text-[18px] text-[#101418]">
                  Your active tickets
                </h2>
                <div className="font-mono text-[11px] font-bold text-[#5C6470] tracking-wider uppercase">
                  {openCount} OPEN · {highCount} HIGH
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
                {currentPersona.tickets.map((t, index) => (
                  <div
                    key={t.code}
                    onClick={() => handleSelectTicket(t)}
                    style={{ animationDelay: `${index * 60}ms` }}
                    className="group bg-white border-2 border-[#101418] rounded-[16px] overflow-hidden shadow-hard hover:-translate-y-1 hover:shadow-[8px_8px_0_#101418] transition-all cursor-pointer flex flex-col justify-between animate-slide-up"
                  >
                    <div>
                      {/* Thumbnail: Solid pure white */}
                      <div className="relative h-36 bg-white border-b-[1.5px] border-[#101418] flex items-center justify-center p-4 overflow-hidden">
                        <div className="absolute top-2.5 right-2.5">
                          <StatusPill status={t.status} />
                        </div>
                        <TicketIcon icon={t.icon} />
                      </div>

                      {/* Title */}
                      <div className="p-4 space-y-1">
                        <h3 className="font-sans font-semibold text-[15px] text-[#101418] leading-snug group-hover:text-[#1E43D8] transition-colors">
                          {t.title}
                        </h3>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="px-4 pb-4 pt-1 flex items-start sm:items-center gap-1.5 font-mono text-[10px] text-[#5C6470] uppercase tracking-wider border-t border-[#101418]/10 mt-auto leading-tight">
                      <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 sm:mt-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span className="break-words">
                        {t.code} · {t.meta}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 3: 'chat' (FULL-SCREEN CHAT)
      ========================================================================= */}
      {view === "chat" && (
        <>
          <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-6">
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((msg, index) => {
                if (msg.type === "user") {
                  return (
                    <div key={index} className="flex justify-end animate-slide-up">
                      <div className="max-w-[85%] sm:max-w-[75%] bg-[#1E43D8] text-white px-4 py-2.5 rounded-[16px] rounded-br-[4px] font-sans text-[14px] leading-relaxed shadow-sm select-text">
                        {msg.text}
                      </div>
                    </div>
                  );
                }

                if (msg.type === "agent_text") {
                  return (
                    <div key={index} className="flex flex-col items-start space-y-1 animate-slide-up">
                      {msg.showLabel && (
                        <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-[#5C6470] uppercase tracking-wider ml-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1E43D8]" />
                          <span>FRONTLINE</span>
                        </div>
                      )}
                      <div className="max-w-[90%] sm:max-w-[80%] bg-[#FFFBF0] border-[1.5px] border-[#101418] text-[#101418] px-4 py-2.5 rounded-[16px] rounded-bl-[4px] font-sans text-[14px] leading-relaxed shadow-hard-xs select-text whitespace-pre-wrap">
                        {msg.text}
                      </div>
                    </div>
                  );
                }

                if (msg.type === "alert") {
                  return (
                    <div key={index} className="flex justify-start animate-slide-up">
                      <div className="inline-flex items-center gap-2 bg-[#FFF3C4] border-[1.5px] border-[#101418] text-[#101418] px-3.5 py-1.5 rounded-full font-sans text-[12.5px] leading-tight shadow-hard-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#101418] flex-shrink-0" />
                        <span>{msg.text}</span>
                      </div>
                    </div>
                  );
                }

                if (msg.type === "plan_card" || msg.type === "plan_turn") {
                  return (
                    <div key={index} className="flex justify-start">
                      <PlanTurn
                        title={msg.title}
                        checklist={msg.checklist}
                        badge={msg.badge || "W-3318 · HIGH"}
                        ackText={
                          msg.ackText !== undefined
                            ? msg.ackText
                            : msg.showPills !== false
                            ? `${currentPersona.firstName} acknowledged, ETA 10 min`
                            : undefined
                        }
                        outcomeText={
                          msg.outcomeText !== undefined
                            ? msg.outcomeText
                            : msg.showPills !== false
                            ? "✓ Fix saved to the knowledge base"
                            : undefined
                        }
                        showPills={msg.showPills !== false}
                      />
                    </div>
                  );
                }

                if (msg.type === "training_card") {
                  return (
                    <div key={index} className="flex justify-start">
                      <TrainingCard />
                    </div>
                  );
                }

                if (msg.type === "live_count_card") {
                  return (
                    <div key={index} className="flex flex-col items-start space-y-2">
                      <LiveCountCard />
                    </div>
                  );
                }

                if (msg.type === "history_card") {
                  return (
                    <div key={index} className="flex justify-start">
                      <HistoryCard />
                    </div>
                  );
                }

                if (msg.type === "status_pill") {
                  return (
                    <div key={index} className="flex justify-start animate-slide-up">
                      <div className="inline-flex items-center gap-2 bg-[#FFFBF0] border-[1.5px] border-[#101418] rounded-full px-3.5 py-1 text-[12px] font-sans text-[#101418] shadow-hard-xs">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: msg.dotColor || "#16A34A" }}
                        />
                        <span>{msg.text}</span>
                      </div>
                    </div>
                  );
                }

                if (msg.type === "outcome_pill") {
                  return (
                    <div key={index} className="flex justify-start animate-slide-up">
                      <div className="inline-flex items-center gap-1.5 bg-[#1E43D8] text-white rounded-full px-4 py-1.5 text-[12.5px] font-sans font-medium shadow-hard-xs">
                        <span>✓</span>
                        <span>{msg.text.replace("✓ ", "")}</span>
                      </div>
                    </div>
                  );
                }

                return null;
              })}

              {/* Inline Quick-Reply Chip for PO Approval */}
              {canApprovePo && !isTyping && (
                <div className="flex justify-start pl-2 animate-slide-up">
                  <button
                    type="button"
                    onClick={() => sendChatMessage("approve")}
                    className="bg-[#FFFBF0] hover:bg-[#E8EEFC] text-[#101418] text-[12px] font-sans font-semibold px-3.5 py-1 rounded-full border-[1.5px] border-[#101418] shadow-hard-xs active:translate-y-0.5 transition-all cursor-pointer"
                  >
                    approve
                  </button>
                </div>
              )}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex items-center gap-2 animate-slide-up">
                  <div className="bg-[#FFFBF0] border-[1.5px] border-[#101418] px-3.5 py-2 rounded-[16px] rounded-bl-[4px] shadow-hard-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#101418] animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 rounded-full bg-[#101418] animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 rounded-full bg-[#101418] animate-bounce" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Chat Composer */}
          <footer className="border-t-[1.5px] border-[#101418] bg-[#FFFBF0] p-3 sm:p-4 flex-shrink-0 z-20">
            <div className="max-w-3xl mx-auto space-y-2.5">
              <div
                className="flex items-center gap-2 overflow-x-auto pt-1.5 pb-1 px-1 no-scrollbar overflow-y-visible"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {suggestionChips.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => sendChatMessage(chip)}
                    className="whitespace-nowrap bg-white hover:bg-[#E8EEFC] active:bg-[#DCE7FB] text-[#101418] text-[12px] font-sans font-medium px-3 py-1 rounded-full border-[1.5px] border-[#101418] shadow-xs hover:-translate-y-0.5 active:translate-y-0.5 transition-all cursor-pointer flex-shrink-0"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendChatMessage(chatInput);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Text Frontline…"
                  className="flex-1 bg-white border-[1.5px] border-[#101418] rounded-full px-4 py-2 text-[14px] font-sans text-[#101418] placeholder:text-[#5C6470] outline-none focus:border-[#1E43D8] transition-colors shadow-xs"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isTyping}
                  className="w-9 h-9 rounded-full bg-[#1E43D8] text-white border-[1.5px] border-[#101418] shadow-btn hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center cursor-pointer flex-shrink-0"
                  aria-label="Send message"
                >
                  <svg className="w-4 h-4 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </form>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}
