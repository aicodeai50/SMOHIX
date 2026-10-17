import { canDecideApproval, type OrgRole } from "../org/roles";

/** Shared by the queue and server action; a stale workspace never grants access. */
export function approvalDecisionAccess(input: {
  status: string;
  userId: string;
  ownerId: string | null;
  requesterId: string | null;
  requestOrgId: string | null;
  activeOrgId: string | null;
  role: OrgRole | null;
  riskScore: number;
}): { allowed: boolean; reason: string | null } {
  if (input.status !== "pending") return { allowed: false, reason: "This request has already been decided." };
  if (!input.requestOrgId) {
    return input.ownerId === input.userId
      ? { allowed: true, reason: null }
      : { allowed: false, reason: "This request is outside your workspace." };
  }
  if (input.activeOrgId !== input.requestOrgId || !input.role) {
    return { allowed: false, reason: "Current workspace membership is required." };
  }
  if (!canDecideApproval(input.role, input.riskScore)) {
    return { allowed: false, reason: "Your workspace role cannot decide this request." };
  }
  if (input.requesterId === input.userId) {
    return { allowed: false, reason: "You cannot decide your own organization request." };
  }
  return { allowed: true, reason: null };
}
