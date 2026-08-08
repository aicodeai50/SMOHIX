"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ingestAlertCreateIncident, normalizeAlertIngestPayload } from "@/lib/integrations/alert-ingest";
import { sendSlackNotificationWithAudit } from "@/lib/integrations/slack";
import { getSiteUrl } from "@/lib/site";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function readWizardIntent(formData: FormData) {
  const nextRaw = formData.get("next");
  const setupStepRaw = formData.get("setup_step");
  const next = typeof nextRaw === "string" && nextRaw.startsWith("/") ? nextRaw : null;
  const setupStepCandidate =
    typeof setupStepRaw === "string" ? setupStepRaw.trim().toLowerCase() : "";
  const setupStep =
    setupStepCandidate === "ingest-token" || setupStepCandidate === "connectors"
      ? setupStepCandidate
      : null;
  const suffix = [
    next ? `next=${encodeURIComponent(next)}` : null,
    setupStep ? `setup_step=${encodeURIComponent(setupStep)}` : null,
  ]
    .filter(Boolean)
    .join("&");
  return { next, setupStep, suffix };
}

function connectorsPathWithWizard(wizard: { suffix: string; setupStep: string | null }) {
  const base = wizard.suffix ? `/settings/connectors?${wizard.suffix}` : "/settings/connectors";
  const anchor = wizard.setupStep === "ingest-token" ? "#ingest-token-setup" : "#connectors-health";
  return `${base}${anchor}`;
}

export async function generateTestIngestIncidentAction(formData: FormData) {
  const wizard = readWizardIntent(formData);
  if (!hasSupabaseAuth()) {
    redirect("/hub");
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/auth/sign-in?next=${encodeURIComponent(connectorsPathWithWizard(wizard))}`);
  }

  const ts = Date.now();
  const result = await ingestAlertCreateIncident(user.id, "manual-test", {
    title: "Smohix ingest pipeline test",
    severity: "medium",
    status: "investigating",
    summary: "Synthetic event from Settings > Connectors to validate ingest flow end-to-end.",
    dedupe_key: `smohix-test:${ts}`,
    owner_hint: "platform",
  });

  if (!result.ok) {
    const q = [`error=${encodeURIComponent(result.message)}`, wizard.suffix]
      .filter(Boolean)
      .join("&");
    redirect(`/settings/connectors?${q}`);
  }

  revalidatePath("/settings/connectors");
  revalidatePath("/incidents");
  revalidatePath("/audit");
  if (wizard.next) {
    redirect(wizard.next);
  }
  const q = [`ok=${encodeURIComponent(result.id)}`, wizard.suffix].filter(Boolean).join("&");
  redirect(`/settings/connectors?${q}`);
}

export async function generateVendorTestEventsAction(formData: FormData) {
  const wizard = readWizardIntent(formData);
  if (!hasSupabaseAuth()) {
    redirect("/hub");
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/auth/sign-in?next=${encodeURIComponent(connectorsPathWithWizard(wizard))}`);
  }

  const ts = Date.now();
  const fixtures: { source: string; payload: Record<string, unknown> }[] = [
    {
      source: "datadog",
      payload: {
        id: ts + 1,
        title: "Datadog test event",
        text: "Synthetic Datadog payload from connectors diagnostics.",
        alert_type: "error",
        tags: ["service:payments-api", "owner:platform"],
      },
    },
    {
      source: "prometheus",
      payload: {
        status: "firing",
        alerts: [
          {
            status: "firing",
            labels: { alertname: "SyntheticPrometheusAlert", severity: "critical", service: "payments-api" },
            annotations: { summary: "Synthetic Prometheus payload from connectors diagnostics." },
            fingerprint: `test-prom-${ts}`,
          },
        ],
      },
    },
    {
      source: "pagerduty",
      payload: {
        event_action: "trigger",
        dedup_key: `test-pd-${ts}`,
        payload: {
          summary: "Synthetic PagerDuty payload from connectors diagnostics.",
          source: "payments-api",
          component: "payments-api",
          severity: "critical",
        },
      },
    },
    {
      source: "newrelic",
      payload: {
        current_state: "open",
        incident_id: ts + 2,
        condition_name: "Synthetic New Relic Alert",
        policy_name: "Synthetic Policy",
        severity: "critical",
        labels: { service: "payments-api", team: "platform" },
      },
    },
  ];

  let created = 0;
  for (const f of fixtures) {
    const normalized = normalizeAlertIngestPayload(f.payload, f.source);
    const result = await ingestAlertCreateIncident(user.id, "manual-test", normalized);
    if (result.ok) {
      created += 1;
    }
  }

  revalidatePath("/settings/connectors");
  revalidatePath("/incidents");
  revalidatePath("/audit");
  if (wizard.next) {
    redirect(wizard.next);
  }
  const q = [`batch_ok=${created}`, wizard.suffix].filter(Boolean).join("&");
  redirect(`/settings/connectors?${q}`);
}

