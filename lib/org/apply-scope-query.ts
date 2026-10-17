import { orgScopeOrFilter } from "./scope";

/** Apply org + legacy personal scope to a Supabase query builder. */
export function applyUserOrOrgScope<T extends { or: (filter: string) => unknown; eq: (column: string, value: string) => unknown; is: (column: string, value: null) => unknown }>(
  query: T,
  userId: string,
  orgId?: string | null,
  userColumn = "user_id",
): T {
  const filter = orgScopeOrFilter(userId, orgId);
  if (filter) return query.or(filter) as T;
  return (query.eq(userColumn, userId) as T).is("org_id", null) as T;
}
