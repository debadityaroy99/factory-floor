/**
 * Structured logger for Manufy Architect Mode.
 * Outputs machine-parseable JSON logs suitable for Cloud Logging and local terminal debugging.
 */

export interface LogContext {
  requestId?: string;
  runId?: string;
  stageId?: number;
  stageName?: string;
  service?: "vertexai" | "storage" | "firestore" | "pipeline";
  model?: string;
  latencyMs?: number;
  status?: string;
  fallbackUsed?: boolean;
  fallbackReason?: string;
  [key: string]: unknown;
}

export function logInfo(message: string, context?: LogContext): void {
  writeLog("INFO", message, context);
}

export function logWarn(message: string, context?: LogContext): void {
  writeLog("WARN", message, context);
}

export function logError(message: string, error?: unknown, context?: LogContext): void {
  const errContext: LogContext = { ...context };
  if (error instanceof Error) {
    errContext.errorName = error.name;
    errContext.errorMessage = error.message;
    if (process.env.NODE_ENV !== "production") {
      errContext.stack = error.stack;
    }
  } else if (error) {
    errContext.error = String(error);
  }
  writeLog("ERROR", message, errContext);
}

function writeLog(level: "INFO" | "WARN" | "ERROR", message: string, context?: LogContext): void {
  const entry = {
    timestamp: new Date().toISOString(),
    severity: level,
    message,
    ...context,
  };

  // In production / Cloud Run, emit single-line JSON for Cloud Logging ingestion
  if (process.env.NODE_ENV === "production") {
    console.log(JSON.stringify(entry));
  } else {
    const ctxStr = context && Object.keys(context).length > 0 ? ` ${JSON.stringify(context)}` : "";
    if (level === "ERROR") {
      console.error(`[${level}] ${message}${ctxStr}`);
    } else if (level === "WARN") {
      console.warn(`[${level}] ${message}${ctxStr}`);
    } else {
      console.log(`[${level}] ${message}${ctxStr}`);
    }
  }
}

