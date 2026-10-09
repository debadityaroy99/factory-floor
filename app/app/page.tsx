"use client";

import React, { useState } from "react";
import { AppShell } from "./components/AppShell";
import { UploadState } from "./components/UploadState";
import { RunView } from "./components/RunView";

export default function AppPage() {
  const [viewState, setViewState] = useState<"upload" | "running">("upload");
  const [selectedRunId, setSelectedRunId] = useState<string>("run-1");
  const [currentFile, setCurrentFile] = useState<string>("clevis.step");

  const handleStartRun = (file: string) => {
    setCurrentFile(file);
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
      titleLabel={viewState === "upload" ? "New drawing" : `Run ${currentFile}`}
    >
      {viewState === "upload" ? (
        <UploadState onStartRun={handleStartRun} />
      ) : (
        <RunView fileName={currentFile} onCancel={handleCancelRun} />
      )}
    </AppShell>
  );
}
