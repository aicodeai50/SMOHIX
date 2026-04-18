/** Relative time for incident lists (ISO or parseable date string). */
export function formatIncidentRelative(updatedAt: string): string {
  const t = new Date(updatedAt).getTime();
  if (Number.isNaN(t)) return updatedAt;
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  return new Date(updatedAt).toLocaleDateString();
}
