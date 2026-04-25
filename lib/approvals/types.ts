import type { DecisionBrief } from "@/lib/decision-intelligence";

export type ApprovalStatus = "pending" | "approved" | "denied";

export type ApprovalRow = {
  id: string;
  action: string;
  requestedBy: string;
  policy: string;
  status: ApprovalStatus;
  decisionBrief: DecisionBrief;
};

export type ApprovalsListResult = {
  /** `database` = `approval_requests`; `session` = in-memory per `shynvo_dev_tid`. */
  source: "database" | "session";
  pending: ApprovalRow[];
  /** Completed decisions (newest first). */
  recent: ApprovalRow[];
};
