const keys = new Set(["incidents", "approvals", "billing", "compliance"]);
export function validNotificationPreferences(value: unknown): value is Record<string, boolean> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value) &&
    Object.entries(value).every(([key, item]) => keys.has(key) && typeof item === "boolean"));
}
