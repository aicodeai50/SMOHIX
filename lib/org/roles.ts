export const ORG_ROLES = [
  "owner",
  "admin",
  "operator",
  "approver",
  "security_reviewer",
  "viewer",
  "auditor",
] as const;

export type OrgRole = (typeof ORG_ROLES)[number];

export const APPROVAL_DECIDER_ROLES: OrgRole[] = [
  "owner",
  "admin",
  "approver",
  "security_reviewer",
];

export const POLICY_REVIEWER_ROLES: OrgRole[] = ["owner", "admin", "security_reviewer"];

export const MEMBER_ADMIN_ROLES: OrgRole[] = ["owner", "admin"];

export const APPROVAL_CREATOR_ROLES: OrgRole[] = ["owner", "admin", "operator"];

export function isOrgRole(value: string): value is OrgRole {
  return (ORG_ROLES as readonly string[]).includes(value);
}

/** Delegated approvers decide pending items; security reviewers only high-risk (70+). */
export function canDecideApproval(role: OrgRole, riskScore: number): boolean {
  if (role === "owner" || role === "admin" || role === "approver") return true;
  if (role === "security_reviewer") return riskScore >= 70;
  return false;
}

export function canReviewPolicy(role: OrgRole): boolean {
  return POLICY_REVIEWER_ROLES.includes(role);
}

export function canCreateApprovalRequest(role: OrgRole): boolean {
  return APPROVAL_CREATOR_ROLES.includes(role);
}

export function canManageMembers(role: OrgRole): boolean {
  return MEMBER_ADMIN_ROLES.includes(role);
}

/** External auditors use read-only compliance workspace only. */
export function isReadOnlyAuditorRole(role: OrgRole): boolean {
  return role === "auditor";
}

export function roleLabel(role: OrgRole): string {
  switch (role) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin";
    case "operator":
      return "Operator";
    case "approver":
      return "Approver";
    case "security_reviewer":
      return "Security reviewer";
    case "viewer":
      return "Viewer";
    case "auditor":
      return "Auditor (read-only)";
    default:
      return role;
  }
}
