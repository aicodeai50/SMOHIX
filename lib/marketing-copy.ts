/**
 * Sign-up is branded “Get started” on the main conversion surfaces; shorter “Sign up”
 * elsewhere so the same phrase is not repeated in the header + hero at once.
 */
export const marketingCta = {
  /** Primary hero CTA → `/auth/sign-up` */
  heroPrimary: "Get started",
  /** Compact nav (header / connect) — same destination, different label */
  headerPrimary: "Sign up",
  /** Footer account link — user expects “Get started” away from the hero */
  footerSignup: "Get started",
  connectExplore: "Open console",
  connectSignup: "Sign up",
  authNavSignup: "Sign up",
  /** Sign-in form footer link to sign-up */
  signInFooter: "Get started",
} as const;
