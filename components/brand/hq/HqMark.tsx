/**
 * Back-compat re-exports — prefer SmohixHqMark / SmohixHqWordmark / SmohixHqLockup.
 */
import type { ComponentProps } from "react";

import { SmohixHqMark, renderSmohixHqMarkSvg } from "./SmohixHqMark";

export { SmohixHqMark as HqMark, renderSmohixHqMarkSvg as renderHqMarkSvg } from "./SmohixHqMark";
export type { SmohixHqMarkTone as HqMarkTone } from "./SmohixHqMark";
export { SmohixHqWordmark as HqDomainLockup } from "./SmohixHqWordmark";

export function HqMicroMark(props: ComponentProps<typeof SmohixHqMark>) {
  return <SmohixHqMark micro {...props} />;
}
