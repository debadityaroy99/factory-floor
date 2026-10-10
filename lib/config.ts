/**
 * Centralized, validated environment and Google Cloud configuration.
 *
 * Uses Application Default Credentials (ADC) and standard GCP environment variables.
 * Sensitive credentials or service account keys are never hardcoded.
 */

export interface AppConfig {
  projectId: string;
  region: string;
  vertexModel: string;
  storageBucket: string;
  firestoreDatabaseId: string;
  bigqueryDataset: string;
  isProduction: boolean;
  useMockGcp: boolean;
  maxUploadSizeBytes: number;
}

export const config: AppConfig = {
  projectId:
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCP_PROJECT_ID ||
    process.env.GCLOUD_PROJECT ||
    "factory-floor-dev",
  region: process.env.GOOGLE_CLOUD_REGION || process.env.GCP_REGION || "us-central1",
  vertexModel: process.env.VERTEX_AI_MODEL || "gemini-2.0-flash",
  storageBucket: process.env.GCS_BUCKET_NAME || "factory-floor-cad-drawings",
  firestoreDatabaseId: process.env.FIRESTORE_DATABASE_ID || "(default)",
  bigqueryDataset: process.env.BIGQUERY_DATASET || "factory_floor_analytics",
  isProduction: process.env.NODE_ENV === "production",
  // In development or when GCP credentials are not injected, use graceful fallback
  useMockGcp:
    process.env.USE_MOCK_SERVICES === "true" ||
    (!process.env.GOOGLE_APPLICATION_CREDENTIALS &&
      !process.env.K_SERVICE && // Cloud Run standard service env
      !process.env.GOOGLE_CLOUD_PROJECT),
  maxUploadSizeBytes: 50 * 1024 * 1024, // 50 MB
};

