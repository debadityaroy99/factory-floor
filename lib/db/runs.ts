import { getFirestoreClient } from "../gcp/firestore";
import { PipelineRun, RunStatus, StageExecutionOutput } from "../types";

const COLLECTION_NAME = "pipeline_runs";

// In-memory fallback cache seeded with baseline runs
const localRunsCache = new Map<string, PipelineRun>([
  [
    "run-1",
    {
      id: "run-1",
      name: "clevis",
      fileName: "clevis.step",
      fileType: ".step",
      fileSizeBytes: 296960,
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
  localRunsCache.set(run.id, run);

  if (db) {
    try {
      await db.collection(COLLECTION_NAME).doc(run.id).set(run);
    } catch (err) {
      console.error("[Firestore] Failed to create run document:", err);
    }
  }

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
    } catch (err) {
      console.error("[Firestore] Failed to get run document:", err);
    }
  }

  return localRunsCache.get(id) || null;
}

export async function listRunRecords(): Promise<PipelineRun[]> {
  const db = getFirestoreClient();

  if (db) {
    try {
      const snap = await db
        .collection(COLLECTION_NAME)
        .orderBy("createdAt", "desc")
        .limit(20)
        .get();

      if (!snap.empty) {
        return snap.docs.map((doc) => doc.data() as PipelineRun);
      }
    } catch (err) {
      console.error("[Firestore] Failed to list runs:", err);
    }
  }

  return Array.from(localRunsCache.values()).sort(
    (a, b) => b.createdAt - a.createdAt
  );
}

export async function updateRunStageRecord(
  id: string,
  updates: {
    currentStage?: number;
    stagesCompleted?: string;
    status?: RunStatus;
    stageOutputKey?: keyof StageExecutionOutput;
    stageOutputValue?: StageExecutionOutput[keyof StageExecutionOutput];
    logEntry?: PipelineRun["logs"][0];
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

  if (updates.logEntry) {
    existing.logs = [...(existing.logs || []), updates.logEntry];
  }

  localRunsCache.set(id, existing);

  const db = getFirestoreClient();
  if (db) {
    try {
      await db.collection(COLLECTION_NAME).doc(id).set(existing, { merge: true });
    } catch (err) {
      console.error("[Firestore] Failed to update run document:", err);
    }
  }

  return existing;
}
