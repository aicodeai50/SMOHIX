export function cleanedPolicyReviewQueryString(search: string): string {
  const next = new URLSearchParams(search);
  next.delete("error");
  next.delete("sid");
  next.delete("notes");
  next.delete("seed_reason");
  next.delete("seed_note");
  return next.toString();
}

export function invalidMaxBlastRedirectPath(input: { suggestionId: string; notes: string }): string {
  const params = new URLSearchParams({
    error: "invalid_max_blast",
    sid: input.suggestionId,
    notes: input.notes,
  });
  return `/governance/policies?${params.toString()}`;
}
