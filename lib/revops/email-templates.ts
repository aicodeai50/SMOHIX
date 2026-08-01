export type EmailTemplateId =
  | "enquiry_received"
  | "request_more_info"
  | "pilot_discovery_call"
  | "pilot_proposal_ready"
  | "follow_up_reminder"
  | "pilot_accepted"
  | "pilot_completed";

export type EmailTemplateInput = {
  contactName: string;
  company: string;
  referenceId?: string;
  pilotReference?: string;
  followUpDate?: string;
  senderName?: string;
};

export type EmailTemplate = {
  id: EmailTemplateId;
  label: string;
  subject: (input: EmailTemplateInput) => string;
  body: (input: EmailTemplateInput) => string;
};

const signOff = (input: EmailTemplateInput) =>
  `\n\nBest regards,\n${input.senderName ?? "Zentro Technologies"}\nhttps://zentro.run`;

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "enquiry_received",
    label: "Enquiry received",
    subject: (i) => `We received your enquiry${i.referenceId ? ` (${i.referenceId})` : ""}`,
    body: (i) =>
      `Hi ${i.contactName},\n\nThank you for contacting Zentro Technologies regarding ${i.company}. We have received your enquiry${i.referenceId ? ` (reference ${i.referenceId})` : ""} and a team member will review it shortly.${signOff(i)}`,
  },
  {
    id: "request_more_info",
    label: "Request for more information",
    subject: (i) => `Quick follow-up — ${i.company}`,
    body: (i) =>
      `Hi ${i.contactName},\n\nThank you for your interest in Zentro. To help us route your request, could you share a bit more about your timeline, stakeholders, and what success looks like for ${i.company}?${signOff(i)}`,
  },
  {
    id: "pilot_discovery_call",
    label: "Pilot discovery call",
    subject: (i) => `Pilot discovery — ${i.company}`,
    body: (i) =>
      `Hi ${i.contactName},\n\nWe would like to schedule a discovery call to understand your goals for a Zentro pilot at ${i.company}. Please reply with a few times that work for you.${signOff(i)}`,
  },
  {
    id: "pilot_proposal_ready",
    label: "Pilot proposal ready",
    subject: (i) => `Pilot proposal draft — ${i.company}`,
    body: (i) =>
      `Hi ${i.contactName},\n\nWe have prepared a pilot proposal draft for ${i.company}${i.pilotReference ? ` (${i.pilotReference})` : ""}. We will share it after an internal review — please let us know if you have constraints we should reflect.${signOff(i)}`,
  },
  {
    id: "follow_up_reminder",
    label: "Follow-up reminder",
    subject: (i) => `Following up — ${i.company}`,
    body: (i) =>
      `Hi ${i.contactName},\n\nI wanted to follow up on our previous conversation about ${i.company}.${i.followUpDate ? ` We had noted ${i.followUpDate} for next steps.` : ""} Happy to find time if still relevant.${signOff(i)}`,
  },
  {
    id: "pilot_accepted",
    label: "Pilot accepted",
    subject: (i) => `Next steps for your Zentro pilot — ${i.company}`,
    body: (i) =>
      `Hi ${i.contactName},\n\nThank you for moving forward with a Zentro pilot for ${i.company}. We will confirm kickoff details and stakeholders shortly.${signOff(i)}`,
  },
  {
    id: "pilot_completed",
    label: "Pilot completed",
    subject: (i) => `Pilot review — ${i.company}`,
    body: (i) =>
      `Hi ${i.contactName},\n\nWe have reached the review point for the ${i.company} pilot. We will share outcomes and recommended next steps shortly.${signOff(i)}`,
  },
];

export function getEmailTemplate(id: EmailTemplateId): EmailTemplate | undefined {
  return EMAIL_TEMPLATES.find((t) => t.id === id);
}

export function buildMailtoLink(input: {
  to: string;
  templateId: EmailTemplateId;
  templateInput: EmailTemplateInput;
}): string {
  const template = getEmailTemplate(input.templateId);
  if (!template) return `mailto:${encodeURIComponent(input.to)}`;
  const subject = template.subject(input.templateInput);
  const body = template.body(input.templateInput);
  return `mailto:${encodeURIComponent(input.to)}?${new URLSearchParams({ subject, body }).toString()}`;
}
