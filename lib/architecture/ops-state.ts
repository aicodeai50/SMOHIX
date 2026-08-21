import type { StateBeaconTone } from "@/components/architecture/StateBeacon";
import type { IncidentSeverity, IncidentStatus } from "@/lib/incidents/types";
import type { ServiceBurnState } from "@/lib/services/slo";

/** Map real stored states → Living Architecture beacon tones. No invented states. */

export function burnStateBeacon(state: ServiceBurnState): { label: string; tone: StateBeaconTone } {
  if (state === "critical") return { label: "Critical burn", tone: "critical" };
  if (state === "warning") return { label: "Warning burn", tone: "attention" };
  return { label: "Healthy burn", tone: "verified" };
}

export function incidentSeverityBeacon(
  severity: IncidentSeverity | string,
): { label: string; tone: StateBeaconTone } {
  const s = String(severity).toLowerCase();
  if (s === "critical") return { label: "Critical", tone: "critical" };
  if (s === "high") return { label: "High", tone: "attention" };
  if (s === "medium") return { label: "Medium", tone: "aware" };
  return { label: s ? s.charAt(0).toUpperCase() + s.slice(1) : "Low", tone: "dormant" };
}

export function incidentStatusBeacon(
  status: IncidentStatus | string,
): { label: string; tone: StateBeaconTone } {
  const s = String(status).toLowerCase();
  if (s === "investigating") return { label: "Investigating", tone: "attention" };
  if (s === "mitigated") return { label: "Mitigated", tone: "active" };
  if (s === "monitoring") return { label: "Monitoring", tone: "aware" };
  if (s === "resolved") return { label: "Resolved", tone: "verified" };
  return { label: s ? s.charAt(0).toUpperCase() + s.slice(1) : "Unknown", tone: "dormant" };
}

export function approvalStatusBeacon(
  status: "pending" | "approved" | "denied" | string,
): { label: string; tone: StateBeaconTone } {
  const s = String(status).toLowerCase();
  if (s === "pending") return { label: "Pending", tone: "attention" };
  if (s === "approved") return { label: "Approved", tone: "verified" };
  if (s === "denied") return { label: "Denied", tone: "critical" };
  return { label: s ? s.charAt(0).toUpperCase() + s.slice(1) : "Unknown", tone: "dormant" };
}

export function dryRunOutcomeBeacon(ok: boolean): { label: string; tone: StateBeaconTone } {
  return ok
    ? { label: "Dry-run ok", tone: "verified" }
    : { label: "Dry-run fail", tone: "critical" };
}

export function remediationStepBeacon(
  status: "planned" | "running" | "succeeded" | "failed" | "skipped" | string,
): { label: string; tone: StateBeaconTone } {
  const s = String(status).toLowerCase();
  if (s === "running") return { label: "Running", tone: "processing" };
  if (s === "succeeded") return { label: "Succeeded", tone: "verified" };
  if (s === "failed") return { label: "Failed", tone: "critical" };
  if (s === "skipped") return { label: "Skipped", tone: "dormant" };
  return { label: "Planned", tone: "aware" };
}

export function copilotConnectionBeacon(
  status: "Ready" | "Limited" | string,
): { label: string; tone: StateBeaconTone } {
  if (status === "Ready") return { label: "Ready", tone: "verified" };
  if (status === "Limited") return { label: "Limited", tone: "attention" };
  return { label: String(status), tone: "dormant" };
}
