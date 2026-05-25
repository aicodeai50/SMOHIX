/** PostgREST `.or()` filter: org rows + legacy personal rows for this user. */
export function orgScopeOrFilter(userId: string, orgId: string | null | undefined): string | null {
  if (!orgId) return null;
  return `org_id.eq.${orgId},and(org_id.is.null,user_id.eq.${userId})`;
}

export type OrgScopedParams = {
  userId: string;
  orgId?: string | null;
};
