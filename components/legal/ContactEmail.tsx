import { SITE_EMAIL_CONTACT, getMailtoHref, type MailtoTopic } from "@/lib/billing";

/** Single inbox link — use topic to pre-fill the subject line for routing. */
export function ContactEmail({
  topic = "general",
  className,
}: {
  topic?: MailtoTopic;
  className?: string;
}) {
  return (
    <a href={getMailtoHref(topic)} className={className}>
      {SITE_EMAIL_CONTACT}
    </a>
  );
}
