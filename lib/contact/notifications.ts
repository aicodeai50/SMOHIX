import { logEvent } from "@/lib/observability/logger";

import type { NormalizedLead } from "./leads";
import type { StoredLead } from "./storage";

export type LeadNotificationInput = {
  lead: NormalizedLead;
  stored: StoredLead;
};

export type LeadNotificationProvider = {
  name: string;
  notify(input: LeadNotificationInput): Promise<void>;
};

const noopProvider: LeadNotificationProvider = {
  name: "noop",
  async notify() {
    /* documented — configure SMOHIX_CONTACT_WEBHOOK_URL or SMOHIX_SLACK_WEBHOOK_URL */
  },
};

function getWebhookProvider(): LeadNotificationProvider | null {
  const url = (process.env.SMOHIX_CONTACT_WEBHOOK_URL ?? process.env.ZENTRO_CONTACT_WEBHOOK_URL)?.trim();
  if (!url) return null;

  return {
    name: "webhook",
    async notify({ lead, stored }) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://smohix.run";
      const adminLink = `${siteUrl}/admin/leads?ref=${encodeURIComponent(stored.publicReference)}`;
      const summary =
        lead.problemSummary.length > 160
          ? `${lead.problemSummary.slice(0, 157)}…`
          : lead.problemSummary;

      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "contact_lead",
          referenceId: stored.publicReference,
          inquiryType: lead.inquiryType,
          name: lead.name,
          email: lead.email,
          company: lead.company,
          summary,
          receivedAt: stored.createdAt,
          adminLink,
        }),
        signal: AbortSignal.timeout(5000),
      });
    },
  };
}

function getSlackProvider(): LeadNotificationProvider | null {
  const url = (process.env.SMOHIX_SLACK_WEBHOOK_URL ?? process.env.ZENTRO_SLACK_WEBHOOK_URL)?.trim();
  if (!url) return null;

  return {
    name: "slack",
    async notify({ lead, stored }) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://smohix.run";
      const adminLink = `${siteUrl}/admin/leads?ref=${encodeURIComponent(stored.publicReference)}`;
      const summary =
        lead.problemSummary.length > 200
          ? `${lead.problemSummary.slice(0, 197)}…`
          : lead.problemSummary;

      const text = [
        `*New contact lead* \`${stored.publicReference}\``,
        `*Type:* ${lead.inquiryType}`,
        `*Name:* ${lead.name}`,
        `*Email:* ${lead.email}`,
        `*Company:* ${lead.company}`,
        `*Summary:* ${summary}`,
        `<${adminLink}|Review in admin>`,
      ].join("\n");

      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal: AbortSignal.timeout(5000),
      });
    },
  };
}

function resolveProviders(): LeadNotificationProvider[] {
  const providers: LeadNotificationProvider[] = [];
  const webhook = getWebhookProvider();
  const slack = getSlackProvider();
  if (webhook) providers.push(webhook);
  if (slack) providers.push(slack);
  if (providers.length === 0) providers.push(noopProvider);
  return providers;
}

export async function notifyLeadStored(input: LeadNotificationInput): Promise<void> {
  const providers = resolveProviders();
  for (const provider of providers) {
    try {
      await provider.notify(input);
      logEvent("info", "contact_notification_sent", {
        referenceId: input.stored.publicReference,
        provider: provider.name,
        inquiryType: input.lead.inquiryType,
      });
    } catch {
      logEvent("warn", "contact_notification_failed", {
        referenceId: input.stored.publicReference,
        provider: provider.name,
        inquiryType: input.lead.inquiryType,
      });
    }
  }
}
