"use client";

import React, { useRef, useState } from "react";
import { PIPELINE_STAGES } from "../mockData";

interface UploadStateProps {
  onStartRun: (filename: string) => void;
}

export function UploadState({ onStartRun }: UploadStateProps) {
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    size: string;
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [runType, setRunType] = useState("Part — one drawing");
  const [stopAfter, setStopAfter] = useState("Run the whole pipeline");
  const [criticalReview, setCriticalReview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSelectSample = () => {
    setAttachedFile({
      name: "clevis.step",
      size: "290 KB",
    });
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile({
        name: file.name,
        size: `${Math.round(file.size / 1024)} KB`,
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setAttachedFile({
        name: file.name,
        size: `${Math.round(file.size / 1024)} KB`,
      });
    } else {
      handleSelectSample();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 sm:px-12 sm:py-10 flex flex-col items-center bg-[#FFFBF0]">
      <div className="w-full max-w-4xl text-left">
        {/* Main Headings */}
        <h1 className="font-display text-2xl sm:text-[30px] font-bold text-[#101418] tracking-tight leading-snug mb-2">
          From STEP to a finished sheet
        </h1>
        <p className="font-sans text-[14px] text-[#3C4356] leading-relaxed max-w-2xl mb-8">
          Upload one part. The pipeline opens it, projects six views, picks the ones a drawing
          needs, then three agents build the feature tree, choose the dimensions and lay out the sheet —
          every step streamed live.
        </p>

        {/* Dropzone Container with Rotated Caveat Decor */}
        <div className="relative w-full">
          {/* Sparse decor: ONE rotated Caveat label near dropzone */}
          <div className="absolute -top-3.5 right-6 sm:right-10 transform -rotate-[3deg] select-none pointer-events-none z-10">
            <span className="font-hand text-lg sm:text-xl font-bold text-[#101418] bg-[#FFFBF0] px-2.5 py-0.5 border border-[#101418] rounded shadow-2xs">
              drop a STEP →
            </span>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`w-full rounded-xl transition-all relative cursor-pointer p-8 sm:p-10 flex flex-col items-center justify-center min-h-[210px] ${
              isDragOver
                ? "border-2 border-solid border-[#1E43D8] bg-[#E8EEFC]"
                : "border-2 border-dashed border-[#1E43D8] bg-[#FFFBF0] hover:bg-[#F9F4E5]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".step,.stp"
              className="hidden"
              onChange={handleFileChange}
            />

            {!attachedFile ? (
              /* Empty Upload Prompt */
              <>
                {/* Cloud Upload Icon inside pale-blue circle with 1.5px ink border */}
                <div className="w-12 h-12 rounded-full bg-[#E8EEFC] border-[1.5px] border-[#101418] text-[#1E43D8] flex items-center justify-center mb-3 shadow-2xs">
                  <svg className="w-6 h-6 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>

                <div className="font-sans text-[15px] font-semibold text-[#101418] mb-1">
                  Drop a STEP file here, or click to browse
                </div>
                <div className="font-mono text-xs text-[#101418]/60">
                  .step or .stp · one part per run
                </div>

                {/* Sample Quick-Select Hint */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectSample();
                  }}
                  className="mt-3 font-mono text-[11px] text-[#1E43D8] hover:underline cursor-pointer"
                >
                  Or click to test with sample "clevis.step" (290 KB)
                </button>

                {/* Disabled Start Run Button (Bottom-Right) */}
                <div className="w-full flex justify-end mt-4">
                  <button
                    disabled
                    className="btn-royal text-xs px-4 py-2 rounded-lg flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                    <span>Start run</span>
                  </button>
                </div>
              </>
            ) : (
              /* Attached File Chip View */
              <div className="w-full flex flex-col items-center">
                <div className="flex items-center gap-2 bg-[#FFFBF0] border-[1.5px] border-[#101418] px-4 py-2 rounded-lg shadow-hard-xs text-xs font-mono font-medium text-[#101418] mb-4">
                  <svg className="w-4 h-4 text-[#1E43D8] stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>{attachedFile.name} · {attachedFile.size} · drop or click to replace</span>
                </div>

                {/* Action Buttons Row */}
                <div className="w-full flex items-center justify-between mt-2 pt-2">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="btn-ivory text-xs px-3 py-1.5 rounded-lg cursor-pointer font-sans font-medium text-[#101418] hover:text-[#FF6B2C]"
                  >
                    × Clear
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartRun(attachedFile.name);
                    }}
                    className="btn-royal text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer font-semibold"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                    <span>Start run</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls Row Under Dropzone */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border-[1.5px] border-[#101418] bg-[#FFFBF0] p-3 shadow-hard-xs">
            <label className="block font-mono text-[10px] font-semibold text-[#101418]/70 uppercase tracking-wider mb-1">
              Run type
            </label>
            <select
              value={runType}
              onChange={(e) => setRunType(e.target.value)}
              className="w-full font-sans text-xs font-medium text-[#101418] bg-transparent outline-none cursor-pointer"
            >
              <option value="Part — one drawing">Part — one drawing</option>
              <option value="Assembly — multi-sheet">Assembly — multi-sheet</option>
            </select>
          </div>

          <div className="rounded-lg border-[1.5px] border-[#101418] bg-[#FFFBF0] p-3 shadow-hard-xs">
            <label className="block font-mono text-[10px] font-semibold text-[#101418]/70 uppercase tracking-wider mb-1">
              Stop after
            </label>
            <select
              value={stopAfter}
              onChange={(e) => setStopAfter(e.target.value)}
              className="w-full font-sans text-xs font-medium text-[#101418] bg-transparent outline-none cursor-pointer"
            >
              <option value="Run the whole pipeline">Run the whole pipeline</option>
              <option value="Step 5 — View selection">Step 5 — View selection</option>
              <option value="Step 7 — Dimension set">Step 7 — Dimension set</option>
            </select>
          </div>
        </div>

        {/* Checkbox: Critical interfaces */}
        <div className="mt-3 flex items-center gap-2">
          <input
            id="critical-interfaces"
            type="checkbox"
            checked={criticalReview}
            onChange={(e) => setCriticalReview(e.target.checked)}
            className="w-4 h-4 accent-[#1E43D8] rounded border-[1.5px] border-[#101418] cursor-pointer"
          />
          <label
            htmlFor="critical-interfaces"
            className="font-sans text-xs font-medium text-[#101418] cursor-pointer select-none"
          >
            Critical interfaces (review step)
          </label>
        </div>

        {/* PIPELINE Strip (8 steps as numbered ink squares with dashed connectors) */}
        <div className="mt-8 pt-6 border-t-[1.5px] border-[#101418]/20">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[#101418]/70 mb-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-[#FF6B2C] border border-[#101418] inline-block shrink-0" />
            <span>PIPELINE</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-xs">
            {PIPELINE_STAGES.map((step, idx) => (
              <React.Fragment key={step.id}>
                <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <span className="w-5 h-5 rounded-[3px] bg-[#FFFBF0] border-[1.5px] border-[#101418] text-[#101418] text-[10px] font-mono font-bold flex items-center justify-center shadow-2xs">
                    {step.id}
                  </span>
                  <span className="font-mono text-[11px] font-medium text-[#101418]">
                    {step.name}
                  </span>
                </div>
                {idx < PIPELINE_STAGES.length - 1 && (
                  <span className="w-3 border-t border-dashed border-[#101418]/40 inline-block select-none" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
