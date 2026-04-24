export type PlaybookRow = {
  id: string;
  name: string;
  env: "staging" | "production";
  risk: "low" | "high";
  lastRun: string;
};

export const PLAYBOOKS: PlaybookRow[] = [
  {
    id: "pb-restart-workers",
    name: "Restart stuck workers",
    env: "staging",
    risk: "low",
    lastRun: "—",
  },
  {
    id: "pb-scale-api",
    name: "Scale API tier",
    env: "production",
    risk: "high",
    lastRun: "—",
  },
  {
    id: "pb-cache-flush",
    name: "Flush edge cache slice",
    env: "production",
    risk: "low",
    lastRun: "—",
  },
];

export function getPlaybookById(id: string): PlaybookRow | null {
  return PLAYBOOKS.find((p) => p.id === id) ?? null;
}
