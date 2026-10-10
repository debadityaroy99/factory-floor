"use client";

import React from "react";
import {
  DraftingCompass,
  Shapes,
  Crosshair,
  TableProperties,
  FolderKanban,
  ClipboardList,
} from "lucide-react";

export interface ModuleItem {
  id: string;
  number?: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isLive?: boolean;
  description?: string;
}

export const ARCHITECT_MODULES: ModuleItem[] = [
  {
    id: "01-autodraft",
    number: "01",
    label: "Autodraft",
    icon: DraftingCompass,
    isLive: true,
    description: "Generates production 2D drawing sheets directly from 3D CAD models.",
  },
  {
    id: "02-design-intelligence",
    number: "02",
    label: "Design Intelligence",
    icon: Shapes,
    isLive: true,
    description: "Analyzes manufacturing feasibility, missing dimensions, and feature geometry.",
  },
  {
    id: "03-gdt-review",
    number: "03",
    label: "GD&T Review",
    icon: Crosshair,
    isLive: true,
    description: "Validates datums, feature control frames, and ASME Y14.5 tolerance callouts.",
  },
  {
    id: "04-bom-check",
    number: "04",
    label: "BOM Check",
    icon: TableProperties,
    isLive: true,
    description: "Reconciles drawing parts lists against overall BOMs and flags discrepancies.",
  },
];

export const WORKSPACE_ITEMS: ModuleItem[] = [
  {
    id: "ws-projects",
    label: "Projects",
    icon: FolderKanban,
    description: "Manage plant projects, drawing revisions, and release packages.",
  },
  {
    id: "ws-my-reviews",
    label: "My Reviews",
    icon: ClipboardList,
    description: "Audit trail of your sign-offs, flagged discrepancies, and notes.",
  },
];

interface FeatureRailProps {
  activeModuleId: string;
  onSelectModule: (id: string) => void;
}

export function FeatureRail({ activeModuleId, onSelectModule }: FeatureRailProps) {
  return (
    <>
      {/* =========================================================================
          DESKTOP RAIL (>= 900px): Fixed 248px Left Column
      ========================================================================= */}
      <aside className="hidden min-[900px]:flex w-[248px] bg-[#FBF6E9] border-r-2 border-[#101418] flex-col shrink-0 select-none overflow-y-auto h-full">
        <div className="p-3 space-y-4 flex-1">
          {/* Eyebrow: ARCHITECT MODULES */}
          <div className="px-2 pt-1 font-mono text-[10px] font-bold uppercase tracking-widest text-[#101418]/60">
            ARCHITECT MODULES
          </div>

          {/* Module Rows (01 - 04) */}
          <div className="space-y-1">
            {ARCHITECT_MODULES.map((mod) => {
              const isActive = activeModuleId === mod.id;
              const Icon = mod.icon;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => onSelectModule(mod.id)}
                  className={`w-full h-[44px] rounded-[10px] px-2.5 flex items-center gap-2.5 transition-all cursor-pointer text-left ${
                    isActive
                      ? "bg-[#E8EEFC] border-2 border-[#101418] shadow-[3px_3px_0_#101418] text-[#101418]"
                      : "bg-transparent border-2 border-transparent text-[#101418]/70 hover:bg-[#E8EEFC]/50 hover:text-[#101418]"
                  }`}
                >
                  {/* Pale Circle with Number & Icon */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
                      isActive
                        ? "bg-[#1E43D8] text-white border-[#101418]"
                        : "bg-white text-[#1E43D8] border-[#101418]/25"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 stroke-[2.2]" />
                  </div>

                  <span className="font-mono text-[11px] font-bold text-[#101418]/50 shrink-0">
                    {mod.number}
                  </span>

                  <span className="font-sans text-[13.5px] font-semibold text-[#101418] truncate flex-1">
                    {mod.label}
                  </span>

                  {mod.isLive && (
                    <span
                      className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                        isActive
                          ? "bg-[#101418] text-white"
                          : "bg-[#FFF3C4] border border-[#101418]/20 text-[#101418]"
                      }`}
                    >
                      LIVE
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="border-b border-[#101418]/15 mx-1" />

          {/* Eyebrow: WORKSPACE */}
          <div className="px-2 pt-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-[#101418]/60">
            WORKSPACE
          </div>

          {/* Workspace Rows */}
          <div className="space-y-1">
            {WORKSPACE_ITEMS.map((item) => {
              const isActive = activeModuleId === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectModule(item.id)}
                  className={`w-full h-[40px] rounded-[10px] px-2.5 flex items-center gap-2.5 transition-all cursor-pointer text-left ${
                    isActive
                      ? "bg-[#E8EEFC] border-2 border-[#101418] shadow-[3px_3px_0_#101418] text-[#101418]"
                      : "bg-transparent border-2 border-transparent text-[#101418]/70 hover:bg-[#E8EEFC]/50 hover:text-[#101418]"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
                      isActive
                        ? "bg-[#1E43D8] text-white border-[#101418]"
                        : "bg-white text-[#101418]/70 border-[#101418]/25"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 stroke-[2]" />
                  </div>

                  <span className="font-sans text-[13.5px] font-semibold text-[#101418] truncate flex-1">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* =====================================================================
            FOOTER BLOCK: Review credits + User Profile
        ===================================================================== */}
        <div className="p-3 border-t-2 border-[#101418] bg-[#FBF6E9] space-y-2.5 shrink-0">
          <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-[#101418]/70">
            <span>REVIEW CREDITS</span>
            <span className="text-[#101418]">9 / 10 LEFT</span>
          </div>

          {/* Segmented bar: 9 filled with sun #FFC53D, 1 empty */}
          <div className="flex items-center gap-1 h-2 w-full">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-full rounded-[2px] border border-[#101418]/30 ${
                  i < 9 ? "bg-[#FFC53D]" : "bg-white/70"
                }`}
              />
            ))}
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-2 pt-1">
            <div className="w-6 h-6 rounded-full bg-[#101418] text-white font-sans font-bold text-[11px] flex items-center justify-center shrink-0">
              d
            </div>
            <div className="font-sans text-[12px] font-medium text-[#101418] truncate">
              deb · <span className="text-[#101418]/70">Architect seat</span>
            </div>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          MOBILE / TABLET STRIP (< 900px): Horizontal Scrollable Chip Strip
      ========================================================================= */}
      <div className="min-[900px]:hidden w-full bg-[#FBF6E9] border-b-2 border-[#101418] px-3 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 z-10 select-none">
        {ARCHITECT_MODULES.map((mod) => {
          const isActive = activeModuleId === mod.id;
          const Icon = mod.icon;
          return (
            <button
              key={mod.id}
              type="button"
              onClick={() => onSelectModule(mod.id)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                isActive
                  ? "bg-[#E8EEFC] border-[1.5px] border-[#101418] shadow-hard-xs text-[#101418]"
                  : "bg-white/80 border border-[#101418]/25 text-[#101418]/70 hover:bg-[#E8EEFC]/40"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>
                {mod.number} {mod.label}
              </span>
              {mod.isLive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
              )}
            </button>
          );
        })}

        <div className="w-px h-5 bg-[#101418]/20 shrink-0 mx-0.5" />

        {WORKSPACE_ITEMS.map((item) => {
          const isActive = activeModuleId === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectModule(item.id)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                isActive
                  ? "bg-[#E8EEFC] border-[1.5px] border-[#101418] shadow-hard-xs text-[#101418]"
                  : "bg-white/80 border border-[#101418]/25 text-[#101418]/70 hover:bg-[#E8EEFC]/40"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

