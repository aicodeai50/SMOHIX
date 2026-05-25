export type AttestationWorkflowStatus = "pending" | "overdue" | "attested";

export function computeAttestationStatus(input: {
  dueAtIso: string;
  attestedAtIso: string | null;
  now?: Date;
}): AttestationWorkflowStatus {
  if (input.attestedAtIso) return "attested";
  const due = new Date(input.dueAtIso).getTime();
  const now = (input.now ?? new Date()).getTime();
  if (now > due) return "overdue";
  return "pending";
}

export function defaultAttestationDueAt(daysFromNow = 90): string {
  return new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000).toISOString();
}

export function isKnownControlId(controlId: string, knownIds: ReadonlySet<string>): boolean {
  return knownIds.has(controlId);
}
