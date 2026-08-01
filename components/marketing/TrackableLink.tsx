"use client";

import Link from "next/link";
import { type ComponentProps, type MouseEvent } from "react";

import { trackEvent, type AnalyticsEvent, type AnalyticsPayload } from "@/lib/analytics";

type TrackableLinkProps = ComponentProps<typeof Link> & {
  event: AnalyticsEvent;
  payload?: AnalyticsPayload;
};

export function TrackableLink({
  event,
  payload,
  onClick,
  href,
  ...rest
}: TrackableLinkProps) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    trackEvent(event, {
      ...payload,
      href: typeof href === "string" ? href : undefined,
    });
    onClick?.(e);
  };

  return <Link href={href} onClick={handleClick} {...rest} />;
}

export function TrackableAnchor({
  event,
  payload,
  onClick,
  href,
  ...rest
}: ComponentProps<"a"> & {
  event: AnalyticsEvent;
  payload?: AnalyticsPayload;
}) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    trackEvent(event, { ...payload, href });
    onClick?.(e);
  };

  return <a href={href} onClick={handleClick} {...rest} />;
}
