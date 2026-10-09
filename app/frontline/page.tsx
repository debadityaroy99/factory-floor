"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";

// =========================================================================
// TYPES
// =========================================================================
type MessageType =
  | { type: "user"; text: string }
  | { type: "agent_text"; text: string; showLabel?: boolean }
  | { type: "alert"; text: string }
  | { type: "plan_card" }
  | { type: "training_card" }
  | { type: "live_count_card"; showApproveBtn?: boolean }
  | { type: "history_card" }
  | { type: "status_pill"; text: string; dotColor?: string }
  | { type: "outcome_pill"; text: string };

// =========================================================================
// SUB-COMPONENTS (FRAME CARDS)
// =========================================================================

// (a) PLAN Card
function PlanCard() {
  return (
    <div className="w-full max-w-[560px] bg-[#FFFBF0] border-2 border-[#101418] rounded-[14px] p-4 sm:p-5 shadow-hard space-y-3 animate-slide-up">
      <div className="flex items-center justify-between pb-2 border-b border-[#101418]/15">
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#101418]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1E43D8]" />
          <span>SIDEKICK&apos;S PLAN</span>
        </div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FDECEA] text-[#D92D20] border border-[#D92D20]/20">
          W-3318 · HIGH
        </span>
      </div>

      <div className="space-y-2">
        {[
          "Flag the drift: Press 3 · Line 2",
          "Create work order W-3318",
          "Text Marcus the fix history",
          "Save the fix to knowledge",
        ].map((task, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className="w-4 h-4 rounded-[4px] bg-[#1E43D8] flex items-center justify-center text-white flex-shrink-0 shadow-xs">
              <svg className="w-2.5 h-2.5 stroke-[2.5]" viewBox="0 0 12 12" fill="none" stroke="currentColor">
                <path d="M2.5 6.5L4.5 8.5L9.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-[13.5px] font-sans text-[#101418] leading-tight">
              {task}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

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
function LiveCountCard({ onApprove, showApproveBtn }: { onApprove?: () => void; showApproveBtn?: boolean }) {
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
      {/* Top Answer Block */}
      <div className="bg-[#FFF3C4] border-[1.5px] border-[#101418] rounded-[10px] p-3 space-y-1 shadow-xs">
        <p className="font-sans text-[13px] text-[#101418] leading-relaxed">
          ISO 46 change on Apr 02 by Devin. Next due at 1,500 hrs. Cage D has 2 in stock.
        </p>
        <div className="font-mono text-[10px] text-[#5C6470] tracking-wider uppercase font-semibold">
          CITES SOP-HYD-11 · APR 02 · VERIFIED
        </div>
      </div>

      {/* Entries List */}
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

      {/* Footer row */}
      <div className="flex items-center gap-1.5 pt-0.5 text-[12px] font-sans">
        <span className="w-1.5 h-1.5 rounded-full bg-[#1E43D8] flex-shrink-0" />
        <span className="text-[#5C6470]">+12 entries captured this week.</span>
        <span className="font-bold text-[#101418]">Nothing walks out the door</span>
      </div>
    </div>
  );
}

// =========================================================================
// MAIN FULL-SCREEN CHAT INTERFACE
// =========================================================================
export default function FrontlineChatPage() {
  const [messages, setMessages] = useState<MessageType[]>([
    {
      type: "agent_text",
      text: "Morning. I'm watching Press 3, the CNC bay and Tool Crib B. Ask me anything the floor has ever fixed — or I'll flag what drifts.",
      showLabel: true,
    },
    {
      type: "alert",
      text: "Hydraulic temp 13° over spec — nobody has reported it",
    },
    {
      type: "plan_card",
    },
    {
      type: "status_pill",
      text: "Marcus acknowledged, ETA 10 min",
      dotColor: "#16A34A",
    },
    {
      type: "outcome_pill",
      text: "✓ Fix saved to the knowledge base",
    },
  ]);

  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [canApprovePo, setCanApprovePo] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom("smooth");
  }, [messages, isTyping]);

  const handleSend = (textToSend?: string) => {
    const raw = (textToSend ?? inputValue).trim();
    if (!raw || isTyping) return;

    const userQuery = raw.toLowerCase();
    setInputValue("");

    // 1. Append user message
    setMessages((prev) => [...prev, { type: "user", text: raw }]);
    setIsTyping(true);

    // 2. Scripted response delay ~900ms
    setTimeout(() => {
      setIsTyping(false);

      if (userQuery.includes("approve")) {
        setCanApprovePo(false);
        setMessages((prev) => [
          ...prev,
          {
            type: "outcome_pill",
            text: "✓ PO-1042 sent, arrives Thursday",
          },
        ]);
      } else if (userQuery.includes("oil") || userQuery.includes("press")) {
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
      } else if (
        userQuery.includes("drift") ||
        userQuery.includes("equipment") ||
        userQuery.includes("temp") ||
        userQuery.includes("down")
      ) {
        setMessages((prev) => [
          ...prev,
          {
            type: "alert",
            text: "Two things nobody has reported yet.",
          },
          {
            type: "plan_card",
          },
          {
            type: "outcome_pill",
            text: "✓ Fix saved to the knowledge base",
          },
        ]);
      } else if (
        userQuery.includes("priya") ||
        userQuery.includes("training") ||
        userQuery.includes("cert") ||
        userQuery.includes("chemical")
      ) {
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
      } else if (
        userQuery.includes("stock") ||
        userQuery.includes("cnmg") ||
        userQuery.includes("insert") ||
        userQuery.includes("inventory") ||
        userQuery.includes("order")
      ) {
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
            text: 'I can pull the floor\'s history ("when was the press oil last changed?"), flag drifting equipment, check training certs, or watch stock levels. Try one of the suggestions below.',
            showLabel: true,
          },
        ]);
      }
    }, 900);
  };

  const suggestionChips = [
    "When was the press oil last changed?",
    "Any equipment drifting?",
    "Priya's training status",
    "Stock check: CNMG inserts",
  ];

  return (
    <div className="h-[100dvh] flex flex-col bg-[#F6EFDB] bg-drafting-grid text-[#101418] font-sans overflow-hidden select-none">
      {/* =========================================================================
          HEADER BAR
      ========================================================================= */}
      <header className="h-14 sm:h-16 border-b-[1.5px] border-[#101418] bg-[#FFFBF0] px-4 sm:px-8 flex items-center justify-between flex-shrink-0 z-20">
        {/* Left: Manufy wordmark + blue square logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-5 h-5 bg-[#1E43D8] rounded-[2px] flex items-center justify-center text-white font-bold text-xs shadow-sm">
            M
          </div>
          <span className="font-display font-bold text-lg sm:text-xl tracking-tight text-[#101418]">
            Manufy
          </span>
        </Link>

        {/* Center: Label in IBM Plex Mono uppercase */}
        <div className="font-mono text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#101418] px-2 py-0.5 rounded border border-[#101418]/20 bg-[#FBF6E9]">
          FRONTLINE MODE
        </div>

        {/* Right side: Butter pill + "← All modes" link */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden sm:inline-flex items-center gap-1.5 bg-[#FFF3C4] border border-[#101418]/25 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider text-[#101418]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
            <span>LIVE ON THE FLOOR</span>
          </div>
          <Link
            href="/"
            className="font-hand font-bold text-base sm:text-lg text-[#101418] hover:text-[#1E43D8] transition-colors -rotate-1 inline-flex items-center gap-1"
          >
            ← All modes
          </Link>
        </div>
      </header>

      {/* =========================================================================
          THREAD (MESSAGES)
      ========================================================================= */}
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
                  <div className="max-w-[90%] sm:max-w-[80%] bg-[#FFFBF0] border-[1.5px] border-[#101418] text-[#101418] px-4 py-2.5 rounded-[16px] rounded-bl-[4px] font-sans text-[14px] leading-relaxed shadow-hard-xs select-text">
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

            if (msg.type === "plan_card") {
              return (
                <div key={index} className="flex justify-start">
                  <PlanCard />
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

          {/* Inline Quick-Reply Chip for PO Approval when applicable */}
          {canApprovePo && !isTyping && (
            <div className="flex justify-start pl-2 animate-slide-up">
              <button
                type="button"
                onClick={() => handleSend("approve")}
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

      {/* =========================================================================
          COMPOSER (BOTTOM INPUT BAR)
      ========================================================================= */}
      <footer className="border-t-[1.5px] border-[#101418] bg-[#FFFBF0] p-3 sm:p-4 flex-shrink-0 z-20">
        <div className="max-w-3xl mx-auto space-y-2.5">
          {/* Row of 4 Suggestion Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {suggestionChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(chip)}
                className="whitespace-nowrap bg-white hover:bg-[#E8EEFC] active:bg-[#DCE7FB] text-[#101418] text-[12px] font-sans font-medium px-3 py-1 rounded-full border-[1.5px] border-[#101418] shadow-xs hover:-translate-y-0.5 active:translate-y-0.5 transition-all cursor-pointer flex-shrink-0"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Row */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Text Frontline…"
              className="flex-1 bg-white border-[1.5px] border-[#101418] rounded-full px-4 py-2 text-[14px] font-sans text-[#101418] placeholder:text-[#5C6470] outline-none focus:border-[#1E43D8] transition-colors shadow-xs"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
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
    </div>
  );
}
