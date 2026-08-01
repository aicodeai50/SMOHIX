import { clientIpFromRequest, takeToken } from "@/lib/rate-limit/memory";

import { hashIdentifier } from "./leads";

const IP_LIMIT = 5;
const IP_WINDOW_MS = 60 * 60 * 1000;
const EMAIL_LIMIT = 3;
const EMAIL_WINDOW_MS = 60 * 60 * 1000;

export async function enforceContactRateLimits(
  request: Request,
  email: string,
): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  const ip = clientIpFromRequest(request);
  const ipKey = `contact:ip:${hashIdentifier(ip)}`;
  const emailKey = `contact:email:${hashIdentifier(email.toLowerCase())}`;

  const ipRl = await takeToken(ipKey, IP_LIMIT, IP_WINDOW_MS);
  if (!ipRl.ok) {
    return { ok: false, retryAfterSec: ipRl.retryAfterSec };
  }

  const emailRl = await takeToken(emailKey, EMAIL_LIMIT, EMAIL_WINDOW_MS);
  if (!emailRl.ok) {
    return { ok: false, retryAfterSec: emailRl.retryAfterSec };
  }

  return { ok: true };
}
