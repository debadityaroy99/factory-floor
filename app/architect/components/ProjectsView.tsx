"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FolderOpen,
  Paperclip,
  ArrowRight,
  ChevronRight,
  Plus,
  Play,
  FileText,
  DraftingCompass,
  Shapes,
  Crosshair,
  TableProperties,
  Loader2,
  X,
  Cloud,
  MoreVertical,
  Trash2,
} from "lucide-react";
import {
  ProjectItem,
  ProjectRunRecord,
  DEFAULT_MOCK_PROJECTS as INITIAL_PROJECTS,
} from "../../../lib/types/projects";

export type { ProjectItem, ProjectRunRecord };
export { INITIAL_PROJECTS };

export interface ProjectModuleNavOptions {
  initialSample?: boolean;
  initialStep?: 1 | 2 | 3;
  runId?: string;
  fileName?: string;
  projectId?: string;
  projectName?: string;
  isInspect?: boolean;
}

export interface ProjectsViewProps {
  onOpenModule: (moduleCode: string, options?: ProjectModuleNavOptions) => void;
  onBackToModules: () => void;
  initialProjectId?: string | null;
}

export function ProjectsView({ onOpenModule, onBackToModules, initialProjectId }: ProjectsViewProps) {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [filter, setFilter] = useState<"All" | "In review" | "Issues open" | "Released">("All");
  const [composerInput, setComposerInput] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch projects from Firestore via API route
  const fetchProjects = async (isMounted = true) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/architect/projects");
      if (res.ok) {
        const data = await res.json();
        if (data.projects && isMounted) {
          setProjects(data.projects);
        }
      } else {
        if (isMounted) setProjects(INITIAL_PROJECTS);
      }
    } catch (err) {
      console.error("Failed to fetch projects from Firestore:", err);
      if (isMounted) setProjects(INITIAL_PROJECTS);
    } finally {
      if (isMounted) setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchProjects(isMounted);
    return () => {
      isMounted = false;
    };
  }, []);

  // Synchronize initialProjectId or keep selectedProject fresh when projects update
  useEffect(() => {
    if (initialProjectId && projects.length > 0) {
      const matched = projects.find((p) => p.id === initialProjectId);
      if (matched) {
        setSelectedProject(matched);
      }
    } else if (selectedProject && projects.length > 0) {
      const refreshed = projects.find((p) => p.id === selectedProject.id);
      if (refreshed) {
        setSelectedProject(refreshed);
      }
    }
  }, [initialProjectId, projects]);

  // Filter projects by status
  const filteredProjects = projects.filter((p) => {
    if (filter === "All") return true;
    if (filter === "In review") return p.status === "IN REVIEW";
    if (filter === "Issues open") return p.status === "ISSUES OPEN";
    if (filter === "Released") return p.status === "RELEASED";
    return true;
  });

  // Start project helper: stores to Cloud Storage & Firestore
  const handleStartProject = async (label?: string, chipType?: string) => {
    if (isCreating) return;
    setIsCreating(true);

    const title =
      composerInput.trim() ||
      label ||
      attachedFile?.name.replace(/\.[^/.]+$/, "") ||
      "Untitled project";

    try {
      const formData = new FormData();
      formData.append("name", title);
      if (chipType) formData.append("chipType", chipType);
      if (attachedFile) {
        formData.append("file", attachedFile);
      }

      const res = await fetch("/api/architect/projects", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Failed to create project (HTTP ${res.status})`);
      }

      const data = await res.json();
      if (data.project) {
        setProjects((prev) => [data.project, ...prev]);
      }
    } catch (err) {
      console.error("Failed to persist project to Firestore / Cloud Storage:", err);
      // Fallback local creation if network error
      const fallbackProject: ProjectItem = {
        id: `proj-local-${Date.now()}`,
        name: title,
        dwg: "DWG UNTITLED · REV —",
        thumb:
          chipType === "step"
            ? "sheet"
            : chipType === "drawing"
            ? "plate"
            : chipType === "bom"
            ? "bom"
            : "blank",
        status: "DRAFT",
        runs: { autodraft: 0, di: 0, gdt: 0, bom: 0 },
        findings: "NO RUNS YET",
        findingsType: "neutral",
        owner: "deb",
        initials: "D",
        updated: "JUST NOW",
        runsList: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setProjects((prev) => [fallbackProject, ...prev]);
    } finally {
      setIsCreating(false);
      setComposerInput("");
      setAttachedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Back from project detail resets filter
  const handleBackToGallery = () => {
    setSelectedProject(null);
    setFilter("All");
  };

  // Delete project from Firestore & Cloud Storage
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

  const handleDeleteProject = async (id: string, name: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${name}"?\nThis will permanently delete it from Google Cloud Storage and Firestore.`
    );
    if (!confirmed) return;

    setDeletingProjectId(id);
    try {
      const res = await fetch(`/api/architect/projects?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error(`Failed to delete project (HTTP ${res.status})`);
      }

      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (selectedProject?.id === id) {
        setSelectedProject(null);
      }
    } catch (err) {
      console.error("Failed to delete project:", err);
      alert(`Could not delete project: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setDeletingProjectId(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#FFFBF0] selection:bg-[#E8EEFC] selection:text-[#1E43D8]">
      <div className="max-w-[1100px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Navigation Breadcrumbs / Back links */}
        <div className="flex items-center justify-between border-b border-[#101418]/15 pb-3">
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-[#101418]">
            <span>HOME</span>
            <span className="text-[#101418]/30">/</span>
            <span
              onClick={handleBackToGallery}
              className={`cursor-pointer hover:text-[#1E43D8] transition-colors ${
                selectedProject ? "text-[#101418]/70" : "text-[#101418]"
              }`}
            >
              PROJECTS
            </span>
            {selectedProject && (
              <>
                <span className="text-[#101418]/30">/</span>
                <span className="text-[#1E43D8]">{selectedProject.name}</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onBackToModules}
            className="font-mono text-[11px] font-semibold text-[#101418]/70 hover:text-[#1E43D8] transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>← All modules</span>
          </button>
        </div>

        {/* =========================================================================
            VIEW 1: PROJECT DETAIL VIEW (When a card is clicked)
        ========================================================================= */}
        {selectedProject ? (
          <div className="space-y-6 animate-slide-up">
            {/* Header / Back Link */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleBackToGallery}
                className="font-mono text-xs font-bold text-[#1E43D8] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>← Projects</span>
              </button>
              <div className="font-mono text-[11px] font-semibold text-[#101418]/50">
                PROJECT DETAIL
              </div>
            </div>

            {/* Project Header Sheet */}
            <div className="bg-[#FFFBF0] border-2 border-[#101418] rounded-[14px] p-5 sm:p-6 shadow-hard space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-mono text-[10.5px] font-bold text-[#1E43D8] uppercase tracking-wider">
                    {selectedProject.dwg}
                  </div>
                  <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#101418] tracking-tight">
                    {selectedProject.name}
                  </h1>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-[11px] font-bold px-2.5 py-1 rounded border-[1.5px] border-[#101418] uppercase tracking-wider shadow-2xs ${
                      selectedProject.status === "IN REVIEW"
                        ? "bg-[#FFF3C4] text-[#101418]"
                        : selectedProject.status === "ISSUES OPEN"
                        ? "bg-[#D92D20] text-white"
                        : selectedProject.status === "RELEASED"
                        ? "bg-[#1E9E6A] text-white"
                        : "bg-[#FFFBF0] text-[#101418]"
                    }`}
                  >
                    {selectedProject.status}
                  </span>

                  <span
                    className={`font-mono text-[11px] font-bold px-2.5 py-1 rounded uppercase tracking-wider border ${
                      selectedProject.findingsType === "issues"
                        ? "bg-[#D92D20]/10 text-[#D92D20] border-[#D92D20]/30"
                        : selectedProject.findingsType === "clear"
                        ? "bg-[#1E9E6A]/10 text-[#1E9E6A] border-[#1E9E6A]/30"
                        : "bg-[#101418]/5 text-[#101418]/60 border-[#101418]/15"
                    }`}
                  >
                    {selectedProject.findings}
                  </span>
                </div>
              </div>

              {/* Meta information */}
              <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-[#101418]/15 font-mono text-xs text-[#101418]/70">
                <div>
                  Owner: <span className="font-bold text-[#101418]">{selectedProject.owner}</span>
                </div>
                <div>·</div>
                <div>
                  Last updated: <span className="font-bold text-[#101418]">{selectedProject.updated}</span>
                </div>
                <div>·</div>
                <div className="flex items-center gap-1.5">
                  <span>Runs active:</span>
                  <span className="font-bold text-[#1E43D8]">
                    {selectedProject.runsList.length}
                  </span>
                </div>
                {selectedProject.storageUri && (
                  <>
                    <div>·</div>
                    <div className="flex items-center gap-1.5 text-[11px]" title={selectedProject.storageUri}>
                      <Cloud className="w-3.5 h-3.5 text-[#1E43D8]" />
                      <span>Storage:</span>
                      <span className="font-bold text-[#1E43D8] font-mono truncate max-w-[240px]">
                        {selectedProject.storageUri}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Runs Table Sheet */}
            <div className="bg-white border-2 border-[#101418] rounded-[14px] shadow-hard overflow-hidden">
              <div className="px-5 py-3.5 bg-[#FBF6E9] border-b-2 border-[#101418] flex items-center justify-between">
                <div className="font-mono text-xs font-bold uppercase tracking-wider text-[#101418]">
                  PROJECT RUNS & REVIEWS ({selectedProject.runsList.length})
                </div>
                <div className="font-mono text-[10.5px] text-[#101418]/60">
                  Click a demo run to inspect module state
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#101418]/20 font-mono text-[10.5px] uppercase tracking-wider text-[#101418]/60 bg-[#FFFBF0]/60">
                      <th className="py-2.5 px-4 font-bold">MODULE</th>
                      <th className="py-2.5 px-4 font-bold">RUN</th>
                      <th className="py-2.5 px-4 font-bold">FILE</th>
                      <th className="py-2.5 px-4 font-bold">RESULT</th>
                      <th className="py-2.5 px-4 font-bold">DATE</th>
                      <th className="py-2.5 px-4 font-bold text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#101418]/10 text-xs">
                    {selectedProject.runsList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center font-mono text-xs text-[#101418]/50">
                          No runs recorded for this project yet. Add a run below.
                        </td>
                      </tr>
                    ) : (
                      selectedProject.runsList.map((run, idx) => (
                        <tr
                          key={idx}
                          onClick={() => {
                            onOpenModule(run.moduleCode, {
                              initialSample: !!run.isDemo,
                              initialStep: 3,
                              fileName: run.fileName,
                              runId: run.runId,
                              projectId: selectedProject.id,
                              projectName: selectedProject.name,
                              isInspect: true,
                            });
                          }}
                          className="transition-colors hover:bg-[#E8EEFC]/60 cursor-pointer group"
                        >
                          <td className="py-3 px-4 font-mono font-bold text-[#1E43D8]">
                            {run.moduleName}
                          </td>
                          <td className="py-3 px-4 font-sans font-medium text-[#101418]">
                            {run.runTitle}
                          </td>
                          <td className="py-3 px-4 font-mono text-[#101418]/70">
                            {run.fileName}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                                run.resultType === "error"
                                  ? "bg-[#D92D20]/10 text-[#D92D20] border-[#D92D20]/30"
                                  : run.resultType === "warn"
                                  ? "bg-[#FFC53D]/25 text-[#101418] border-[#FFC53D]/50"
                                  : "bg-[#1E9E6A]/10 text-[#1E9E6A] border-[#1E9E6A]/30"
                              }`}
                            >
                              {run.result}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[#101418]/60">
                            {run.date}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-mono text-[11px] font-bold text-[#1E43D8] group-hover:translate-x-0.5 inline-flex items-center gap-1 transition-transform">
                              <span>Inspect</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Add a run row */}
              <div className="p-4 bg-[#FBF6E9] border-t-2 border-[#101418] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#101418]">
                  + ADD A RUN TO THIS PROJECT
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onOpenModule("01-autodraft", {
                        projectId: selectedProject.id,
                        projectName: selectedProject.name,
                      })
                    }
                    className="px-2.5 py-1 rounded-md bg-white border border-[#101418] text-[#101418] font-mono text-[11px] font-semibold hover:bg-[#E8EEFC] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-[#1E43D8]" />
                    <span>Autodraft</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onOpenModule("02-design-intelligence", {
                        projectId: selectedProject.id,
                        projectName: selectedProject.name,
                      })
                    }
                    className="px-2.5 py-1 rounded-md bg-white border border-[#101418] text-[#101418] font-mono text-[11px] font-semibold hover:bg-[#E8EEFC] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-[#1E43D8]" />
                    <span>Design Intel</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onOpenModule("03-gdt-review", {
                        projectId: selectedProject.id,
                        projectName: selectedProject.name,
                      })
                    }
                    className="px-2.5 py-1 rounded-md bg-white border border-[#101418] text-[#101418] font-mono text-[11px] font-semibold hover:bg-[#E8EEFC] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-[#1E43D8]" />
                    <span>GD&T Review</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onOpenModule("04-bom-check", {
                        projectId: selectedProject.id,
                        projectName: selectedProject.name,
                      })
                    }
                    className="px-2.5 py-1 rounded-md bg-white border border-[#101418] text-[#101418] font-mono text-[11px] font-semibold hover:bg-[#E8EEFC] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-[#1E43D8]" />
                    <span>BOM Check</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================================
              VIEW 2: MAIN PROJECTS GALLERY VIEW
          ========================================================================= */
          <div className="space-y-8 animate-fade-in">
            {/* 1. Header Intro */}
            <div className="space-y-2">
              <div className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#1E43D8]">
                WORKSPACE · PROJECTS
              </div>
              <h1 className="font-display font-bold text-3xl sm:text-[44px] text-[#101418] tracking-tight leading-[1.12]">
                What are we putting into production?
              </h1>
              <p className="font-sans text-[15px] sm:text-base text-[#3C4356] leading-relaxed max-w-2xl">
                Every drawing your team has generated, reviewed and reconciled — grouped by part,
                not by tool.
              </p>
            </div>

            {/* 2. Start Strip (Ivory Composer Sheet) */}
            <div className="bg-[#FBF6E9] border-2 border-[#101418] rounded-[14px] p-4 sm:p-5 shadow-hard space-y-3.5">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleStartProject();
                }}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
              >
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setAttachedFile(file);
                      if (!composerInput.trim()) {
                        setComposerInput(file.name.replace(/\.[^/.]+$/, ""));
                      }
                    }
                  }}
                  accept=".step,.stp,.pdf,.dwg,.csv,.xlsx,.png,.jpg"
                  className="hidden"
                />

                <div className="flex-1 flex items-center bg-white border-2 border-[#101418] rounded-lg overflow-hidden shadow-2xs focus-within:ring-2 focus-within:ring-[#1E43D8]">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title={attachedFile ? `Attached: ${attachedFile.name}` : "Attach STEP, drawing PDF, or BOM"}
                    className={`px-3 py-2 transition-colors border-r border-[#101418]/15 cursor-pointer ${
                      attachedFile
                        ? "bg-[#E8EEFC] text-[#1E43D8]"
                        : "text-[#101418]/60 hover:text-[#1E43D8] hover:bg-[#E8EEFC]/50"
                    }`}
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  {/* Attached File Indicator */}
                  {attachedFile && (
                    <div className="ml-2 bg-[#E8EEFC] border border-[#101418]/20 px-2 py-0.5 rounded text-[11px] font-mono text-[#1E43D8] flex items-center gap-1.5 shrink-0 max-w-[160px]">
                      <span className="truncate">{attachedFile.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAttachedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="hover:text-[#D92D20] font-bold cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <input
                    type="text"
                    value={composerInput}
                    onChange={(e) => setComposerInput(e.target.value)}
                    disabled={isCreating}
                    placeholder={
                      attachedFile
                        ? "Enter project title (or leave blank to use file name)…"
                        : "Drop a STEP file, a drawing PDF, or a BOM to start a project…"
                    }
                    className="w-full px-3 py-2.5 font-sans text-xs sm:text-sm text-[#101418] placeholder:text-[#101418]/45 bg-transparent focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="bg-[#1E43D8] hover:bg-[#1E43D8]/90 text-white font-sans font-semibold text-sm px-5 py-2.5 rounded-lg border-2 border-[#101418] shadow-hard-xs shrink-0 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-60"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving…</span>
                    </>
                  ) : (
                    <>
                      <span>Start project</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Action Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={() => handleStartProject("STEP project", "step")}
                  disabled={isCreating}
                  className="px-3 py-1 rounded-full bg-white border-[1.5px] border-[#101418] text-[#101418] hover:bg-[#E8EEFC] transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                >
                  <DraftingCompass className="w-3 h-3 text-[#1E43D8]" />
                  <span>Start from STEP</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStartProject("Drawing inspection", "drawing")}
                  disabled={isCreating}
                  className="px-3 py-1 rounded-full bg-white border-[1.5px] border-[#101418] text-[#101418] hover:bg-[#E8EEFC] transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                >
                  <FileText className="w-3 h-3 text-[#1E43D8]" />
                  <span>Upload a drawing</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStartProject("BOM reconciliation", "bom")}
                  disabled={isCreating}
                  className="px-3 py-1 rounded-full bg-white border-[1.5px] border-[#101418] text-[#101418] hover:bg-[#E8EEFC] transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                >
                  <TableProperties className="w-3 h-3 text-[#1E43D8]" />
                  <span>Import a BOM</span>
                </button>
              </div>
            </div>

            {/* 3. Section: "Your projects" + Count + Filters */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-[#101418]/15">
                <div className="flex items-center gap-2.5">
                  <h2 className="font-display font-bold text-xl sm:text-2xl text-[#101418]">
                    Your projects
                  </h2>
                  <span className="bg-[#FFF3C4] border border-[#101418]/30 font-mono text-xs px-2.5 py-0.5 rounded-full font-bold text-[#101418]">
                    {isLoading ? "..." : filteredProjects.length}
                  </span>
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar font-mono text-[11px]">
                  {(["All", "In review", "Issues open", "Released"] as const).map((opt) => {
                    const isActive = filter === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setFilter(opt)}
                        className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer whitespace-nowrap ${
                          isActive
                            ? "bg-[#101418] text-white border border-[#101418] shadow-2xs"
                            : "bg-white text-[#101418]/70 border border-[#101418]/25 hover:bg-[#E8EEFC]/50 hover:text-[#101418]"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Projects Grid: 3 cols desktop, 2 cols tablet, 1 col mobile */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-white border-2 border-[#101418] rounded-[14px] shadow-hard h-[330px] animate-pulse flex flex-col overflow-hidden"
                    >
                      <div className="h-[150px] bg-[#101418]/5 border-b-2 border-[#101418] flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-2 border-[#101418]/20 border-t-[#1E43D8] animate-spin" />
                      </div>
                      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="h-4 bg-[#101418]/10 rounded w-3/4" />
                          <div className="h-3 bg-[#101418]/5 rounded w-1/2" />
                        </div>
                        <div className="h-3 bg-[#101418]/5 rounded w-full" />
                        <div className="h-4 bg-[#101418]/10 rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="py-12 text-center font-mono text-xs text-[#101418]/60 bg-white border-2 border-[#101418] rounded-[14px] p-6 shadow-hard">
                  No projects found for filter &ldquo;{filter}&rdquo;.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredProjects.map((p) => (
                    <ProjectCard
                      key={p.id}
                      project={p}
                      onClick={() => setSelectedProject(p)}
                      onDelete={handleDeleteProject}
                      isDeleting={deletingProjectId === p.id}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 4. Section: "Start from a worked sample" */}
            <div className="space-y-4 pt-4">
              <div>
                <h2 className="font-display font-bold text-xl sm:text-2xl text-[#101418]">
                  Start from a worked sample
                </h2>
                <p className="font-sans text-xs sm:text-sm text-[#101418]/60 mt-0.5">
                  Fully-run projects — open one and every module is already populated.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SampleCard
                  title="STEP → drawing in 8 stages"
                  subline="Autodraft · Clevis"
                  thumb="sheet"
                  onClick={() =>
                    onOpenModule("01-autodraft", {
                      initialSample: true,
                      runId: "run-1",
                      fileName: "clevis.step",
                    })
                  }
                />

                <SampleCard
                  title="Find the missing callouts"
                  subline="Design Intelligence · Diffuser plate"
                  thumb="plate"
                  onClick={() =>
                    onOpenModule("02-design-intelligence", {
                      initialSample: true,
                    })
                  }
                />

                <SampleCard
                  title="GD&T that doesn't close"
                  subline="GD&T Review · Contact probe"
                  thumb="probe"
                  onClick={() =>
                    onOpenModule("03-gdt-review", {
                      initialSample: true,
                    })
                  }
                />

                <SampleCard
                  title="BOM vs drawing, reconciled"
                  subline="BOM Check · E1100217"
                  thumb="bom"
                  onClick={() =>
                    onOpenModule("04-bom-check", {
                      initialSample: true,
                      initialStep: 3,
                    })
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// PROJECT CARD COMPONENT
// =============================================================================

function ProjectCard({
  project,
  onClick,
  onDelete,
  isDeleting,
}: {
  project: ProjectItem;
  onClick: () => void;
  onDelete?: (id: string, name: string) => void;
  isDeleting?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <div
      onClick={onClick}
      className="bg-white border-2 border-[#101418] rounded-[14px] shadow-hard overflow-hidden transition-all duration-150 cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_#101418] flex flex-col group select-none relative"
    >
      {/* Thumbnail Header (Height 150px, flush top) */}
      <div className="h-[150px] w-full border-b-2 border-[#101418] relative bg-[#FFFFFF] flex items-center justify-center overflow-hidden">
        {/* Line art SVG keyed by type */}
        <ProjectThumbnailSvg type={project.thumb} />

        {/* Status Badge & 3-Dot Overflow Menu Over Top-Right Thumbnail */}
        <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5" ref={menuRef}>
          <span
            className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border-[1.5px] border-[#101418] uppercase tracking-wider shadow-2xs ${
              project.status === "IN REVIEW"
                ? "bg-[#FFF3C4] text-[#101418]"
                : project.status === "ISSUES OPEN"
                ? "bg-[#D92D20] text-white"
                : project.status === "RELEASED"
                ? "bg-[#1E9E6A] text-white"
                : "bg-[#FFFBF0] text-[#101418]"
            }`}
          >
            {project.status}
          </span>

          {onDelete && (
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((prev) => !prev);
                }}
                disabled={isDeleting}
                title="Project options"
                className="w-6 h-6 rounded border-[1.5px] border-[#101418] bg-white text-[#101418] hover:bg-[#E8EEFC] transition-colors flex items-center justify-center shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="w-3 h-3 animate-spin text-[#D92D20]" />
                ) : (
                  <MoreVertical className="w-3.5 h-3.5" />
                )}
              </button>

              {menuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full mt-1.5 w-36 bg-white border-2 border-[#101418] rounded-[8px] shadow-[4px_4px_0_#101418] py-1 z-30"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onDelete(project.id, project.name);
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs font-semibold text-[#D92D20] hover:bg-[#D92D20]/10 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-[#D92D20]" />
                    <span>Delete project</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white">
        <div>
          <div className="flex items-center gap-1.5 text-[#101418]">
            <FolderOpen className="w-4 h-4 text-[#1E43D8] shrink-0" />
            <h3 className="font-sans font-semibold text-[15px] leading-tight truncate">
              {project.name}
            </h3>
          </div>
          <div className="font-mono text-[10.5px] text-[#101418]/60 mt-1 uppercase tracking-wider">
            {project.dwg}
          </div>
        </div>

        <div className="border-b border-[#101418]/15" />

        {/* Runs line with module glyphs & counts */}
        <div className="space-y-2">
          <div className="font-mono text-[10.5px] text-[#101418] flex items-center flex-wrap gap-x-2 gap-y-1">
            <span className="text-[#1E43D8] font-bold">▸</span>
            <span className={project.runs.autodraft > 0 ? "opacity-100 font-semibold" : "opacity-40"}>
              AUTODRAFT {project.runs.autodraft}
            </span>
            <span className="text-[#101418]/30">·</span>
            <span className={project.runs.di > 0 ? "opacity-100 font-semibold" : "opacity-40"}>
              DI {project.runs.di}
            </span>
            <span className="text-[#101418]/30">·</span>
            <span className={project.runs.gdt > 0 ? "opacity-100 font-semibold" : "opacity-40"}>
              GD&T {project.runs.gdt}
            </span>
            <span className="text-[#101418]/30">·</span>
            <span className={project.runs.bom > 0 ? "opacity-100 font-semibold" : "opacity-40"}>
              BOM {project.runs.bom}
            </span>
          </div>

          {/* Findings Chip */}
          <div>
            <span
              className={`font-mono text-[10.5px] font-bold px-2 py-0.5 rounded border inline-block ${
                project.findingsType === "issues"
                  ? "bg-[#D92D20]/10 text-[#D92D20] border-[#D92D20]/30"
                  : project.findingsType === "clear"
                  ? "bg-[#1E9E6A]/10 text-[#1E9E6A] border-[#1E9E6A]/30"
                  : "bg-[#101418]/5 text-[#101418]/50 border-[#101418]/15"
              }`}
            >
              {project.findings}
            </span>
          </div>
        </div>

        {/* Card Footer: Owner avatar + timestamp */}
        <div className="pt-2 border-t border-[#101418]/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-[#101418] text-white font-mono font-bold text-[9.5px] flex items-center justify-center shrink-0">
              {project.initials}
            </div>
            <span className="font-sans font-medium text-[12px] text-[#101418]">
              {project.owner}
            </span>
          </div>

          <div className="font-mono text-[10px] font-bold text-[#101418]/50 uppercase tracking-wider">
            UPDATED {project.updated}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SAMPLE CARD COMPONENT
// =============================================================================

function SampleCard({
  title,
  subline,
  thumb,
  onClick,
}: {
  title: string;
  subline: string;
  thumb: "sheet" | "plate" | "probe" | "bom";
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-white border-2 border-[#101418] rounded-[14px] shadow-hard overflow-hidden transition-all duration-150 cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_#101418] flex flex-col justify-between group select-none"
    >
      <div>
        {/* Thumbnail Header (Height 130px) */}
        <div className="h-[130px] w-full border-b-2 border-[#101418] relative bg-[#FFFFFF] flex items-center justify-center overflow-hidden">
          <ProjectThumbnailSvg type={thumb} />

          {/* Badge top-right */}
          <div className="absolute top-2.5 right-2.5 z-10">
            <span className="bg-[#FFF3C4] border border-[#101418] text-[#101418] font-mono text-[9px] font-bold px-2 py-0.5 rounded shadow-2xs uppercase tracking-wider">
              SAMPLE
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-3.5 space-y-1.5">
          <h3 className="font-sans font-semibold text-sm text-[#101418] leading-snug group-hover:text-[#1E43D8] transition-colors">
            {title}
          </h3>
          <p className="font-mono text-[11px] text-[#101418]/60 uppercase tracking-wider">
            {subline}
          </p>
        </div>
      </div>

      <div className="px-3.5 py-2.5 border-t border-[#101418]/15 bg-[#FBF6E9] flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-wider text-[#101418]/60">
        <span>GUIDED · BY MANUFY</span>
        <Play className="w-3 h-3 text-[#1E43D8] group-hover:translate-x-0.5 transition-transform" />
      </div>
    </div>
  );
}

// =============================================================================
// THUMBNAIL LINE-ART SVG RENDERER
// =============================================================================

function ProjectThumbnailSvg({
  type,
}: {
  type: "sheet" | "plate" | "probe" | "bom" | "blank";
}) {
  switch (type) {
    case "sheet":
      return (
        <svg viewBox="0 0 160 100" className="w-[130px] h-[80px]" fill="none" stroke="#101418">
          {/* Drawing Border */}
          <rect x="10" y="8" width="140" height="84" strokeWidth="1.5" />
          <rect x="14" y="12" width="132" height="76" strokeWidth="0.8" />
          {/* Title Block Bar */}
          <line x1="90" y1="72" x2="146" y2="72" strokeWidth="0.8" />
          <line x1="90" y1="72" x2="90" y2="88" strokeWidth="0.8" />
          <rect x="94" y="76" width="30" height="3" fill="#1E43D8" stroke="none" />
          {/* Projection view 1: Front */}
          <rect x="25" y="24" width="40" height="28" strokeWidth="1.2" stroke="#101418" />
          <line x1="25" y1="38" x2="65" y2="38" strokeWidth="0.7" strokeDasharray="3 2" stroke="#3E6BE0" />
          {/* Projection view 2: Right */}
          <rect x="80" y="24" width="28" height="28" strokeWidth="1.2" stroke="#101418" />
          {/* Projection view 3: Top */}
          <rect x="25" y="60" width="40" height="18" strokeWidth="1" stroke="#101418" />
          {/* Dimension leaders */}
          <line x1="68" y1="20" x2="77" y2="20" strokeWidth="0.7" stroke="#3E6BE0" />
          <line x1="25" y1="18" x2="65" y2="18" strokeWidth="0.7" stroke="#3E6BE0" />
        </svg>
      );

    case "plate":
      return (
        <svg viewBox="0 0 160 100" className="w-[130px] h-[80px]" fill="none" stroke="#101418">
          {/* Square plate with radius */}
          <rect x="40" y="10" width="80" height="80" rx="8" strokeWidth="1.5" />
          {/* Large Center Bore */}
          <circle cx="80" cy="50" r="18" strokeWidth="1.5" />
          {/* Crosshairs */}
          <line x1="58" y1="50" x2="102" y2="50" strokeWidth="0.8" strokeDasharray="4 2" stroke="#3E6BE0" />
          <line x1="80" y1="28" x2="80" y2="72" strokeWidth="0.8" strokeDasharray="4 2" stroke="#3E6BE0" />
          {/* 4 Corner Holes */}
          <circle cx="52" cy="22" r="4" strokeWidth="1.2" />
          <circle cx="108" cy="22" r="4" strokeWidth="1.2" />
          <circle cx="52" cy="78" r="4" strokeWidth="1.2" />
          <circle cx="108" cy="78" r="4" strokeWidth="1.2" />
          {/* Callout leader */}
          <line x1="94" y1="38" x2="118" y2="20" strokeWidth="0.8" stroke="#3E6BE0" />
          <line x1="118" y1="20" x2="135" y2="20" strokeWidth="0.8" stroke="#3E6BE0" />
        </svg>
      );

    case "probe":
      return (
        <svg viewBox="0 0 160 100" className="w-[130px] h-[80px]" fill="none" stroke="#101418">
          {/* Base Block with hatching */}
          <rect x="20" y="26" width="38" height="48" strokeWidth="1.5" />
          <line x1="24" y1="26" x2="48" y2="50" strokeWidth="0.7" stroke="#3E6BE0" opacity="0.6" />
          <line x1="24" y1="46" x2="52" y2="74" strokeWidth="0.7" stroke="#3E6BE0" opacity="0.6" />
          {/* Long Pin Shaft */}
          <rect x="58" y="42" width="70" height="16" strokeWidth="1.4" />
          {/* Conical 40° Tip */}
          <polygon points="128,42 144,50 128,58" strokeWidth="1.4" fill="none" />
          {/* Centerline */}
          <line x1="15" y1="50" x2="148" y2="50" strokeWidth="0.8" strokeDasharray="6 2 2 2" stroke="#3E6BE0" />
          {/* Extension line */}
          <line x1="58" y1="36" x2="128" y2="36" strokeWidth="0.7" stroke="#101418" />
        </svg>
      );

    case "bom":
      return (
        <svg viewBox="0 0 160 100" className="w-[130px] h-[80px]" fill="none" stroke="#101418">
          {/* Table Outline */}
          <rect x="18" y="15" width="124" height="70" rx="3" strokeWidth="1.4" />
          {/* Header Row */}
          <rect x="18" y="15" width="124" height="15" fill="#E8EEFC" strokeWidth="1.2" />
          <line x1="42" y1="15" x2="42" y2="85" strokeWidth="0.8" />
          <line x1="102" y1="15" x2="102" y2="85" strokeWidth="0.8" />
          {/* Row 1 */}
          <line x1="18" y1="30" x2="142" y2="30" strokeWidth="0.8" />
          {/* Row 2 (Red Highlight Discrepancy) */}
          <rect x="18.5" y="43" width="123" height="14" fill="#D92D20" fillOpacity="0.15" stroke="#D92D20" strokeWidth="1" />
          {/* Row 3 */}
          <line x1="18" y1="57" x2="142" y2="57" strokeWidth="0.8" />
          {/* Row 4 */}
          <line x1="18" y1="71" x2="142" y2="71" strokeWidth="0.8" />
        </svg>
      );

    case "blank":
    default:
      return (
        <svg viewBox="0 0 160 100" className="w-[130px] h-[80px]" fill="none" stroke="#101418">
          <rect x="30" y="15" width="100" height="70" rx="6" strokeWidth="1.2" strokeDasharray="4 3" stroke="#101418" opacity="0.6" />
          <line x1="80" y1="40" x2="80" y2="60" strokeWidth="1.8" strokeLinecap="round" stroke="#1E43D8" />
          <line x1="70" y1="50" x2="90" y2="50" strokeWidth="1.8" strokeLinecap="round" stroke="#1E43D8" />
        </svg>
      );
  }
}
