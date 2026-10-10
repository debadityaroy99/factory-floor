/**
 * Google Cloud Storage Service Layer for Manufy Architect Mode.
 *
 * Stores CAD source files (.step/.stp) and 2D blueprints (.pdf/.png),
 * as well as generated pipeline artifacts and orthographic renders.
 * Configured for bucket `factory-floor-cad-drawings` in region `asia-south1`.
 */

import { Storage } from "@google-cloud/storage";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { config } from "../config";
import { logError, logInfo, logWarn } from "../logger";
import { StoredFileMetadata } from "../types";

let storageClientInstance: Storage | null = null;
let bucketVerified = false;

export function getStorageClient(): Storage | null {
  if (config.useMockServices) {
    return null;
  }
  if (!storageClientInstance) {
    try {
      storageClientInstance = new Storage({
        projectId: config.projectId,
      });
    } catch (err) {
      logWarn("Cloud Storage client initialization failed", {
        service: "storage",
        error: String(err),
      });
      storageClientInstance = null;
    }
  }
  return storageClientInstance;
}

const ALLOWED_EXTENSIONS = new Set([
  ".step",
  ".stp",
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".svg",
  ".dwg",
  ".dxf",
  ".json",
]);

export function validateUploadFile(
  fileName: string,
  fileSizeBytes: number,
  contentType: string
): { valid: boolean; error?: string } {
  if (!fileName || typeof fileName !== "string") {
    return { valid: false, error: "File name is required." };
  }
  if (!contentType || typeof contentType !== "string") {
    return { valid: false, error: "Content type header is required." };
  }

  const ext = path.extname(fileName).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: `File extension '${ext}' is not supported. Allowed: ${Array.from(ALLOWED_EXTENSIONS).join(", ")}`,
    };
  }

  if (fileSizeBytes <= 0) {
    return { valid: false, error: "Uploaded file is empty (0 bytes)." };
  }

  if (fileSizeBytes > config.maxUploadSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds the maximum allowable limit of ${config.maxUploadSizeBytes / (1024 * 1024)}MB.`,
    };
  }

  return { valid: true };
}

/**
 * Ensures the target GCS bucket exists and is accessible.
 * If missing and auto-creation is enabled, attempts creation in `asia-south1`.
 */
export async function ensureBucketExists(client: Storage): Promise<boolean> {
  if (bucketVerified) return true;

  try {
    const bucket = client.bucket(config.storageBucket);
    const [exists] = await bucket.exists();
    if (exists) {
      bucketVerified = true;
      return true;
    }

    // Bucket does not exist
    if (config.autoCreateBucket) {
      logInfo(`GCS bucket '${config.storageBucket}' not found. Attempting creation in ${config.region}...`, {
        service: "storage",
        bucket: config.storageBucket,
        region: config.region,
      });

      await client.createBucket(config.storageBucket, {
        location: config.region,
        standard: true,
      });
      bucketVerified = true;
      logInfo(`GCS bucket '${config.storageBucket}' created successfully.`, { service: "storage" });
      return true;
    }

    throw new Error(
      `Cloud Storage bucket '${config.storageBucket}' does not exist in project '${config.projectId}'. ` +
        `Auto-creation is disabled (GCS_AUTO_CREATE_BUCKET=false). ` +
        `To create the bucket, an administrator should execute: ` +
        `gcloud storage buckets create gs://${config.storageBucket} --project=${config.projectId} --location=${config.region} --uniform-bucket-level-access`
    );
  } catch (err) {
    bucketVerified = false;
    throw err;
  }
}

/**
 * Uploads a file to Google Cloud Storage under a structured path:
 * `runs/{runId}/source/{fileName}` for original files
 * `runs/{runId}/artifacts/stage-{stageId}-{fileName}` for stage artifacts
 */
