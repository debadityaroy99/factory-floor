"use client";

import React, { useState } from "react";
import { AppShell } from "../app/components/AppShell";
import { UploadState } from "../app/components/UploadState";
import { RunView } from "../app/components/RunView";

export default function ArchitectPage() {
  const [viewState, setViewState] = useState<"upload" | "running">("upload");
  const [selectedRunId, setSelectedRunId] = useState<string>("run-1");
  const [currentFile, setCurrentFile] = useState<string>("clevis.step");

  const handleStartRun = (file: string, runId?: string) => {
    setCurrentFile(file);
    if (runId) {
      setSelectedRunId(runId);
    }
    setViewState("running");
  };

  const handleCancelRun = () => {
    setViewState("upload");
  };

  const handleNewDrawing = () => {
    setViewState("upload");
  };

  const handleSelectRun = (runId: string) => {
    setSelectedRunId(runId);
    setViewState("running");
  };

  return (
    <AppShell
      onNewDrawing={handleNewDrawing}
      selectedRunId={selectedRunId}
      onSelectRun={handleSelectRun}
      titleLabel={viewState === "upload" ? "Architect Mode" : `Run ${currentFile}`}
    >
      {viewState === "upload" ? (
        <UploadState onStartRun={handleStartRun} />
      ) : (
        <RunView runId={selectedRunId} fileName={currentFile} onCancel={handleCancelRun} />
      )}
    </AppShell>
  );
}