export async function cleanupSyntheticIngestTestsAction(formData: FormData) {
  const wizard = readWizardIntent(formData);
  if (!hasSupabaseAuth()) {
    redirect("/hub");
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/auth/sign-in?next=${encodeURIComponent(connectorsPathWithWizard(wizard))}`);
  }

  const { data: rows } = await supabase
    .from("incidents")
    .select("id, title, external_ref")
    .eq("user_id", user.id)
    .limit(200);

  const ids = (rows ?? []).flatMap((r) => {
    const id = typeof r.id === "string" ? r.id : "";
    const title = typeof r.title === "string" ? r.title.trim().toLowerCase() : "";
    const externalRef =
      typeof r.external_ref === "string" ? r.external_ref.trim().toLowerCase() : "";
    const isSyntheticTitle =
      title === "smohix ingest pipeline test" ||
      title === "datadog test event" ||
      title === "syntheticprometheusalert" ||
      title === "synthetic pagerduty payload from connectors diagnostics." ||
      title === "synthetic new relic alert";
    const isSyntheticRef =
      externalRef.startsWith("prometheus:test-prom-") ||
      externalRef.startsWith("pagerduty:test-pd-") ||
      externalRef.startsWith("newrelic:");
    if (!id || (!isSyntheticTitle && !isSyntheticRef)) {
      return [];
    }
    return [id];
  });

  let deleted = 0;
  if (ids.length > 0) {
    const { error } = await supabase.from("incidents").delete().in("id", ids).eq("user_id", user.id);
    if (!error) {
      deleted = ids.length;
    }
  }

  revalidatePath("/settings/connectors");
  revalidatePath("/incidents");
  revalidatePath("/audit");
  if (wizard.next) {
    redirect(wizard.next);
  }
  const q = [`clean_ok=${deleted}`, wizard.suffix].filter(Boolean).join("&");
  redirect(`/settings/connectors?${q}`);
}

export async function acknowledgeUnknownSyntheticIngestAction(formData: FormData) {
  const wizard = readWizardIntent(formData);
  if (!hasSupabaseAuth()) {
    redirect("/hub");
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/auth/sign-in?next=${encodeURIComponent(connectorsPathWithWizard(wizard))}`);
  }

  const { data: rows } = await supabase
    .from("incidents")
    .select("id, title, status, external_ref")
    .eq("user_id", user.id)
    .limit(300);

  const ids = (rows ?? []).flatMap((r) => {
    const id = typeof r.id === "string" ? r.id : "";
    const title = typeof r.title === "string" ? r.title.trim().toLowerCase() : "";
    const status = typeof r.status === "string" ? r.status.trim().toLowerCase() : "";
    const externalRef =
      typeof r.external_ref === "string" ? r.external_ref.trim().toLowerCase() : "";
    const hasKnownPrefix =
      externalRef.startsWith("datadog:") ||
      externalRef.startsWith("prometheus:") ||
      externalRef.startsWith("pagerduty:") ||
      externalRef.startsWith("newrelic:");
    const isSyntheticTitle =
      title === "smohix ingest pipeline test" ||
      title === "datadog test event" ||
      title === "syntheticprometheusalert" ||
      title === "synthetic pagerduty payload from connectors diagnostics." ||
      title === "synthetic new relic alert";
    const unresolved = status !== "resolved";
    const isUnknownLike = !externalRef || !hasKnownPrefix;

    if (!id || !unresolved || !isUnknownLike || !isSyntheticTitle) {
      return [];
    }
    return [id];
  });

  let updated = 0;
  if (ids.length > 0) {
    const { error } = await supabase
      .from("incidents")
      .update({ status: "mitigated" })
      .in("id", ids)
      .eq("user_id", user.id);
    if (!error) {
      updated = ids.length;
    }
  }

  revalidatePath("/settings/connectors");
  revalidatePath("/incidents");
  revalidatePath("/audit");
  if (wizard.next) {
    redirect(wizard.next);
  }
  const q = [`ack_ok=${updated}`, wizard.suffix].filter(Boolean).join("&");
  redirect(`/settings/connectors?${q}`);
}

export async function sendSlackTestMessageAction(formData: FormData) {
  const wizard = readWizardIntent(formData);
  if (!hasSupabaseAuth()) {
    redirect("/hub");
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/auth/sign-in?next=${encodeURIComponent(connectorsPathWithWizard(wizard))}`);
  }

  const result = await sendSlackNotificationWithAudit({
    userId: user.id,
    title: "Smohix Slack integration test",
    body: "Your Slack webhook is connected and ready for approval and execution notifications.",
    details: [`open: ${getSiteUrl()}/settings/connectors`],
    kind: "manual_test",
    auditDetails: { source: "settings.connectors" },
  });

  if (!result.ok) {
    const q = [
      `error=${encodeURIComponent(
        result.reason === "slack_not_configured"
          ? "Slack webhook not configured. Set SMOHIX_SLACK_WEBHOOK_URL in Railway variables."
          : `Slack test failed: ${result.reason}`,
      )}`,
      wizard.suffix,
    ]
      .filter(Boolean)
      .join("&");
    redirect(`/settings/connectors?${q}`);
  }

  revalidatePath("/settings/connectors");
  if (wizard.next) {
    redirect(wizard.next);
  }
  const q = [`slack_ok=1`, wizard.suffix].filter(Boolean).join("&");
  redirect(`/settings/connectors?${q}`);
}
