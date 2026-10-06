import type { HTMLAttributes, ReactNode } from "react";

import { mRevealVisible, mSectionEnter } from "@/lib/marketing-layout";

type MarketingRevealProps = {
  as?: "section" | "article" | "div";
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "children">;

/** Content is visible in server-rendered HTML, including without JavaScript.
 * Keep the shared section hooks for existing layout and reduced-motion styles. */
export function MarketingReveal({
  as: Tag = "section",
  className = "",
  children,
  ...rest
}: MarketingRevealProps) {
  return (
    <Tag className={`${className} ${mSectionEnter} ${mRevealVisible}`.trim()} {...rest}>
      {children}
    </Tag>
  );
}
