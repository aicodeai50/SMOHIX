export type ApprovalStatus = "pending" | "approved" | "denied";

export type ApprovalRow = {
  id: string;
  action: string;
  requestedBy: string;
  policy: string;
  status: ApprovalStatus;
};

export type ApprovalsListResult = {
  source: "database" | "demo";
  pending: ApprovalRow[];
  /** Completed decisions (newest first). */
  recent: ApprovalRow[];
};
