/** Translate known account failures without exposing provider or deployment diagnostics. */
export function publicAuthError(error: unknown): string {
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  switch (code) {
    case "invalid_credentials": return "The email or password is incorrect.";
    case "email_not_confirmed": return "Confirm your email before signing in.";
    case "weak_password": return "Choose a stronger password with at least 8 characters.";
    case "same_password": return "Choose a password different from your current password.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit": return "Too many attempts. Please wait before trying again.";
    case "otp_expired": return "This link has expired. Request a new one.";
    default: return "The account request could not complete. Please try again.";
  }
}
