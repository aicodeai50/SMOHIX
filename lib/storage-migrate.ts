/**
 * One-time browser storage migrations from Zentro-prefixed keys to Smohix.
 */

export function migrateLocalStorageKey(newKey: string, legacyKey: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const current = localStorage.getItem(newKey);
    if (current !== null) return current;
    const legacy = localStorage.getItem(legacyKey);
    if (legacy === null) return null;
    localStorage.setItem(newKey, legacy);
    localStorage.removeItem(legacyKey);
    return legacy;
  } catch {
    return null;
  }
}
