import type { DecisionBrief } from "@/lib/decision-intelligence";

export type ApprovalStatus = "pending" | "approved" | "denied";

export type ApprovalRow = {
  id: string;
  action: string;
  requestedBy: string;
  policy: string;
  status: ApprovalStatus;
  decisionBrief: DecisionBrief;
  /** Soft-linked incident from brief JSON or policy token (no FK). */
  linkedIncidentId: string | null;
  requesterId: string | null;
  /** Whether the signed-in user may approve/deny this pending item. */
  canDecide: boolean;
  decideBlockedReason: string | null;
};

export type ApprovalsListResult = {
  /** `database` = `approval_requests`; `session` = in-memory per `smohix_dev_tid`. */
  source: "database" | "session";
  pending: ApprovalRow[];
  /** Completed decisions (newest first). */
  recent: ApprovalRow[];
};