export async function uploadFileToStorage(params: {
  buffer: Buffer;
  fileName: string;
  contentType: string;
  runId: string;
  category: "source" | "artifact";
  stageId?: number;
}): Promise<StoredFileMetadata> {
  const { buffer, fileName, contentType, runId, category, stageId } = params;

  const validation = validateUploadFile(fileName, buffer.length, contentType);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Prevent path traversal and sanitize filename
  const sanitizedFileName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, "_");
  const prefix =
    category === "artifact" && typeof stageId === "number"
      ? `runs/${runId}/artifacts/stage-${stageId}-${sanitizedFileName}`
      : `runs/${runId}/source/${sanitizedFileName}`;

  const checksum = crypto.createHash("md5").update(buffer).digest("hex");
  const uploadedAt = new Date().toISOString();

  const client = getStorageClient();

  if (client) {
    try {
      await ensureBucketExists(client);

      const bucket = client.bucket(config.storageBucket);
      const file = bucket.file(prefix);

      await file.save(buffer, {
        contentType,
        metadata: {
          cacheControl: "private, max-age=3600",
          metadata: {
            runId,
            category,
            stageId: stageId !== undefined ? String(stageId) : undefined,
            md5Checksum: checksum,
          },
        },
        resumable: false,
      });

      const storageUri = `gs://${config.storageBucket}/${prefix}`;

      // Signed URL for secure frontend preview (1 hour expiry)
      let publicUrl: string | undefined;
      try {
        const [signedUrl] = await file.getSignedUrl({
          version: "v4",
          action: "read",
          expires: Date.now() + 60 * 60 * 1000,
        });
        publicUrl = signedUrl;
      } catch {
        // Signed URL generation may fail in local ADC without service account private key
        publicUrl = `/api/upload/preview?runId=${encodeURIComponent(runId)}&file=${encodeURIComponent(sanitizedFileName)}`;
      }

      logInfo(`File uploaded successfully to Cloud Storage`, {
        service: "storage",
        runId,
        storageUri,
        fileSizeBytes: buffer.length,
      });

      return {
        fileName: sanitizedFileName,
        fileSizeBytes: buffer.length,
        contentType,
        storageUri,
        publicUrl,
        checksum,
        uploadedAt,
        isMock: false,
      };
    } catch (gcpErr) {
      logError(`Upload to Cloud Storage failed for ${prefix}`, gcpErr, {
        service: "storage",
        runId,
        bucket: config.storageBucket,
      });

      // In Strict Mode (useMockServices=false), do NOT silently fall back to local disk!
      if (!config.useMockServices) {
        throw new Error(
          `Failed to persist file '${sanitizedFileName}' to Google Cloud Storage: ${
            gcpErr instanceof Error ? gcpErr.message : String(gcpErr)
          }`
        );
      }
    }
  }

  // Local / Mock Dev Mode Fallback
  logWarn(`Persisting file to local dev storage (mock mode)`, {
    service: "storage",
    runId,
    fileName: sanitizedFileName,
  });

  const localSubdir = category === "artifact" ? "artifacts" : "source";
  const localDir = path.join(process.cwd(), "tmp_uploads", runId, localSubdir);
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
  }
  const localFileName =
    category === "artifact" && typeof stageId === "number"
      ? `stage-${stageId}-${sanitizedFileName}`
      : sanitizedFileName;
  const localFilePath = path.join(localDir, localFileName);
  fs.writeFileSync(localFilePath, buffer);

  return {
    fileName: sanitizedFileName,
    fileSizeBytes: buffer.length,
    contentType,
    storageUri: `file://${localFilePath}`,
    publicUrl: `/api/upload/preview?runId=${encodeURIComponent(runId)}&file=${encodeURIComponent(sanitizedFileName)}`,
    checksum,
    uploadedAt,
    isMock: true,
  };
}

/**
 * Downloads a file buffer from Cloud Storage (or local filesystem in mock mode).
 */
export async function downloadFileFromStorage(storageUri: string): Promise<Buffer> {
  if (storageUri.startsWith("file://")) {
    const filePath = storageUri.replace("file://", "");
    if (!fs.existsSync(filePath)) {
      throw new Error(`Local file not found at ${filePath}`);
    }
    return fs.readFileSync(filePath);
  }

  if (storageUri.startsWith("gs://")) {
    const client = getStorageClient();
    if (!client) {
      throw new Error("Cannot download from gs:// URI without active Google Cloud Storage client.");
    }

    const withoutProtocol = storageUri.replace("gs://", "");
    const firstSlash = withoutProtocol.indexOf("/");
    if (firstSlash === -1) {
      throw new Error(`Malformed GCS URI: ${storageUri}`);
    }

    const bucketName = withoutProtocol.substring(0, firstSlash);
    const objectPath = withoutProtocol.substring(firstSlash + 1);

    const file = client.bucket(bucketName).file(objectPath);
    const [buffer] = await file.download();
    return buffer;
  }

  throw new Error(`Unsupported storage URI format: ${storageUri}. Expected gs:// or file://`);
}

/**
 * Health check for Cloud Storage.
 */
export async function checkStorageHealth(): Promise<{
  status: "healthy" | "unavailable" | "not_configured" | "mocked";
  details: string;
  latencyMs?: number;
}> {
  if (config.useMockServices) {
    return { status: "mocked", details: "USE_MOCK_SERVICES=true (Local disk storage active)" };
  }

  const client = getStorageClient();
  if (!client) {
    return { status: "unavailable", details: "Cloud Storage client not initialized" };
  }

  const startTime = Date.now();
  try {
    const bucket = client.bucket(config.storageBucket);
    const [exists] = await bucket.exists();
    const latencyMs = Date.now() - startTime;

    if (exists) {
      return {
        status: "healthy",
        details: `Bucket 'gs://${config.storageBucket}' exists and is accessible in ${config.region}`,
        latencyMs,
      };
    }

    return {
      status: "not_configured",
      details:
        `Bucket 'gs://${config.storageBucket}' does not exist in project '${config.projectId}'. ` +
        `Create it using: gcloud storage buckets create gs://${config.storageBucket} --project=${config.projectId} --location=${config.region} --uniform-bucket-level-access`,
      latencyMs,
    };
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    return {
      status: "unavailable",
      details: `Cloud Storage check failed: ${err instanceof Error ? err.message : String(err)}`,
      latencyMs,
    };
  }
}

