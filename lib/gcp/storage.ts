import { Storage } from "@google-cloud/storage";
import { config } from "../config";
import fs from "fs";
import path from "path";

// Singleton storage client
let storageClient: Storage | null = null;

function getStorageClient(): Storage | null {
  if (config.useMockGcp) {
    return null;
  }
  if (!storageClient) {
    try {
      storageClient = new Storage({
        projectId: config.projectId,
      });
    } catch (err) {
      console.warn("[GCS] Initializing Cloud Storage client failed, using local fallback:", err);
      storageClient = null;
    }
  }
  return storageClient;
}

export interface UploadResult {
  fileName: string;
  fileSizeBytes: number;
  contentType: string;
  storageUri: string;
  publicUrl?: string;
  isMock: boolean;
}

const ALLOWED_EXTENSIONS = new Set([
  ".step",
  ".stp",
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".svg",
  ".dwg",
  ".dxf",
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
    return { valid: false, error: "Uploaded file is empty." };
  }

  if (fileSizeBytes > config.maxUploadSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds the maximum limit of ${config.maxUploadSizeBytes / (1024 * 1024)}MB.`,
    };
  }

  return { valid: true };
}

/**
 * Uploads a file buffer to Google Cloud Storage (or local dev directory if mock enabled).
 */
export async function uploadToStorage(params: {
  buffer: Buffer;
  fileName: string;
  contentType: string;
  destinationPrefix?: string;
}): Promise<UploadResult> {
  const { buffer, fileName, contentType, destinationPrefix = "uploads" } = params;

  const validation = validateUploadFile(fileName, buffer.length, contentType);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const sanitizedFileName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, "_");
  const timestamp = Date.now();
  const objectPath = `${destinationPrefix}/${timestamp}-${sanitizedFileName}`;

  const client = getStorageClient();

  // If real GCP client available and not mock mode
  if (client) {
    try {
      const bucket = client.bucket(config.storageBucket);
      const file = bucket.file(objectPath);

      await file.save(buffer, {
        contentType,
        metadata: {
          cacheControl: "private, max-age=3600",
        },
        resumable: false,
      });

      const storageUri = `gs://${config.storageBucket}/${objectPath}`;

      // Generate a signed URL valid for 1 hour for secure frontend preview
      let publicUrl: string | undefined;
      try {
        const [signedUrl] = await file.getSignedUrl({
          version: "v4",
          action: "read",
          expires: Date.now() + 60 * 60 * 1000, // 1 hour
        });
        publicUrl = signedUrl;
      } catch (signErr) {
        // In local environments without private key, fallback without signed url
        console.info("[GCS] Signed URL generation skipped:", signErr);
      }

      return {
        fileName: sanitizedFileName,
        fileSizeBytes: buffer.length,
        contentType,
        storageUri,
        publicUrl,
        isMock: false,
      };
    } catch (gcpErr) {
      console.error("[GCS] Upload to Cloud Storage failed, falling back to local:", gcpErr);
    }
  }

  // Local/Dev Fallback
  const localDir = path.join(process.cwd(), "tmp_uploads");
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
  }
  const localFilePath = path.join(localDir, `${timestamp}-${sanitizedFileName}`);
  fs.writeFileSync(localFilePath, buffer);

  return {
    fileName: sanitizedFileName,
    fileSizeBytes: buffer.length,
    contentType,
    storageUri: `file://${localFilePath}`,
    publicUrl: `/api/upload/preview?file=${timestamp}-${sanitizedFileName}`,
    isMock: true,
  };
}
