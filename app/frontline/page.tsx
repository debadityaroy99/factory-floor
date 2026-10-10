"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  DocumentCitation,
  EquipmentAnomaly,
  EquipmentItem,
  EquipmentKpiSummary,
  FloorHistoryRecord,
  OperatorTrainingRecord,
  TelemetryPoint,
  ToolCribInventoryItem,
  TribalKnowledgeRecord,
  UserRole,
  WorkOrder,
  WorkOrderStatus,
} from "@/lib/types";

// =========================================================================
// MESSAGE TYPES
// =========================================================================
type MessageType =
  | { type: "user"; text: string }
  | { type: "agent_text"; text: string; showLabel?: boolean }
  | { type: "alert"; text: string }
  | { type: "plan_card" }
  | { type: "training_card"; data?: OperatorTrainingRecord }
  | { type: "live_count_card"; data?: ToolCribInventoryItem; showApproveBtn?: boolean }
  | { type: "history_card"; data?: { highlightAnswer: string; sopCitation: string; entries: FloorHistoryRecord[] } }
  | { type: "status_pill"; text: string; dotColor?: string }
  | { type: "outcome_pill"; text: string }
  | { type: "citations_card"; citations: DocumentCitation[] }
  | { type: "anomaly_card"; anomaly: EquipmentAnomaly; equipmentName: string }
  | { type: "work_order_card"; workOrder: WorkOrder }
  | { type: "safety_card"; notice: string; citation?: string }
  | { type: "knowledge_card"; record: TribalKnowledgeRecord };

// =========================================================================
// SUB-COMPONENTS (FRAME CARDS)
// =========================================================================

