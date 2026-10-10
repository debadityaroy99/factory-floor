import { NextResponse } from "next/server";
import { config } from "../../../lib/config";
import { checkFirestoreHealth } from "../../../lib/gcp/firestore";
import { checkStorageHealth } from "../../../lib/gcp/storage";
import { checkVertexAiHealth } from "../../../lib/gcp/vertexai";
import { SystemHealthCheck } from "../../../lib/types";

export async function GET() {
  const [vertexAiHealth, storageHealth, firestoreHealth] = await Promise.all([
    checkVertexAiHealth(),
    checkStorageHealth(),
    checkFirestoreHealth(),
  ]);

  const mode = config.useMockServices ? "mock_fallback" : "strict_live";

  const allHealthy =
    vertexAiHealth.status === "healthy" &&
    storageHealth.status === "healthy" &&
    firestoreHealth.status === "healthy";

  const anyUnavailable =
    vertexAiHealth.status === "unavailable" ||
    storageHealth.status === "unavailable" ||
    firestoreHealth.status === "unavailable";

  const status: "ok" | "degraded" | "error" =
    allHealthy || mode === "mock_fallback" ? "ok" : anyUnavailable ? "error" : "degraded";

  const healthCheck: SystemHealthCheck = {
    timestamp: new Date().toISOString(),
    status,
    mode,
    project: config.projectId,
    region: config.region,
    services: {
      vertexAi: vertexAiHealth,
      cloudStorage: storageHealth,
      firestore: firestoreHealth,
    },
  };

  const httpStatus = status === "error" ? 503 : 200;
  return NextResponse.json(healthCheck, { status: httpStatus });
}

