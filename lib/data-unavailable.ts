import { logEvent } from "@/lib/observability/logger";

class WorkspaceDataUnavailableError extends Error {
  constructor() {
    super("Workspace data is temporarily unavailable. Please try again.");
    this.name = "WorkspaceDataUnavailableError";
  }
}

/** Keep database diagnostics on the server and distinguish failed queries from empty records. */
export function dataUnavailable(area: string, error?: unknown): never {
  if (error instanceof WorkspaceDataUnavailableError) throw error;
  logEvent("error", "workspace.data_unavailable", {
    area, code: error && typeof error === "object" && "code" in error ? String(error.code) : "unknown",
  });
  throw new WorkspaceDataUnavailableError();
}
