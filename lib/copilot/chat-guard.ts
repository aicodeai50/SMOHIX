import { NextResponse } from "next/server";

import { clientIpFromRequest, takeToken } from "@/lib/rate-limit/memory";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const CHAT_RATE_LIMIT = 60;
const CHAT_RATE_WINDOW_MS = 60_000;
const CHAT_CLOUD_RATE_LIMIT = 30;

export async function enforceCopilotChatAccess(
  req: Request,
  options: { cloudModelEnabled: boolean },
): Promise<NextResponse | null> {
  const ip = clientIpFromRequest(req);

  if (options.cloudModelEnabled && !hasSupabaseAuth()) {
    return NextResponse.json(
      {
        error: "auth_required",
        message: "Cloud Copilot requires Supabase auth in production. Remove OPENAI_API_KEY or configure Supabase auth.",
      },
      { status: 503 },
    );
  }

  if (options.cloudModelEnabled && hasSupabaseAuth()) {
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json(
          {
            error: "unauthorized",
            message: "Sign in to use the cloud Copilot model in this workspace.",
          },
          { status: 401 },
        );
      }
      const rl = await takeToken(
        `copilot:${user.id}`,
        CHAT_CLOUD_RATE_LIMIT,
        CHAT_RATE_WINDOW_MS,
      );
      if (!rl.ok) {
        return NextResponse.json(
          { error: "too_many_requests", retry_after: rl.retryAfterSec },
          {
            status: 429,
            headers: { "Retry-After": String(rl.retryAfterSec) },
          },
        );
      }
      return null;
    } catch {
      return NextResponse.json(
        { error: "auth_unavailable", message: "Could not validate session." },
        { status: 503 },
      );
    }
  }

  const rl = await takeToken(`copilot:ip:${ip}`, CHAT_RATE_LIMIT, CHAT_RATE_WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "too_many_requests", retry_after: rl.retryAfterSec },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      },
    );
  }

  return null;
}
