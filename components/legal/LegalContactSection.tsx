import { ContactEmail } from "@/components/legal/ContactEmail";

/** Standard legal-page contact block — single inbox, subject-line routing. */
export function LegalContactSection() {
  return (
    <>
      <h2>Contact</h2>
      <p>
        Reach us at <ContactEmail /> — one inbox for product, billing, privacy, and security.
        Use a clear subject line (for example <em>Security</em>, <em>Billing</em>, or{" "}
        <em>Privacy request</em>) so we can route your message quickly.
      </p>
    </>
  );
}
