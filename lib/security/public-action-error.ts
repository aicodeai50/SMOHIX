const safeCodes = new Set([
  "unauthorized", "forbidden", "not_found", "invalid_request", "invalid_input",
  "invalid_email", "plan_required", "auth_required", "rate_limited", "too_many_requests",
  "slack_not_configured", "email_not_configured", "already_exists", "request_failed",
]);
/** Only known public codes cross API or redirect boundaries; database errors stay private. */
export function publicActionError(reason: unknown): string {
  return typeof reason === "string" && safeCodes.has(reason) ? reason : "request_failed";
}
