/**
 * Centralized, validated environment configuration for Manufy.
 * Configured specifically for Google Cloud project builder-cup (asia-south1).
 */

export interface AppConfig {
  projectId: string;
  region: string;
  vertexModel: string;
  storageBucket: string;
  firestoreDatabaseId: string;
  isProduction: boolean;
  useMockServices: boolean;
  autoCreateBucket: boolean;
  maxUploadSizeBytes: number;
}

export const config: AppConfig = {
  projectId:
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCP_PROJECT_ID ||
    process.env.GCLOUD_PROJECT ||
    "builder-cup",
  region:
    process.env.GOOGLE_CLOUD_REGION ||
    process.env.GCP_REGION ||
    "asia-south1",
  vertexModel: process.env.VERTEX_AI_MODEL || "gemini-3.8-flash",
  storageBucket: process.env.GCS_BUCKET_NAME || "factory-floor-cad-drawings",
  firestoreDatabaseId: process.env.FIRESTORE_DATABASE_ID || "(default)",
  isProduction: process.env.NODE_ENV === "production",
  // Strict mode: Only use mocks if explicitly requested via USE_MOCK_SERVICES=true
  useMockServices: process.env.USE_MOCK_SERVICES === "true",
  autoCreateBucket: process.env.GCS_AUTO_CREATE_BUCKET === "true",
  maxUploadSizeBytes: 50 * 1024 * 1024, // 50 MB
};

