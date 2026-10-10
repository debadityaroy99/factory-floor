/**
 * Projects Repository for Manufy Architect Mode.
 *
 * Persists and retrieves plant project records, drawing revisions,
 * Cloud Storage artifact references, and review statuses in Google Cloud Firestore Native.
 */

import { config } from "../config";
import { getFirestoreClient } from "../gcp/firestore";
import { uploadProjectFileToStorage, deleteProjectFilesFromStorage } from "../gcp/storage";
import { logError, logInfo } from "../logger";
import {
  ProjectItem,
  ProjectRunRecord,
  DEFAULT_MOCK_PROJECTS,
} from "../types/projects";

export type { ProjectItem, ProjectRunRecord };
export { DEFAULT_MOCK_PROJECTS };

export const PROJECTS_COLLECTION = "projects";

// In-memory cache used as local fallback
const localProjectsCache = new Map<string, ProjectItem>(
  DEFAULT_MOCK_PROJECTS.map((p) => [p.id, p])
);

/**
 * Ensures initial mock projects are seeded to Cloud Firestore if the collection is empty.
 */
export async function seedMockProjectsIfEmpty(): Promise<void> {
  const db = getFirestoreClient();
  if (!db) return;

  try {
    const snap = await db.collection(PROJECTS_COLLECTION).limit(1).get();
    if (!snap.empty) {
      return;
    }

    logInfo("Seeding initial mock projects into Firestore 'projects' collection...", {
      service: "firestore",
      collection: PROJECTS_COLLECTION,
    });

    const batch = db.batch();
    for (const project of DEFAULT_MOCK_PROJECTS) {
      const docRef = db.collection(PROJECTS_COLLECTION).doc(project.id);
      batch.set(docRef, project);
    }
    await batch.commit();

    logInfo("Successfully seeded initial mock projects into Firestore.", {
      service: "firestore",
      count: DEFAULT_MOCK_PROJECTS.length,
    });
  } catch (err) {
    logError("Failed to seed initial projects into Firestore", err, {
      service: "firestore",
    });
  }
}

/**
 * Retrieves all projects from Firestore (or in-memory cache fallback).
 */
