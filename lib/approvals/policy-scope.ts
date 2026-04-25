export type BlastRadiusScope = "service" | "cluster" | "region" | "global";

export function hasMaxBlastToken(notes: string | null | undefined): boolean {
  if (!notes) return false;
  return /max[-_\s]?blast\s*:/i.test(notes);
}

export function parseMaxBlastScope(notes: string | null | undefined): BlastRadiusScope | null {
  if (!notes) return null;
  const match = notes
    .toLowerCase()
    .match(/max[-_\s]?blast\s*:\s*(service|cluster|region|global)/);
  if (!match?.[1]) return null;
  return match[1] as BlastRadiusScope;
}
