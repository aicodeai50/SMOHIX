"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { ContactForm } from "@/components/contact/ContactForm";
import { isInquiryType } from "@/lib/contact-form";

const DEVELOPER_SUCCESS_MESSAGE =
  "Your developer access request is queued for review. API keys are not issued automatically from this form — we will follow up at your work email.";

const PILOT_SUCCESS_MESSAGE =
  "Your pilot application is in our queue. A team member will review scope and category fit before scheduling next steps.";

function ContactFormWithParams() {
  const params = useSearchParams();
  const inquiry = params.get("inquiry");
  const product = params.get("product") ?? undefined;
  const pilotCategory = params.get("category") ?? params.get("pilot_category") ?? undefined;
  const defaultInquiry = isInquiryType(inquiry) ? inquiry : "general";

  const successMessage =
    defaultInquiry === "developer"
      ? DEVELOPER_SUCCESS_MESSAGE
      : defaultInquiry === "pilot"
        ? PILOT_SUCCESS_MESSAGE
        : undefined;

  return (
    <ContactForm
      defaultInquiry={defaultInquiry}
      productHint={product}
      pilotCategory={pilotCategory}
      successMessage={successMessage}
    />
  );
}

export function ContactFormSection() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 text-sm text-muted">
          Loading form…
        </div>
      }
    >
      <ContactFormWithParams />
    </Suspense>
  );
}