export async function listProjectRecords(): Promise<ProjectItem[]> {
  const db = getFirestoreClient();

  if (db) {
    try {
      // Seed if empty
      await seedMockProjectsIfEmpty();

      // Retrieve documents sorted by createdAt desc
      let snap;
      try {
        snap = await db
          .collection(PROJECTS_COLLECTION)
          .orderBy("createdAt", "desc")
          .get();
      } catch {
        // Fallback without index orderBy if index is creating
        snap = await db.collection(PROJECTS_COLLECTION).get();
      }

      if (!snap.empty) {
        const projects = snap.docs.map((doc) => doc.data() as ProjectItem);
        // Sort in memory by createdAt desc
        projects.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        // Update local memory cache with latest Firestore records
        for (const p of projects) {
          localProjectsCache.set(p.id, p);
        }

        return projects;
      }
    } catch (err) {
      logError("Failed to list projects from Firestore", err, { service: "firestore" });
      if (!config.useMockServices) {
        throw new Error(
          `Firestore list error for projects: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
    }
  }

  // Fallback to local memory cache
  const cached = Array.from(localProjectsCache.values());
  cached.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return cached;
}

/**
 * Creates a new project in Firestore and persists its file/manifest to Cloud Storage.
 */
export async function createProjectRecord(params: {
  name: string;
  dwg?: string;
  thumb?: "sheet" | "plate" | "probe" | "bom" | "blank";
  status?: "IN REVIEW" | "ISSUES OPEN" | "RELEASED" | "DRAFT";
  owner?: string;
  initials?: string;
  chipType?: string;
  file?: {
    buffer: Buffer;
    fileName: string;
    contentType: string;
  };
}): Promise<ProjectItem> {
  const timestamp = Date.now();
  const projectId = `proj-${timestamp}`;
  const projectName = params.name.trim() || "Untitled project";
  const owner = params.owner || "deb";
  const initials = params.initials || owner.slice(0, 2).toUpperCase();

  // Determine thumbnail type if not explicitly supplied
  let thumb: "sheet" | "plate" | "probe" | "bom" | "blank" = params.thumb || "blank";
  if (params.chipType === "step") thumb = "sheet";
  else if (params.chipType === "drawing") thumb = "plate";
  else if (params.chipType === "bom") thumb = "bom";

  if (params.file) {
    const ext = params.file.fileName.toLowerCase();
    if (ext.endsWith(".step") || ext.endsWith(".stp")) thumb = "sheet";
    else if (ext.endsWith(".pdf") || ext.endsWith(".png")) thumb = "plate";
    else if (ext.endsWith(".csv") || ext.endsWith(".xlsx")) thumb = "bom";
  }

  // 1. Upload to Cloud Storage
  let storageUri: string = `gs://${config.storageBucket}/projects/${projectId}/source/project.json`;
  let sourceFileName = params.file?.fileName;
  let sourceFileSize = params.file?.buffer.length;

  try {
    if (params.file) {
      const storageResult = await uploadProjectFileToStorage({
        buffer: params.file.buffer,
        fileName: params.file.fileName,
        contentType: params.file.contentType,
        projectId,
      });
      storageUri = storageResult.storageUri;
    } else {
      // Upload metadata manifest to Cloud Storage
      const manifestBuffer = Buffer.from(
        JSON.stringify(
          {
            projectId,
            projectName,
            createdAt: new Date(timestamp).toISOString(),
            chipType: params.chipType || "manual",
            bucket: config.storageBucket,
          },
          null,
          2
        ),
        "utf-8"
      );
      const manifestResult = await uploadProjectFileToStorage({
        buffer: manifestBuffer,
        fileName: "project.json",
        contentType: "application/json",
        projectId,
      });
      storageUri = manifestResult.storageUri;
      sourceFileName = "project.json";
      sourceFileSize = manifestBuffer.length;
    }
  } catch (storageErr) {
    logError(`Cloud Storage upload failed for project ${projectId}`, storageErr, {
      service: "storage",
      projectId,
    });
    // In strict mode without mock services, propagate error
    if (!config.useMockServices) {
      throw storageErr;
    }
  }

  // 2. Build ProjectItem record
  const newProject: ProjectItem = {
    id: projectId,
    name: projectName,
    dwg: params.dwg || "DWG UNTITLED · REV —",
    thumb,
    status: params.status || "DRAFT",
    runs: { autodraft: 0, di: 0, gdt: 0, bom: 0 },
    findings: "NO RUNS YET",
    findingsType: "neutral",
    owner,
    initials,
    updated: "JUST NOW",
    runsList: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    storageUri,
    sourceFileName,
    sourceFileSize,
  };

  // 3. Persist to Firestore
  const db = getFirestoreClient();
  if (db) {
    try {
      await db.collection(PROJECTS_COLLECTION).doc(projectId).set(newProject);
      logInfo(`Project created in Firestore`, {
        service: "firestore",
        projectId,
        name: projectName,
      });
    } catch (dbErr) {
      logError(`Failed to persist project '${projectId}' to Firestore`, dbErr, {
        service: "firestore",
        projectId,
      });
      if (!config.useMockServices) {
        throw new Error(
          `Firestore persistence error for project '${projectId}': ${
            dbErr instanceof Error ? dbErr.message : String(dbErr)
          }`
        );
      }
    }
  }

  // Also cache locally
  localProjectsCache.set(projectId, newProject);

  return newProject;
}

/**
 * Retrieves a single project record by ID.
 */
export async function getProjectRecord(id: string): Promise<ProjectItem | null> {
  const db = getFirestoreClient();

  if (db) {
    try {
      const snap = await db.collection(PROJECTS_COLLECTION).doc(id).get();
      if (snap.exists) {
        return snap.data() as ProjectItem;
      }
      return null;
    } catch (err) {
      logError(`Failed to fetch project '${id}' from Firestore`, err, {
        service: "firestore",
        projectId: id,
      });
      if (!config.useMockServices) {
        throw err;
      }
    }
  }

  return localProjectsCache.get(id) || null;
}

/**
 * Deletes a project record from Firestore and removes its files from Cloud Storage.
 */
export async function deleteProjectRecord(projectId: string): Promise<boolean> {
  // 1. Delete associated files from Cloud Storage
  try {
    await deleteProjectFilesFromStorage(projectId);
  } catch (storageErr) {
    logError(`Storage deletion error for project '${projectId}'`, storageErr, {
      service: "storage",
      projectId,
    });
    if (!config.useMockServices) {
      throw storageErr;
    }
  }

  // 2. Delete document from Cloud Firestore Native
  const db = getFirestoreClient();
  if (db) {
    try {
      await db.collection(PROJECTS_COLLECTION).doc(projectId).delete();
      logInfo(`Project '${projectId}' deleted from Firestore`, {
        service: "firestore",
        projectId,
      });
    } catch (dbErr) {
      logError(`Failed to delete project '${projectId}' from Firestore`, dbErr, {
        service: "firestore",
        projectId,
      });
      if (!config.useMockServices) {
        throw new Error(
          `Firestore deletion error for project '${projectId}': ${
            dbErr instanceof Error ? dbErr.message : String(dbErr)
          }`
        );
      }
    }
  }

  // 3. Remove from in-memory cache
  localProjectsCache.delete(projectId);

  return true;
}

/**
 * Records a completed module run to a project.
 * Persists the run manifest to Cloud Storage and appends the run to the Firestore project document.
 */
export async function addRunToProject(params: {
  projectId: string;
  moduleName: "AUTODRAFT" | "DESIGN INTELLIGENCE" | "GD&T REVIEW" | "BOM CHECK";
  moduleCode: "01-autodraft" | "02-design-intelligence" | "03-gdt-review" | "04-bom-check";
  runTitle: string;
  fileName: string;
  result: string;
  resultType: "error" | "warn" | "clear" | "neutral";
  runId?: string;
  sampleStep?: 1 | 2 | 3;
  isDemo?: boolean;
  details?: Record<string, unknown>;
}): Promise<ProjectItem> {
  const {
    projectId,
    moduleName,
    moduleCode,
    runTitle,
    fileName,
    result,
    resultType,
    runId,
    sampleStep,
    isDemo = false,
    details = {},
  } = params;

  const now = Date.now();
  const dateFormatted = new Date(now)
    .toLocaleDateString("en-US", { month: "short", day: "2-digit" })
    .toUpperCase();

  // 1. Get existing project
  const project = await getProjectRecord(projectId);
  if (!project) {
    throw new Error(`Project with id '${projectId}' not found.`);
  }

  // 2. Upload run report / manifest to Cloud Storage
  let storageUri = `gs://${config.storageBucket}/projects/${projectId}/runs/run-${moduleCode}-${now}.json`;
  try {
    const runManifest = {
      projectId,
      runId: runId || `run-${now}`,
      moduleName,
      moduleCode,
      runTitle,
      fileName,
      result,
      resultType,
      timestamp: now,
      date: dateFormatted,
      details,
    };
    const buffer = Buffer.from(JSON.stringify(runManifest, null, 2), "utf-8");
    const manifestUpload = await uploadProjectFileToStorage({
      buffer,
      fileName: `run-${moduleCode}-${now}.json`,
      contentType: "application/json",
      projectId,
      subFolder: "runs",
    });
    storageUri = manifestUpload.storageUri;
  } catch (storageErr) {
    logError(`Failed to upload run manifest to Cloud Storage for project '${projectId}'`, storageErr, {
      service: "storage",
      projectId,
    });
    if (!config.useMockServices) {
      throw storageErr;
    }
  }

  // 3. Build ProjectRunRecord
  const newRunRecord: ProjectRunRecord = {
    id: runId || `run-${now}`,
    moduleName,
    moduleCode,
    runTitle,
    fileName,
    result,
    resultType,
    date: dateFormatted,
    isDemo,
    sampleStep,
    storageUri,
    runId,
    timestamp: now,
    details,
  };

  // 4. Update project counts and status
  const updatedRuns = {
    autodraft: (project.runs?.autodraft || 0) + (moduleCode === "01-autodraft" ? 1 : 0),
    di: (project.runs?.di || 0) + (moduleCode === "02-design-intelligence" ? 1 : 0),
    gdt: (project.runs?.gdt || 0) + (moduleCode === "03-gdt-review" ? 1 : 0),
    bom: (project.runs?.bom || 0) + (moduleCode === "04-bom-check" ? 1 : 0),
  };

  // Status and findings computation
  let status = project.status;
  let findings = project.findings;
  let findingsType = project.findingsType;

  if (resultType === "error") {
    status = "ISSUES OPEN";
    findings = result;
    findingsType = "issues";
  } else if (resultType === "warn") {
    status = "IN REVIEW";
    findings = result;
    findingsType = "issues";
  } else if (resultType === "clear") {
    if (status === "DRAFT") {
      status = "IN REVIEW";
    }
    findings = result;
    findingsType = "clear";
  }

  const updatedProject: ProjectItem = {
    ...project,
    status,
    runs: updatedRuns,
    findings,
    findingsType,
    updated: "JUST NOW",
    updatedAt: now,
    runsList: [newRunRecord, ...(project.runsList || [])],
  };

  // 5. Persist to Firestore
  const db = getFirestoreClient();
  if (db) {
    try {
      await db.collection(PROJECTS_COLLECTION).doc(projectId).set(updatedProject, { merge: true });
      logInfo(`Run added and project '${projectId}' updated in Firestore`, {
        service: "firestore",
        projectId,
        moduleCode,
      });
    } catch (dbErr) {
      logError(`Failed to update project '${projectId}' with new run in Firestore`, dbErr, {
        service: "firestore",
        projectId,
      });
      if (!config.useMockServices) {
        throw new Error(
          `Firestore run update error for project '${projectId}': ${
            dbErr instanceof Error ? dbErr.message : String(dbErr)
          }`
        );
      }
    }
  }

  // 6. Update local cache
  localProjectsCache.set(projectId, updatedProject);

  return updatedProject;
}
