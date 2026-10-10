/**
 * Pipeline Runs Repository for Manufy Architect Mode.
 *
 * Persists and retrieves pipeline execution records, stage outputs,
 * Cloud Storage artifact references, and structured logs to Firestore Native.
 */

import { config } from "../config";
import { getFirestoreClient } from "../gcp/firestore";
import { logError, logInfo } from "../logger";
import { PipelineArtifact, PipelineRun, RunStatus, StageExecutionOutput, StructuredLogEntry } from "../types";

const COLLECTION_NAME = "pipeline_runs";

// In-memory cache used strictly in mock/dev mode
const localRunsCache = new Map<string, PipelineRun>([
  [
    "run-1",
    {
      id: "run-1",
      name: "clevis",
      fileName: "clevis.step",
      fileType: ".step",
      fileSizeBytes: 296960,
      contentType: "application/octet-stream",
      sourceStorageUri: "gs://factory-floor-cad-drawings/runs/run-1/source/clevis.step",
      timestamp: "Sep 26, 03:57 PM",
      createdAt: Date.now() - 3600000,
      updatedAt: Date.now(),
      currentStage: 6,
      stagesCompleted: "6/8 stages",
      status: "running",
      stageOutputs: {},
      logs: [],
    },
  ],
  [
    "run-2",
    {
      id: "run-2",
      name: "clevis",
      fileName: "clevis.step",
      fileType: ".step",
      fileSizeBytes: 296960,
      contentType: "application/octet-stream",
      sourceStorageUri: "gs://factory-floor-cad-drawings/runs/run-2/source/clevis.step",
      timestamp: "Sep 26, 10:54 AM",
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 86400000,
      currentStage: 8,
      stagesCompleted: "8/8 stages",
      status: "success",
      stageOutputs: {},
      logs: [],
    },
  ],
  [
    "run-3",
    {
      id: "run-3",
      name: "clevis",
      fileName: "clevis.step",
      fileType: ".step",
      fileSizeBytes: 296960,
      contentType: "application/octet-stream",
      sourceStorageUri: "gs://factory-floor-cad-drawings/runs/run-3/source/clevis.step",
      timestamp: "Sep 26, 10:22 AM",
      createdAt: Date.now() - 90000000,
      updatedAt: Date.now() - 90000000,
      currentStage: 4,
      stagesCompleted: "4/8 stages",
      status: "warning",
      stageOutputs: {},
      logs: [],
    },
  ],
  [
    "run-4",
    {
      id: "run-4",
      name: "SHAFT_ASSEMBLY",
      fileName: "shaft_assembly.step",
      fileType: ".step",
      fileSizeBytes: 1204000,
      contentType: "application/octet-stream",
      sourceStorageUri: "gs://factory-floor-cad-drawings/runs/run-4/source/shaft_assembly.step",
      timestamp: "Sep 26, 04:14 AM",
      createdAt: Date.now() - 110000000,
      updatedAt: Date.now() - 110000000,
      currentStage: 8,
      stagesCompleted: "Assembly",
      status: "success",
      isAssembly: true,
      stageOutputs: {},
      logs: [],
    },
  ],
]);

export async function createRunRecord(run: PipelineRun): Promise<PipelineRun> {
  const db = getFirestoreClient();

  if (db) {
    try {
      await db.collection(COLLECTION_NAME).doc(run.id).set(run);
      logInfo(`Pipeline run created in Firestore`, { service: "firestore", runId: run.id });
      return run;
    } catch (err) {
      logError(`Failed to persist pipeline run '${run.id}' to Firestore`, err, {
        service: "firestore",
        runId: run.id,
      });

      // Strict mode: Do NOT silently succeed with in-memory map if live mode is configured
      if (!config.useMockServices) {
        throw new Error(
          `Firestore persistence error for run '${run.id}': ${
            err instanceof Error ? err.message : String(err)
          }. Ensure Firestore API is enabled in project '${config.projectId}'.`
        );
      }
    }
  }

  // Fallback to local memory cache if mock mode is configured
  localRunsCache.set(run.id, run);
  return run;
}

export async function getRunRecord(id: string): Promise<PipelineRun | null> {
  const db = getFirestoreClient();

  if (db) {
    try {
      const snap = await db.collection(COLLECTION_NAME).doc(id).get();
      if (snap.exists) {
        return snap.data() as PipelineRun;
      }
      return null;
    } catch (err) {
      logError(`Failed to fetch run '${id}' from Firestore`, err, { service: "firestore", runId: id });
      if (!config.useMockServices) {
        throw new Error(
          `Firestore query error for run '${id}': ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
    }
  }

  return localRunsCache.get(id) || null;
}

export async function listRunRecords(limitCount = 20): Promise<PipelineRun[]> {
  const db = getFirestoreClient();

  if (db) {
    try {
      const snap = await db
        .collection(COLLECTION_NAME)
        .orderBy("createdAt", "desc")
        .limit(limitCount)
        .get();

      if (!snap.empty) {
        return snap.docs.map((doc) => doc.data() as PipelineRun);
      }
      return [];
    } catch (err) {
      logError("Failed to list pipeline runs from Firestore", err, { service: "firestore" });
      if (!config.useMockServices) {
        throw new Error(
          `Firestore list error: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
    }
  }

  // Fallback to local memory cache in mock mode
  return Array.from(localRunsCache.values())
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limitCount);
}

export async function updateRunStageRecord(
  id: string,
  updates: {
    currentStage?: number;
    stagesCompleted?: string;
    status?: RunStatus;
    stageOutputKey?: keyof StageExecutionOutput;
    stageOutputValue?: StageExecutionOutput[keyof StageExecutionOutput];
    newArtifact?: PipelineArtifact;
    logEntry?: StructuredLogEntry;
    errorMessage?: string;
  }
): Promise<PipelineRun | null> {
  const existing = await getRunRecord(id);
  if (!existing) return null;

  existing.updatedAt = Date.now();
  if (updates.currentStage !== undefined) existing.currentStage = updates.currentStage;
  if (updates.stagesCompleted !== undefined) existing.stagesCompleted = updates.stagesCompleted;
  if (updates.status !== undefined) existing.status = updates.status;
  if (updates.errorMessage !== undefined) existing.errorMessage = updates.errorMessage;

  if (updates.stageOutputKey && updates.stageOutputValue !== undefined) {
    existing.stageOutputs = {
      ...existing.stageOutputs,
      [updates.stageOutputKey]: updates.stageOutputValue,
    };
  }

  if (updates.newArtifact) {
    existing.artifacts = [...(existing.artifacts || []), updates.newArtifact];
  }

  if (updates.logEntry) {
    existing.logs = [...(existing.logs || []), updates.logEntry];
  }

  const db = getFirestoreClient();
  if (db) {
    try {
      await db.collection(COLLECTION_NAME).doc(id).set(existing, { merge: true });
      return existing;
    } catch (err) {
      logError(`Failed to update run '${id}' in Firestore`, err, { service: "firestore", runId: id });
      if (!config.useMockServices) {
        throw new Error(
          `Firestore update error for run '${id}': ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
    }
  }

  localRunsCache.set(id, existing);
  return existing;
}

