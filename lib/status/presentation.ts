import type { OperationalStatus } from "./types";

export function statusLabel(s: OperationalStatus): string {
  switch (s) {
    case "operational":
      return "Operational";
    case "degraded":
      return "Degraded";
    case "unavailable":
      return "Unavailable";
    case "unknown":
      return "Unknown";
    case "prototype":
      return "Prototype";
    case "planned":
      return "Planned";
  }
}

export function statusToneClass(s: OperationalStatus): string {
  switch (s) {
    case "operational":
      return "border-accent/30 bg-accent-dim text-accent";
    case "degraded":
      return "border-warning/30 bg-warning-dim text-warning";
    case "unavailable":
      return "border-amber-500/30 bg-amber-500/10 text-amber-200";
    case "prototype":
      return "border-warning/30 bg-warning-dim text-warning";
    case "planned":
    case "unknown":
      return "border-white/[0.12] bg-white/[0.03] text-muted";
  }
}
