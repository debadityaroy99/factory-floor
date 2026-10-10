/**
 * Google Cloud Firestore Client & Service Layer for Manufy Architect Mode.
 *
 * Configured for Firestore Native mode with database `(default)` in project `builder-cup`.
 * Enforces strict error surfacing when in live mode, avoiding silent in-memory substitution.
 */

import { Firestore } from "@google-cloud/firestore";
import { config } from "../config";
import { logError, logWarn } from "../logger";

let firestoreInstance: Firestore | null = null;

export function getFirestoreClient(): Firestore | null {
  if (config.useMockServices) {
    return null;
  }
  if (!firestoreInstance) {
    try {
      firestoreInstance = new Firestore({
        projectId: config.projectId,
        databaseId: config.firestoreDatabaseId,
        ignoreUndefinedProperties: true,
      });
    } catch (err) {
      logWarn("Firestore client initialization failed", {
        service: "firestore",
        error: String(err),
      });
      firestoreInstance = null;
    }
  }
  return firestoreInstance;
}

/**
 * Health check for Cloud Firestore.
 */
export async function checkFirestoreHealth(): Promise<{
  status: "healthy" | "unavailable" | "not_configured" | "mocked";
  details: string;
  latencyMs?: number;
}> {
  if (config.useMockServices) {
    return { status: "mocked", details: "USE_MOCK_SERVICES=true (In-memory storage active)" };
  }

  const db = getFirestoreClient();
  if (!db) {
    return { status: "unavailable", details: "Firestore client not initialized" };
  }

  const startTime = Date.now();
  try {
    // Attempt to list collections as a probe
    await db.listCollections();
    const latencyMs = Date.now() - startTime;
    return {
      status: "healthy",
      details: `Connected to Firestore database '${config.firestoreDatabaseId}' in ${config.region}`,
      latencyMs,
    };
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    const msg = err instanceof Error ? err.message : String(err);

    if (msg.includes("API has not been used") || msg.includes("disabled") || msg.includes("PERMISSION_DENIED")) {
      return {
        status: "not_configured",
        details:
          `Cloud Firestore API is not enabled or database '${config.firestoreDatabaseId}' is missing in project '${config.projectId}'. ` +
          `Enable it using: gcloud services enable firestore.googleapis.com --project ${config.projectId} && ` +
          `gcloud firestore databases create --location=${config.region} --project ${config.projectId}`,
        latencyMs,
      };
    }

    logError("Firestore health check failed", err, { service: "firestore" });
    return {
      status: "unavailable",
      details: `Firestore check failed: ${msg}`,
      latencyMs,
    };
  }
}

