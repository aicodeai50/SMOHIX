import { orgScopeOrFilter } from "@/lib/org/scope";

/** Apply org + legacy personal scope to a Supabase query builder. */
export function applyUserOrOrgScope<T extends { or: (filter: string) => T; eq: (column: string, value: string) => T }>(
  query: T,
  userId: string,
  orgId?: string | null,
  userColumn = "user_id",
): T {
  const filter = orgScopeOrFilter(userId, orgId);
  if (filter) return query.or(filter);
  return query.eq(userColumn, userId);
}
