type LogLevel = "debug" | "info" | "warn" | "error";

type LogFields = Record<string, unknown>;

function shouldLog(level: LogLevel): boolean {
  if (level === "debug") {
    return process.env.ZENTRO_LOG_LEVEL === "debug";
  }
  return true;
}

function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
    };
  }
  return { message: String(error) };
}

export function logEvent(level: LogLevel, event: string, fields?: LogFields): void {
  if (!shouldLog(level)) {
    return;
  }

  const payload = {
    ts: new Date().toISOString(),
    level,
    event,
    service: "zentro-web",
    ...fields,
  };

  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export async function captureException(
  error: unknown,
  fields?: LogFields,
): Promise<void> {
  logEvent("error", "exception", {
    error: serializeError(error),
    ...fields,
  });

  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) {
    return;
  }

  try {
    const url = new URL(dsn);
    const projectId = url.pathname.replace(/^\/+/, "");
    if (!projectId) return;
    const endpoint = `${url.protocol}//${url.host}/api/${projectId}/store/`;
    await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sentry-Auth": [
          "Sentry sentry_version=7",
          `sentry_client=zentro-web/0.1`,
          `sentry_key=${url.username}`,
        ].join(", "),
      },
      body: JSON.stringify({
        event_id: crypto.randomUUID().replace(/-/g, ""),
        timestamp: new Date().toISOString(),
        platform: "javascript",
        logger: "zentro-web",
        level: "error",
        message: error instanceof Error ? error.message : String(error),
        extra: fields,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(2000),
    });
  } catch {
    // Observability must not break request handling.
  }
}
