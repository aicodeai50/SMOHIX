/** Public introductions only; these projects are not verified production workspaces. */
export const FAMILY_PROJECTS = [
  {
    slug: "labs",
    id: "smohix-labs",
    name: "Smohix Labs",
    purpose: "A home for research and emerging Smohix ideas.",
    description: "A planned research home for experiments and prototypes in the Smohix family. Existing work includes the Memory Pendant simulator and experimental Assistant surfaces. Labs keeps research distinct from production products.",
    status: "planned" as const,
    limitations: "A dedicated Labs workspace is planned. Memory Pendant is an experimental prototype, available for research rather than clinical use.",
    next: "Define each experiment's scope, access requirements and acceptance criteria before offering it to pilot users.",
  },
] as const;