function CitationsCard({ citations }: { citations: DocumentCitation[] }) {
  if (!citations || citations.length === 0) return null;
  return (
    <div className="w-full max-w-[560px] bg-[#FFFBF0] border-2 border-[#101418] rounded-[14px] p-4 sm:p-5 shadow-hard space-y-3 animate-slide-up">
      <div className="flex items-center justify-between pb-2 border-b border-[#101418]/15">
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#101418]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1E43D8]" />
          <span>VERIFIED COMPANY DOCUMENT CITATIONS</span>
        </div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#E8EEFC] text-[#1E43D8] border border-[#1E43D8]/20">
          GROUNDED RAG
        </span>
      </div>
      <div className="space-y-2">
        {citations.map((c, i) => (
          <div key={i} className="bg-white border border-[#101418]/15 rounded-lg p-2.5 text-[12.5px] space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-[#1E43D8]">{c.section}</span>
              <span className="font-mono text-[10px] text-[#5C6470] bg-[#F6EFDB] px-1.5 py-0.5 rounded">
                Score: {c.relevanceScore}
              </span>
            </div>
            <div className="font-sans font-semibold text-[#101418]">{c.docTitle}</div>
            <p className="font-sans text-[12px] text-[#5C6470] leading-snug">{c.snippet}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnomalyCard({
  anomaly,
  equipmentName,
  onCreateWorkOrder,
}: {
  anomaly: EquipmentAnomaly;
  equipmentName: string;
  onCreateWorkOrder?: () => void;
}) {
  return (
    <div className="w-full max-w-[560px] bg-[#FFFBF0] border-2 border-[#101418] rounded-[14px] p-4 sm:p-5 shadow-hard space-y-3 animate-slide-up">
      <div className="flex items-center justify-between pb-2 border-b border-[#101418]/15">
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#101418]">
          <span className="w-2 h-2 rounded-full bg-[#FF6B2C] animate-pulse" />
          <span>MEASURED TELEMETRY ANOMALY</span>
        </div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FDECEA] text-[#D92D20] border border-[#D92D20]/20">
          {anomaly.severity} · Z={anomaly.zScore}σ
        </span>
      </div>
      <div className="space-y-1.5 text-[12.5px] font-sans">
        <div className="font-medium text-[#101418]">{equipmentName} ({anomaly.equipmentId})</div>
        <div className="text-[#5C6470]">{anomaly.description}</div>
        <div className="bg-[#FFF3C4] border border-[#101418]/20 rounded p-2 font-mono text-[11px] text-[#101418]">
          {anomaly.evidenceCalculation}
        </div>
        <div className="text-[11.5px] text-[#101418] pt-1">
          <span className="font-semibold text-[#1E43D8]">Preventive Recommendation: </span>
          {anomaly.preventiveRecommendation}
        </div>
      </div>
      {onCreateWorkOrder && (
        <button
          type="button"
          onClick={onCreateWorkOrder}
          className="w-full bg-[#1E43D8] hover:bg-[#1534AA] text-white text-[12px] font-mono font-bold uppercase tracking-wider py-2 rounded-lg border-[1.5px] border-[#101418] shadow-xs cursor-pointer transition-all"
        >
          Dispatch Work Order for {anomaly.equipmentId}
        </button>
      )}
    </div>
  );
}

function WorkOrderCard({ workOrder }: { workOrder: WorkOrder }) {
  return (
    <div className="w-full max-w-[560px] bg-[#FFFBF0] border-2 border-[#101418] rounded-[14px] p-4 sm:p-5 shadow-hard space-y-3 animate-slide-up">
      <div className="flex items-center justify-between pb-2 border-b border-[#101418]/15">
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#101418]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
          <span>WORK ORDER #{workOrder.id}</span>
        </div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FFFBF0] text-[#101418] border border-[#101418]/30">
          {workOrder.status} · {workOrder.priority}
        </span>
      </div>
      <div className="space-y-1.5 text-[12.5px] font-sans">
        <div className="font-semibold text-[#101418]">{workOrder.title}</div>
        <div className="text-[#5C6470]">{workOrder.description}</div>
        <div className="grid grid-cols-2 gap-2 pt-1 text-[11.5px]">
          <div>
            <span className="text-[#5C6470]">Asset: </span>
            <span className="font-medium text-[#101418]">{workOrder.equipmentName}</span>
          </div>
          <div>
            <span className="text-[#5C6470]">Team: </span>
            <span className="font-medium text-[#101418]">{workOrder.assignedTeam}</span>
          </div>
          <div>
            <span className="text-[#5C6470]">Technician: </span>
            <span className="font-medium text-[#101418]">{workOrder.assignedTechnician || "Unassigned"}</span>
          </div>
          <div>
            <span className="text-[#5C6470]">CMMS Ref: </span>
            <span className="font-mono text-[#1E43D8]">{workOrder.cmmsReferenceId || "Internal Queue"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SafetyCard({ notice, citation }: { notice: string; citation?: string }) {
  return (
    <div className="w-full max-w-[560px] bg-[#FDECEA] border-2 border-[#D92D20] rounded-[14px] p-4 sm:p-5 shadow-hard space-y-2.5 animate-slide-up">
      <div className="flex items-center gap-2 text-[#D92D20] font-mono font-bold text-[11px] tracking-wider uppercase">
        <span className="w-2.5 h-2.5 rounded-full bg-[#D92D20] animate-ping" />
        <span>EMERGENCY LIFE-SAFETY PROTOCOL</span>
      </div>
      <p className="font-sans font-semibold text-[13.5px] text-[#101418] leading-snug">
        {notice}
      </p>
      {citation && (
        <div className="font-mono text-[10.5px] text-[#D92D20] font-bold">
          GOVERNING PROCEDURE: {citation}
        </div>
      )}
    </div>
  );
}

function KnowledgeCard({ record }: { record: TribalKnowledgeRecord }) {
  return (
    <div className="w-full max-w-[560px] bg-[#FFFBF0] border-2 border-[#101418] rounded-[14px] p-4 sm:p-5 shadow-hard space-y-3 animate-slide-up">
      <div className="flex items-center justify-between pb-2 border-b border-[#101418]/15">
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#101418]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
          <span>TRIBAL KNOWLEDGE REPOSITORY</span>
        </div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#DCFCE7] text-[#16A34A] border border-[#16A34A]/25">
          ✓ TECHNICIAN CONFIRMED
        </span>
      </div>
      <div className="space-y-1.5 text-[12.5px] font-sans">
        <div className="font-bold text-[#101418]">{record.title}</div>
        <div className="text-[12px] text-[#5C6470]">
          Asset: <span className="text-[#101418] font-medium">{record.equipmentName}</span> · Author: <span className="text-[#101418] font-medium">{record.authorName}</span> ({record.authorRole})
        </div>
        <div className="bg-white border border-[#101418]/15 rounded p-2 text-[12px] space-y-1">
          <div><strong className="text-[#1E43D8]">Actual Root Cause:</strong> {record.actualRootCause}</div>
          <div><strong className="text-[#16A34A]">Repair Performed:</strong> {record.repairPerformed}</div>
          <div><strong className="text-[#5C6470]">Downtime:</strong> {record.downtimeMinutes} min · <strong className="text-[#5C6470]">Parts:</strong> {record.partsUsed.join(", ")}</div>
        </div>
      </div>
    </div>
  );
}

// Existing Legacy Cards
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
          "Flag the drift: Press 3 · Line A",
          "Create work order W-3318",
          "Escalate to Marcus V. with Z-score evidence",
          "Save the fix to tribal knowledge",
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

function TrainingCard({ data }: { data?: OperatorTrainingRecord }) {
  const record = data || {
    name: "Priya S.",
    role: "CNC operator · station 4",
    shift: "Monday · second shift",
    certifications: [
      { name: "Forklift basics", certified: true },
      { name: "Lockout/tagout", certified: true },
      { name: "Chemical handling", certified: false },
    ],
  };

  return (
    <div className="w-full max-w-[560px] bg-[#FFFBF0] border-2 border-[#101418] rounded-[14px] p-4 sm:p-5 shadow-hard space-y-3 animate-slide-up">
      <div className="flex items-center justify-between pb-2 border-b border-[#101418]/15">
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#101418]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1E43D8]" />
          <span>TRAINING RECORD</span>
        </div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FFFBF0] text-[#101418] border-[1.5px] border-[#101418]">
          {record.name.toUpperCase()}
        </span>
      </div>
      <div className="divide-y divide-[#101418]/10 text-[12.5px] font-sans">
        <div className="flex items-center justify-between py-1.5">
          <span className="text-[#5C6470]">Role</span>
          <span className="text-[#101418] font-medium">{record.role}</span>
        </div>
        <div className="flex items-center justify-between py-1.5">
          <span className="text-[#5C6470]">Shift</span>
          <span className="text-[#101418] font-medium">{record.shift}</span>
        </div>
        {record.certifications.map((cert, idx) => (
          <div key={idx} className="flex items-center justify-between py-1.5">
            <span className="text-[#5C6470]">{cert.name}</span>
            {cert.certified ? (
              <span className="text-[#12805C] font-semibold">✓ certified</span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-[#FFF3C4] text-[#8A6D00] font-mono font-bold text-[10px] border border-[#8A6D00]/20">
                MISSING
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveCountCard({ data }: { data?: ToolCribInventoryItem }) {
  const item = data || {
    item: "CNMG 432 inserts",
    supplier: "MSC Industrial · net-30",
    location: "TOOL CRIB B",
    reorderPoint: 12,
    onHand: 3,
  };

  const isLow = item.onHand <= item.reorderPoint;
  const underAmount = item.reorderPoint - item.onHand;

  return (
    <div className="w-full max-w-[560px] bg-[#FFFBF0] border-2 border-[#101418] rounded-[14px] p-4 sm:p-5 shadow-hard space-y-3 animate-slide-up">
      <div className="flex items-center justify-between pb-2 border-b border-[#101418]/15">
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#101418]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1E43D8]" />
          <span>LIVE INVENTORY COUNT</span>
        </div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FFFBF0] text-[#101418] border border-[#101418]/25">
          {item.location}
        </span>
      </div>
      <div className="space-y-1.5 text-[12.5px] font-sans">
        <div className="flex items-center justify-between py-0.5">
          <span className="text-[#5C6470]">Item</span>
          <span className="text-[#101418] font-medium">{item.item}</span>
        </div>
        <div className="flex items-center justify-between py-0.5">
          <span className="text-[#5C6470]">Supplier</span>
          <span className="text-[#101418] font-medium">{item.supplier}</span>
        </div>
        <div className="flex items-center justify-between py-0.5">
          <span className="text-[#5C6470]">Reorder point</span>
          <span className="text-[#101418] font-medium">{item.reorderPoint} on hand</span>
        </div>
        <div className="pt-1.5">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-[#5C6470]">On hand</span>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-xl font-display font-bold leading-none ${isLow ? "text-[#D92D20]" : "text-[#12805C]"}`}>
                {item.onHand}
              </span>
              {isLow && (
                <span className="text-[11px] font-mono font-bold text-[#D92D20]">
                  {underAmount} under
                </span>
              )}
            </div>
          </div>
          <div className="w-full h-1.5 bg-[#EFE9DC] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${isLow ? "bg-[#D92D20]" : "bg-[#12805C]"}`}
              style={{ width: `${Math.min(100, (item.onHand / item.reorderPoint) * 50)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function HistoryCard({ data }: { data?: { highlightAnswer: string; sopCitation: string; entries: FloorHistoryRecord[] } }) {
  const entries = data?.entries || [
    { title: "Conveyor 3 bearing failure", sub: "Replace 6205-2RS · resolved by Mike T.", date: "Today" },
    { title: "CNC-3 coolant PSI drop", sub: "Check pump seal · cited SOP-CNC-07 p3", date: "Apr 14" },
    { title: "Forklift battery rotation", sub: "Bank A → C every Tues · per Mike", date: "Apr 11" },
    { title: "Allen-Bradley fault E-04", sub: "Reset sequence + photo · per Devin", date: "Apr 06" },
    { title: "Hydraulic press oil change", sub: "ISO 46 · every 500 hrs · Cage D", date: "Apr 02", highlight: true },
  ];

  return (
    <div className="w-full max-w-[560px] bg-[#FFFBF0] border-2 border-[#101418] rounded-[14px] p-4 sm:p-5 shadow-hard space-y-3.5 animate-slide-up">
      <div className="bg-[#FFF3C4] border-[1.5px] border-[#101418] rounded-[10px] p-3 space-y-1 shadow-xs">
        <p className="font-sans text-[13px] text-[#101418] leading-relaxed">
          {data?.highlightAnswer || "ISO 46 change on Apr 02 by Devin. Next due at 1,500 hrs. Cage D has 2 in stock."}
        </p>
        <div className="font-mono text-[10px] text-[#5C6470] tracking-wider uppercase font-semibold">
          {data?.sopCitation || "CITES SOP-HYD-11 · APR 02 · VERIFIED"}
        </div>
      </div>
      <div className="bg-white border border-[#101418]/15 rounded-xl overflow-hidden divide-y divide-[#101418]/10 shadow-xs">
        {entries.map((entry, idx) => (
          <div
            key={idx}
            className={`px-3.5 py-2.5 flex items-center justify-between transition-colors ${
              entry.highlight ? "bg-[#FFF3C4]" : "hover:bg-[#E8EEFC]"
            }`}
          >
            <div className="space-y-0.5">
              <div className="font-sans font-medium text-[13.5px] text-[#101418]">{entry.title}</div>
              <div className="font-sans text-[12px] text-[#5C6470]">{entry.sub}</div>
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
// MAIN FULL-SCREEN OPERATIONS INTERFACE
// =========================================================================
type ActiveTab = "CHAT" | "EQUIPMENT" | "WORK_ORDERS" | "KNOWLEDGE" | "ANALYTICS";

export default function FrontlineChatPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("CHAT");
  const [userRole, setUserRole] = useState<UserRole>("OPERATOR");

  // Chat State
  const [messages, setMessages] = useState<MessageType[]>([
    {
      type: "agent_text",
      text: "Frontline Operations Co-Pilot online. Monitoring Press 3, CNC 4, Conveyor 2, and Tool Crib B. I can diagnose sensor drift against baselines, cite company SOPs, route internal work orders, or escalate safety alerts.",
      showLabel: true,
    },
    {
      type: "alert",
      text: "PRESS-03 thermal drift (+18.4°C / Z=2.36σ) — approaching 75°C shutdown threshold.",
    },
    {
      type: "citations_card",
      citations: [
        {
          docNumber: "SOP-HYD-11",
          docTitle: "Hydraulic Stamping Unit Thermal Drift & PM Guide",
          section: "SOP-HYD-11 §3.2",
          relevanceScore: 0.95,
          snippet: "When upward thermal drift is observed: verify cooling water flow rate >= 15 GPM and differential pressure > 1.2 bar. Inspect proportional relief valve pilot orifice.",
        },
      ],
    },
    {
      type: "plan_card",
    },
    {
      type: "status_pill",
      text: "Marcus V. acknowledged escalation, ETA 10 min",
      dotColor: "#16A34A",
    },
    {
      type: "outcome_pill",
      text: "✓ Work order wo-101 assigned to Devin K.",
    },
  ]);

  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [canApprovePo, setCanApprovePo] = useState(false);

  // Equipment Tab State
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>([]);

  // Work Orders Tab State
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [woFilter, setWoFilter] = useState<string>("ALL");

  // Knowledge Tab State
  const [knowledgeRecords, setKnowledgeRecords] = useState<TribalKnowledgeRecord[]>([]);
  const [kbSearchQuery, setKbSearchQuery] = useState<string>("");

  // Analytics Tab State
  const [analyticsOverview, setAnalyticsOverview] = useState<{
    plantAvailability: number;
    totalDowntimeHours24h: number;
    activeAnomaliesCount: number;
    isDemoData: boolean;
    equipmentSummaries: EquipmentKpiSummary[];
  } | null>(null);
  const [telemetrySeries, setTelemetrySeries] = useState<TelemetryPoint[]>([]);

  const fetchEquipment = async () => {
    try {
      const res = await fetch("/api/frontline/equipment");
      if (res.ok) {
        const data = await res.json();
        if (data.equipment) setEquipmentList(data.equipment);
      }
    } catch (e) {
      console.warn("Failed to load equipment:", e);
    }
  };

  const fetchWorkOrders = async () => {
    try {
      const res = await fetch("/api/frontline/work-orders");
      if (res.ok) {
        const data = await res.json();
        if (data.workOrders) setWorkOrders(data.workOrders);
      }
    } catch (e) {
      console.warn("Failed to load work orders:", e);
    }
  };

  const fetchKnowledge = async (query = "") => {
    try {
      const url = query ? `/api/frontline/knowledge?query=${encodeURIComponent(query)}` : "/api/frontline/knowledge";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.knowledge) setKnowledgeRecords(data.knowledge);
      }
    } catch (e) {
      console.warn("Failed to load knowledge:", e);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/frontline/analytics");
      if (res.ok) {
        const data = await res.json();
        setAnalyticsOverview(data);
      }
      const telRes = await fetch("/api/frontline/analytics?equipmentId=PRESS-03&metric=Hydraulic%20Oil%20Temp");
      if (telRes.ok) {
        const telData = await telRes.json();
        if (telData.telemetry) setTelemetrySeries(telData.telemetry);
      }
    } catch (e) {
      console.warn("Failed to load analytics:", e);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (activeTab === "CHAT") {
      scrollToBottom("smooth");
    }
  }, [messages, isTyping, activeTab]);

  // Load live data from API routes
  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      try {
        const [eqRes, woRes, kbRes, anRes] = await Promise.all([
          fetch("/api/frontline/equipment").then((r) => r.json()).catch(() => ({})),
          fetch("/api/frontline/work-orders").then((r) => r.json()).catch(() => ({})),
          fetch("/api/frontline/knowledge").then((r) => r.json()).catch(() => ({})),
          fetch("/api/frontline/analytics").then((r) => r.json()).catch(() => ({})),
        ]);
        if (!isMounted) return;
        if (eqRes.equipment) setEquipmentList(eqRes.equipment);
        if (woRes.workOrders) setWorkOrders(woRes.workOrders);
        if (kbRes.knowledge) setKnowledgeRecords(kbRes.knowledge);
        if (anRes) setAnalyticsOverview(anRes);
      } catch (err) {
        console.warn("Initial data load error:", err);
      }
    };
    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSend = (textToSend?: string) => {
    const raw = (textToSend ?? inputValue).trim();
    if (!raw || isTyping) return;

    setInputValue("");
    setMessages((prev) => [...prev, { type: "user", text: raw }]);
    setIsTyping(true);

    (async () => {
      try {
        const res = await fetch("/api/frontline/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: raw, role: userRole }),
        });

        if (res.ok) {
          const data = await res.json();
          setIsTyping(false);

          if (data.canApprovePo !== undefined) setCanApprovePo(data.canApprovePo);

          const newMsgs: MessageType[] = [];

          if (data.safetyNotice) {
            newMsgs.push({
              type: "safety_card",
              notice: data.safetyNotice,
              citation: data.citations?.[0]?.section,
            });
          }

          if (data.alertText) {
            newMsgs.push({ type: "alert", text: data.alertText });
          }

          if (data.replyText) {
            newMsgs.push({
              type: "agent_text",
              text: data.replyText,
              showLabel: data.showLabel ?? true,
            });
          }

          if (data.citations && data.citations.length > 0) {
            newMsgs.push({ type: "citations_card", citations: data.citations });
          }

          if (data.workOrderData) {
            newMsgs.push({ type: "work_order_card", workOrder: data.workOrderData });
            fetchWorkOrders(); // Refresh table
          }

          if (data.knowledgeData) {
            newMsgs.push({ type: "knowledge_card", record: data.knowledgeData });
          }

          if (data.trainingData) {
            newMsgs.push({ type: "training_card", data: data.trainingData });
          }

          if (data.inventoryData) {
            newMsgs.push({ type: "live_count_card", data: data.inventoryData, showApproveBtn: data.canApprovePo });
          }

          if (data.historyData) {
            newMsgs.push({ type: "history_card", data: data.historyData });
          }

          if (data.outcomePill) {
            newMsgs.push({ type: "outcome_pill", text: data.outcomePill });
          }

          setMessages((prev) => [...prev, ...newMsgs]);
          return;
        }
      } catch (err) {
        console.warn("Frontline API call error:", err);
      }

      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          type: "agent_text",
          text: "Frontline operations active. Telemetry baseline and SOP citations available.",
          showLabel: true,
        },
      ]);
    })();
  };

  const updateOrderStatus = async (id: string, newStatus: WorkOrderStatus) => {
    try {
      const res = await fetch("/api/frontline/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          id,
          status: newStatus,
          actor: `${userRole === "SUPERVISOR" ? "Supervisor Marcus V." : "Technician Devin K."}`,
          note: `Manual status transition to ${newStatus} in Frontline UI`,
        }),
      });
      if (res.ok) {
        fetchWorkOrders();
      }
    } catch (e) {
      console.error("Failed to update status:", e);
    }
  };

  const approveKnowledge = async (id: string) => {
    try {
      const res = await fetch("/api/frontline/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          id,
          approvedBy: "Supervisor Marcus V.",
        }),
      });
      if (res.ok) {
        fetchKnowledge(kbSearchQuery);
      }
    } catch (e) {
      console.error("Failed to approve knowledge:", e);
    }
  };

  const suggestionChips = [
    "When was the press oil last changed?",
    "Any equipment drifting?",
    "Why is CNC-04 coolant dropping?",
    "Create work order for Press 3",
    "Emergency E-Stop protocol",
    "Priya's training status",
    "Stock check: CNMG inserts",
  ];

  return (
    <div className="h-[100dvh] flex flex-col bg-[#F6EFDB] bg-drafting-grid text-[#101418] font-sans overflow-hidden select-none">
      {/* =========================================================================
          HEADER BAR
      ========================================================================= */}
      <header className="h-14 sm:h-16 border-b-[1.5px] border-[#101418] bg-[#FFFBF0] px-3 sm:px-6 flex items-center justify-between flex-shrink-0 z-20 shadow-xs">
        {/* Left: Manufy logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-6 h-6 bg-[#1E43D8] rounded-[3px] flex items-center justify-center text-white font-bold text-xs shadow-sm">
              M
            </div>
            <span className="font-display font-bold text-lg sm:text-xl tracking-tight text-[#101418]">
              Manufy
            </span>
          </Link>
          <div className="hidden sm:inline-block font-mono text-[11px] font-bold uppercase tracking-wider text-[#101418] px-2 py-0.5 rounded border border-[#101418]/20 bg-[#FBF6E9]">
            FRONTLINE MODE
          </div>
        </div>

        {/* Center: Role Switcher */}
        <div className="flex items-center gap-1 bg-[#F6EFDB] p-1 rounded-lg border border-[#101418]/20">
          <span className="text-[10px] font-mono font-bold text-[#5C6470] uppercase px-1 hidden md:inline">
            ROLE:
          </span>
          {(["OPERATOR", "TECHNICIAN", "SUPERVISOR"] as UserRole[]).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setUserRole(role)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold tracking-wider cursor-pointer transition-colors ${
                userRole === role
                  ? "bg-[#1E43D8] text-white shadow-xs"
                  : "text-[#101418] hover:bg-[#E8EEFC]"
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        {/* Right side: Live badge + All modes link */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden lg:inline-flex items-center gap-1.5 bg-[#FFF3C4] border border-[#101418]/25 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider text-[#101418]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
            <span>LIVE ON FLOOR</span>
          </div>
          <Link
            href="/"
            className="font-hand font-bold text-sm sm:text-base text-[#101418] hover:text-[#1E43D8] transition-colors -rotate-1 inline-flex items-center gap-1"
          >
            ← All modes
          </Link>
        </div>
      </header>

      {/* =========================================================================
          NAVIGATION TABS (INDUSTRIAL OPS WORKSPACE)
      ========================================================================= */}
      <nav className="h-10 bg-[#FFFBF0] border-b-[1.5px] border-[#101418] px-3 sm:px-6 flex items-center gap-1 overflow-x-auto no-scrollbar flex-shrink-0 z-10">
        {[
          { id: "CHAT", label: "Sidekick Chat" },
          { id: "EQUIPMENT", label: `Equipment & Drift (${equipmentList.length || 5})` },
          { id: "WORK_ORDERS", label: `Work Orders (${workOrders.length || 3})` },
          { id: "KNOWLEDGE", label: `Tribal Knowledge (${knowledgeRecords.length || 2})` },
          { id: "ANALYTICS", label: "Plant Analytics (BigQuery)" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as ActiveTab)}
            className={`px-3 py-1 text-[12px] font-mono font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-[#101418] text-white shadow-xs"
                : "text-[#5C6470] hover:text-[#101418] hover:bg-[#E8EEFC]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* =========================================================================
          TAB 1: CHAT INTERFACE
      ========================================================================= */}
      {activeTab === "CHAT" && (
        <div className="flex-1 flex flex-col overflow-hidden">
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
                          <span>FRONTLINE CO-PILOT</span>
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

                if (msg.type === "citations_card") {
                  return (
                    <div key={index} className="flex justify-start">
                      <CitationsCard citations={msg.citations} />
                    </div>
                  );
                }

                if (msg.type === "anomaly_card") {
                  return (
                    <div key={index} className="flex justify-start">
                      <AnomalyCard
                        anomaly={msg.anomaly}
                        equipmentName={msg.equipmentName}
                        onCreateWorkOrder={() => handleSend(`Create work order for ${msg.anomaly.equipmentId}`)}
                      />
                    </div>
                  );
                }

                if (msg.type === "work_order_card") {
                  return (
                    <div key={index} className="flex justify-start">
                      <WorkOrderCard workOrder={msg.workOrder} />
                    </div>
                  );
                }

                if (msg.type === "safety_card") {
                  return (
                    <div key={index} className="flex justify-start">
                      <SafetyCard notice={msg.notice} citation={msg.citation} />
                    </div>
                  );
                }

                if (msg.type === "knowledge_card") {
                  return (
                    <div key={index} className="flex justify-start">
                      <KnowledgeCard record={msg.record} />
                    </div>
                  );
                }

                if (msg.type === "training_card") {
                  return (
                    <div key={index} className="flex justify-start">
                      <TrainingCard data={msg.data} />
                    </div>
                  );
                }

                if (msg.type === "live_count_card") {
                  return (
                    <div key={index} className="flex justify-start">
                      <LiveCountCard data={msg.data} />
                    </div>
                  );
                }

                if (msg.type === "history_card") {
                  return (
                    <div key={index} className="flex justify-start">
                      <HistoryCard data={msg.data} />
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

          {/* Composer */}
          <footer className="border-t-[1.5px] border-[#101418] bg-[#FFFBF0] p-3 sm:p-4 flex-shrink-0 z-20">
            <div className="max-w-3xl mx-auto space-y-2.5">
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
                  placeholder="Text Frontline co-pilot (e.g. check Press 3 thermal drift, open work order)…"
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
      )}

      {/* =========================================================================
          TAB 2: EQUIPMENT & DRIFT MONITORING
      ========================================================================= */}
      {activeTab === "EQUIPMENT" && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-[#101418]/20">
              <div>
                <h2 className="text-xl font-display font-bold text-[#101418]">Plant Asset Health & Telemetry Drift</h2>
                <p className="text-xs font-mono text-[#5C6470]">Statistical anomaly detection distinguishes measured drift from confirmed failures</p>
              </div>
              <div className="text-[11px] font-mono font-bold bg-[#FFF3C4] border border-[#101418]/20 px-2.5 py-1 rounded">
                DEMO ASSET TELEMETRY ACTIVE
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {equipmentList.map((eq) => {
                const hasWarning = eq.status === "WARNING" || eq.status === "CRITICAL";
                return (
                  <div
                    key={eq.id}
                    className="bg-[#FFFBF0] border-2 border-[#101418] rounded-[14px] p-4 shadow-hard space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-[#1E43D8]">
                          <span>{eq.id}</span>
                          <span className="text-[#5C6470]">· Crit {eq.criticality}</span>
                        </div>
                        <h3 className="font-sans font-bold text-[14px] text-[#101418] leading-tight">{eq.name}</h3>
                        <div className="text-[11px] text-[#5C6470]">{eq.line} · {eq.bay}</div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                            hasWarning
                              ? "bg-[#FDECEA] text-[#D92D20] border-[#D92D20]/30"
                              : "bg-[#DCFCE7] text-[#16A34A] border-[#16A34A]/30"
                          }`}
                        >
                          {eq.status}
                        </span>
                        <div className="text-right mt-1">
                          <span className="text-lg font-display font-bold leading-none">{eq.healthScore}</span>
                          <span className="text-[10px] text-[#5C6470]">/100</span>
                        </div>
                      </div>
                    </div>

                    {/* Metrics List */}
                    <div className="bg-white border border-[#101418]/15 rounded-lg p-2.5 divide-y divide-[#101418]/10 text-[11.5px]">
                      {eq.metrics.map((m, idx) => (
                        <div key={idx} className="py-1 flex items-center justify-between">
                          <span className="text-[#5C6470]">{m.name}</span>
                          <div className="flex items-baseline gap-1 font-mono">
                            <span className={m.status === "WARNING" ? "text-[#D92D20] font-bold" : "text-[#101418]"}>
                              {m.value ?? m.currentValue} {m.unit}
                            </span>
                            <span className="text-[10px] text-[#5C6470]">(base: {m.baseline ?? m.baselineMean})</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Anomaly Highlight */}
                    {eq.activeAnomalies.length > 0 && (
                      <div className="bg-[#FFF3C4] border border-[#101418]/20 rounded-lg p-2.5 text-[11.5px] space-y-1">
                        <div className="flex items-center justify-between font-mono text-[10px] font-bold text-[#D92D20]">
                          <span>ANOMALY: {eq.activeAnomalies[0].type}</span>
                          <span>Z={eq.activeAnomalies[0].zScore}σ</span>
                        </div>
                        <p className="text-[#101418] text-[11px] leading-tight">
                          {eq.activeAnomalies[0].description}
                        </p>
                        <div className="text-[10px] font-mono text-[#5C6470]">
                          {eq.activeAnomalies[0].evidenceCalculation}
                        </div>
                      </div>
                    )}

                    {/* Action button */}
                    <div className="pt-1 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("CHAT");
                          handleSend(`Create work order for ${eq.id}`);
                        }}
                        className="flex-1 bg-[#1E43D8] hover:bg-[#1534AA] text-white text-[11px] font-mono font-bold uppercase py-1.5 rounded-lg border-[1.5px] border-[#101418] shadow-xs cursor-pointer transition-all"
                      >
                        1-Click Work Order
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("CHAT");
                          handleSend(`Escalate ${eq.id} drift issue to supervisor`);
                        }}
                        className="px-2.5 bg-white hover:bg-[#FDECEA] text-[#D92D20] text-[11px] font-mono font-bold uppercase py-1.5 rounded-lg border-[1.5px] border-[#101418] shadow-xs cursor-pointer transition-all"
                        title="Escalate issue"
                      >
                        Escalate
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: WORK ORDERS BOARD
      ========================================================================= */}
      {activeTab === "WORK_ORDERS" && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-6xl mx-auto space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#101418]/20">
              <div>
                <h2 className="text-xl font-display font-bold text-[#101418]">Internal Work Orders & CMMS Pipeline</h2>
                <p className="text-xs font-mono text-[#5C6470]">Lifecycle: Open → Assigned → In Progress → Blocked → Completed → Verified</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-[#5C6470]">Status:</span>
                {(["ALL", "OPEN", "IN_PROGRESS", "COMPLETED", "VERIFIED"] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setWoFilter(filter)}
                    className={`px-2 py-0.5 rounded text-[10.5px] font-mono font-bold cursor-pointer transition-colors ${
                      woFilter === filter ? "bg-[#1E43D8] text-white" : "bg-white border border-[#101418]/20 text-[#101418]"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {workOrders
                .filter((wo) => woFilter === "ALL" || wo.status === woFilter)
                .map((wo) => (
                  <div
                    key={wo.id}
                    className="bg-[#FFFBF0] border-2 border-[#101418] rounded-[14px] p-4 sm:p-5 shadow-hard space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#101418]/15">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#1E43D8] text-sm">#{wo.id}</span>
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#F6EFDB] border border-[#101418]/20">
                          {wo.equipmentId}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                            wo.severity === "CRITICAL" || wo.severity === "HIGH"
                              ? "bg-[#FDECEA] text-[#D92D20] border-[#D92D20]/30"
                              : "bg-[#FFF3C4] text-[#8A6D00] border-[#8A6D00]/30"
                          }`}
                        >
                          {wo.severity} · {wo.priority}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-[#5C6470]">{wo.assignedTeam}</span>
                        <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#101418] text-white">
                          {wo.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[12.5px]">
                      <div className="md:col-span-2 space-y-1">
                        <div className="font-bold text-[#101418] text-[14px]">{wo.title}</div>
                        <p className="text-[#5C6470]">{wo.description}</p>
                        <div className="text-[11.5px] text-[#101418] pt-1">
                          <span className="font-semibold text-[#1E43D8]">Recommended Action: </span>
                          {wo.recommendedAction}
                        </div>
                        {wo.sourceReferences.length > 0 && (
                          <div className="flex items-center gap-1.5 pt-1">
                            <span className="text-[10px] font-mono text-[#5C6470]">SOP CITED:</span>
                            {wo.sourceReferences.map((ref, idx) => (
                              <span key={idx} className="font-mono text-[10px] bg-white border border-[#101418]/20 px-1.5 py-0.5 rounded text-[#1E43D8]">
                                {ref}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="bg-white border border-[#101418]/15 rounded-lg p-2.5 text-[11.5px] space-y-1.5 flex flex-col justify-between">
                        <div>
                          <div><span className="text-[#5C6470]">Assigned Tech: </span><span className="font-medium text-[#101418]">{wo.assignedTechnician || "Unassigned"}</span></div>
                          <div><span className="text-[#5C6470]">CMMS Tracking: </span><span className="font-mono text-[#1E43D8]">{wo.cmmsReferenceId || "Internal"}</span></div>
                          <div><span className="text-[#5C6470]">Created: </span><span className="text-[#101418]">{new Date(wo.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                        </div>

                        {/* Status Transition Actions */}
                        <div className="pt-2 border-t border-[#101418]/10 flex flex-wrap gap-1.5">
                          {wo.status === "OPEN" && (
                            <button
                              type="button"
                              onClick={() => updateOrderStatus(wo.id, "IN_PROGRESS")}
                              className="px-2 py-1 bg-[#1E43D8] text-white rounded text-[10px] font-mono font-bold cursor-pointer hover:bg-[#1534AA]"
                            >
                              Start (In Progress)
                            </button>
                          )}
                          {wo.status === "ASSIGNED" && (
                            <button
                              type="button"
                              onClick={() => updateOrderStatus(wo.id, "IN_PROGRESS")}
                              className="px-2 py-1 bg-[#1E43D8] text-white rounded text-[10px] font-mono font-bold cursor-pointer hover:bg-[#1534AA]"
                            >
                              Commence Work
                            </button>
                          )}
                          {wo.status === "IN_PROGRESS" && (
                            <button
                              type="button"
                              onClick={() => updateOrderStatus(wo.id, "COMPLETED")}
                              className="px-2 py-1 bg-[#16A34A] text-white rounded text-[10px] font-mono font-bold cursor-pointer hover:bg-[#12805C]"
                            >
                              Mark Completed
                            </button>
                          )}
                          {wo.status === "COMPLETED" && (
                            <button
                              type="button"
                              onClick={() => updateOrderStatus(wo.id, "VERIFIED")}
                              className="px-2 py-1 bg-[#101418] text-white rounded text-[10px] font-mono font-bold cursor-pointer hover:bg-[#333]"
                            >
                              Supervisor Verify
                            </button>
                          )}
                          {wo.status === "VERIFIED" && (
                            <span className="text-[10px] font-mono text-[#16A34A] font-bold">
                              ✓ Verified & Closed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: TRIBAL KNOWLEDGE BASE
      ========================================================================= */}
      {activeTab === "KNOWLEDGE" && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-6xl mx-auto space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#101418]/20">
              <div>
                <h2 className="text-xl font-display font-bold text-[#101418]">Shopfloor Tribal Knowledge Base</h2>
                <p className="text-xs font-mono text-[#5C6470]">Preserves veteran technician fixes, diagnostic steps, actual root causes, and verification</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={kbSearchQuery}
                  onChange={(e) => {
                    setKbSearchQuery(e.target.value);
                    fetchKnowledge(e.target.value);
                  }}
                  placeholder="Search symptoms, fixes, parts…"
                  className="bg-white border border-[#101418]/20 rounded-md px-3 py-1 text-[12px] font-sans w-52 sm:w-64"
                />
              </div>
            </div>

            <div className="space-y-4">
              {knowledgeRecords.map((kb) => (
                <div
                  key={kb.id}
                  className="bg-[#FFFBF0] border-2 border-[#101418] rounded-[14px] p-4 sm:p-5 shadow-hard space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#101418]/15">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#1E43D8] text-sm">#{kb.id}</span>
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#F6EFDB] border border-[#101418]/20">
                          {kb.equipmentId}
                        </span>
                        <h3 className="font-bold text-[14px] text-[#101418]">{kb.title}</h3>
                      </div>
                      <div className="text-[11px] text-[#5C6470] mt-0.5">
                        Author: <strong className="text-[#101418]">{kb.authorName}</strong> ({kb.authorRole}) · Version {kb.version}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                          kb.status === "APPROVED"
                            ? "bg-[#DCFCE7] text-[#16A34A] border-[#16A34A]/30"
                            : "bg-[#FFF3C4] text-[#8A6D00] border-[#8A6D00]/30"
                        }`}
                      >
                        {kb.status}
                      </span>
                      {kb.isTechnicianConfirmed && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#E8EEFC] text-[#1E43D8] border border-[#1E43D8]/30">
                          ✓ TECHNICIAN CONFIRMED
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px]">
                    <div className="space-y-2">
                      <div className="bg-white border border-[#101418]/15 rounded-lg p-2.5">
                        <div className="font-mono text-[10px] font-bold text-[#5C6470] uppercase mb-1">Observed Symptoms</div>
                        <ul className="list-disc list-inside space-y-0.5 text-[#101418]">
                          {kb.symptoms.map((s, idx) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-white border border-[#101418]/15 rounded-lg p-2.5">
                        <div className="font-mono text-[10px] font-bold text-[#5C6470] uppercase mb-1">Diagnostic Steps Executed</div>
                        <ul className="list-disc list-inside space-y-0.5 text-[#101418]">
                          {kb.diagnosticSteps.map((d, idx) => (
                            <li key={idx}>{d}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="bg-[#FFF3C4] border border-[#101418]/20 rounded-lg p-2.5 space-y-1">
                        <div className="font-mono text-[10px] font-bold text-[#8A6D00] uppercase">Actual Root Cause</div>
                        <p className="text-[#101418] font-medium leading-snug">{kb.actualRootCause}</p>
                      </div>
                      <div className="bg-white border border-[#101418]/15 rounded-lg p-2.5 space-y-1">
                        <div className="font-mono text-[10px] font-bold text-[#16A34A] uppercase">Repair Performed & Parts</div>
                        <p className="text-[#101418] leading-snug">{kb.repairPerformed}</p>
                        <div className="pt-1 text-[11px] text-[#5C6470]">
                          <strong>Parts:</strong> {kb.partsUsed.join(", ")} · <strong>Downtime:</strong> {kb.downtimeMinutes} min
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[#101418]/10 text-[11.5px]">
                    <div className="text-[#5C6470]">
                      <strong>Verification:</strong> {kb.verificationResults}
                    </div>
                    {kb.status !== "APPROVED" && (
                      <button
                        type="button"
                        onClick={() => approveKnowledge(kb.id)}
                        className="bg-[#16A34A] hover:bg-[#12805C] text-white text-[10.5px] font-mono font-bold px-3 py-1 rounded cursor-pointer"
                      >
                        Approve as Standard
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: PLANT ANALYTICS (BIGQUERY)
      ========================================================================= */}
      {activeTab === "ANALYTICS" && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-[#101418]/20">
              <div>
                <h2 className="text-xl font-display font-bold text-[#101418]">Operational Telemetry & Plant Reliability (BigQuery)</h2>
                <p className="text-xs font-mono text-[#5C6470]">Partitioned daily historical telemetry · Mean Time Between Failures & Downtime</p>
              </div>
              <div className="text-[11px] font-mono font-bold bg-[#E8EEFC] text-[#1E43D8] border border-[#1E43D8]/30 px-2.5 py-1 rounded">
                BIGQUERY ENGINE ACTIVE
              </div>
            </div>

            {/* Plant KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#FFFBF0] border-2 border-[#101418] rounded-[12px] p-3.5 shadow-hard">
                <div className="text-[10.5px] font-mono font-bold text-[#5C6470] uppercase">Plant Availability</div>
                <div className="text-2xl font-display font-bold text-[#16A34A] mt-1">
                  {analyticsOverview?.plantAvailability || 91.4}%
                </div>
                <div className="text-[10px] text-[#5C6470] mt-0.5">Across all 5 monitored workcells</div>
              </div>
              <div className="bg-[#FFFBF0] border-2 border-[#101418] rounded-[12px] p-3.5 shadow-hard">
                <div className="text-[10.5px] font-mono font-bold text-[#5C6470] uppercase">24h Downtime</div>
                <div className="text-2xl font-display font-bold text-[#D92D20] mt-1">
                  {analyticsOverview?.totalDowntimeHours24h || 3.9} hrs
                </div>
                <div className="text-[10px] text-[#5C6470] mt-0.5">Scheduled PM + drift checks</div>
              </div>
              <div className="bg-[#FFFBF0] border-2 border-[#101418] rounded-[12px] p-3.5 shadow-hard">
                <div className="text-[10.5px] font-mono font-bold text-[#5C6470] uppercase">Avg MTBF (Reliability)</div>
                <div className="text-2xl font-display font-bold text-[#1E43D8] mt-1">
                  184.2 hrs
                </div>
                <div className="text-[10px] text-[#5C6470] mt-0.5">Mean Time Between Failures</div>
              </div>
              <div className="bg-[#FFFBF0] border-2 border-[#101418] rounded-[12px] p-3.5 shadow-hard">
                <div className="text-[10.5px] font-mono font-bold text-[#5C6470] uppercase">Active Drift Anomalies</div>
                <div className="text-2xl font-display font-bold text-[#FF6B2C] mt-1">
                  {analyticsOverview?.activeAnomaliesCount || 3}
                </div>
                <div className="text-[10px] text-[#5C6470] mt-0.5">Statistical Z &gt; 2.0σ</div>
              </div>
            </div>

            {/* Time-Series Telemetry Visualizer */}
            <div className="bg-[#FFFBF0] border-2 border-[#101418] rounded-[14px] p-5 shadow-hard space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#101418]/15">
                <div>
                  <h3 className="font-bold text-[15px] text-[#101418]">PRESS-03: Hydraulic Oil Temp Drift (24-Hour Rolling Window)</h3>
                  <p className="text-[11.5px] text-[#5C6470]">Statistical baseline: 50.0°C ± 2.5°C · Warning threshold: 65.0°C · Shutdown trip: 75.0°C</p>
                </div>
                <div className="font-mono text-[10px] text-[#5C6470] bg-white border border-[#101418]/20 px-2 py-1 rounded">
                  IS_DEMO_DATA: TRUE
                </div>
              </div>

              {/* Sparkline Visualizer */}
              <div className="bg-white border border-[#101418]/15 rounded-xl p-4 space-y-2">
                <div className="h-36 w-full flex items-end gap-1.5 pt-4">
                  {(telemetrySeries.length > 0 ? telemetrySeries : [
                    { metricValue: 50.2, isAnomaly: false },
                    { metricValue: 51.1, isAnomaly: false },
                    { metricValue: 51.8, isAnomaly: false },
                    { metricValue: 52.4, isAnomaly: false },
                    { metricValue: 54.0, isAnomaly: false },
                    { metricValue: 56.5, isAnomaly: false },
                    { metricValue: 59.2, isAnomaly: false },
                    { metricValue: 62.1, isAnomaly: false },
                    { metricValue: 65.4, isAnomaly: true },
                    { metricValue: 67.2, isAnomaly: true },
                    { metricValue: 68.4, isAnomaly: true },
                  ]).map((point, idx) => {
                    const heightPercent = Math.min(100, Math.max(15, ((point.metricValue - 40) / 40) * 100));
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                        <div
                          className={`w-full rounded-t-sm transition-all ${
                            point.isAnomaly ? "bg-[#D92D20]" : "bg-[#1E43D8]"
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />
                        <span className="text-[9px] font-mono text-[#5C6470] hidden sm:inline">
                          {point.metricValue}°
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-[#5C6470] pt-2 border-t border-[#101418]/10">
                  <span>-24 Hours (Nominal 50°C)</span>
                  <span className="text-[#D92D20] font-bold">Current: 68.4°C (Z=2.36σ Drift Alert)</span>
                </div>
              </div>
            </div>

            {/* Asset Reliability Table */}
            <div className="bg-[#FFFBF0] border-2 border-[#101418] rounded-[14px] p-5 shadow-hard space-y-3">
              <h3 className="font-bold text-[14px] text-[#101418]">Equipment Reliability Breakdown (BigQuery Aggregates)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px] font-sans">
                  <thead>
                    <tr className="border-b border-[#101418]/20 font-mono text-[10.5px] text-[#5C6470] uppercase">
                      <th className="pb-2">Asset</th>
                      <th className="pb-2">MTBF (hrs)</th>
                      <th className="pb-2">MTTR (min)</th>
                      <th className="pb-2">Availability</th>
                      <th className="pb-2">24h Downtime</th>
                      <th className="pb-2">30d Failures</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#101418]/10">
                    {(analyticsOverview?.equipmentSummaries || [
                      { equipmentId: "PRESS-03", equipmentName: "Hydraulic Stamping Press #3", mtbfHours: 142.5, mttrMinutes: 48, availabilityPercent: 88.2, totalDowntimeHours24h: 2.1, failureCount30d: 3 },
                      { equipmentId: "CNC-04", equipmentName: "5-Axis Milling Machine #4", mtbfHours: 168.0, mttrMinutes: 32, availabilityPercent: 91.5, totalDowntimeHours24h: 1.2, failureCount30d: 2 },
                      { equipmentId: "CONV-02", equipmentName: "Main Transfer Conveyor #2", mtbfHours: 210.0, mttrMinutes: 55, availabilityPercent: 94.0, totalDowntimeHours24h: 0.6, failureCount30d: 1 },
                      { equipmentId: "PUMP-01", equipmentName: "Coolant Recirculation Pump #1", mtbfHours: 320.0, mttrMinutes: 20, availabilityPercent: 98.5, totalDowntimeHours24h: 0.0, failureCount30d: 0 },
                    ]).map((row, i) => (
                      <tr key={i} className="hover:bg-white/50">
                        <td className="py-2.5 font-medium text-[#101418]">
                          {row.equipmentName} <span className="font-mono text-[10px] text-[#5C6470]">({row.equipmentId})</span>
                        </td>
                        <td className="py-2.5 font-mono">{row.mtbfHours}h</td>
                        <td className="py-2.5 font-mono">{row.mttrMinutes}m</td>
                        <td className="py-2.5 font-mono text-[#16A34A] font-bold">{row.availabilityPercent}%</td>
                        <td className="py-2.5 font-mono text-[#D92D20]">{row.totalDowntimeHours24h}h</td>
                        <td className="py-2.5 font-mono">{row.failureCount30d}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
