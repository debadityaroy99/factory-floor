import { Firestore } from "@google-cloud/firestore";
import { config } from "../config";

let firestoreInstance: Firestore | null = null;

export function getFirestoreClient(): Firestore | null {
  if (config.useMockGcp) {
    return null;
  }
  if (!firestoreInstance) {
    try {
      firestoreInstance = new Firestore({
        projectId: config.projectId,
        databaseId: config.firestoreDatabaseId,
      });
    } catch (err) {
      console.warn("[Firestore] Initialization failed, using local in-memory fallback:", err);
      firestoreInstance = null;
    }
  }
  return firestoreInstance;
}

