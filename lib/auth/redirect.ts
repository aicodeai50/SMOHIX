/** Prevent open redirects — only same-origin relative paths. */
export function safeNextPath(next: string | null | undefined): string {
  if (!next) return "/copilot";
  const t = next.trim();
  if (!t.startsWith("/") || t.startsWith("//") || t.includes(":")) {
    return "/copilot";
  }
  return t;
}
