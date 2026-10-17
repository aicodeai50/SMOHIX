type DirectoryUser = { id: string; email?: string };
type DirectoryPage = { data: { users: DirectoryUser[] }; error: unknown };

/** Bounded server-only lookup; a partial directory never means account not found. */
export async function findMemberAccount(
  email: string,
  loadPage: (page: number, perPage: number) => Promise<DirectoryPage>,
): Promise<{ userId: string | null; complete: boolean }> {
  const normalized = email.trim().toLowerCase();
  for (let page = 1; page <= 10; page++) {
    const result = await loadPage(page, 200);
    if (result.error) return { userId: null, complete: false };
    const match = result.data.users.find((user) => user.email?.toLowerCase() === normalized);
    if (match) return { userId: match.id, complete: true };
    if (result.data.users.length < 200) return { userId: null, complete: true };
  }
  return { userId: null, complete: false };
}
