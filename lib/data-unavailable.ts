import { logEvent } from "@/lib/observability/logger";

/** Keep database diagnostics on the server and distinguish failed queries from empty records. */
export function dataUnavailable(area: string, error?: unknown): never {
  logEvent("error", "workspace.data_unavailable", {
    area, code: error && typeof error === "object" && "code" in error ? String(error.code) : "unknown",
  });
  throw new Error("Workspace data is temporarily unavailable. Please try again.");
}
