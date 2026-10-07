type WriteResult = { error: { code?: string } | null };

/** Retrying the same row ID is safe even if the first response was lost. */
export async function deliverAuditRecord(write: () => PromiseLike<WriteResult>): Promise<{ ok: boolean }> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { error } = await write();
      if (!error || error.code === "23505") return { ok: true };
      if (!error.code || !/^(08|53|57|PGRST000|PGRST001|PGRST002|PGRST003)/.test(error.code)) return { ok: false };
    } catch {
      // A lost response may follow a committed insert; reuse the ID on every attempt.
    }
  }
  return { ok: false };
}
