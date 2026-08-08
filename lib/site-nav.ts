/**
 * Shared marketing navigation — Header, Navbar, mobile nav, and footer.
 */

import { PRIMARY_SITE_NAV } from "@/lib/ecosystem-workspaces";
import { SMOHIX_AI_PUBLIC_URL } from "@/lib/product-registry";

export const HEADER_ACTIONS = {
  openAi: { href: SMOHIX_AI_PUBLIC_URL, label: "Open Smohix AI", external: true },
  signIn: { href: "/auth/sign-in", label: "Sign in" },
  search: { href: "/search", label: "Search" },
} as const;

export const FOOTER_EXPERIENCE = [
  { href: "/products", label: "Products" },
  { href: "/explore", label: "Explore" },
  { href: "/use-cases", label: "Use cases" },
  { href: "/faq", label: "FAQ" },
  { href: "/search", label: "Search" },
] as const;

/** Mobile menu includes Home; desktop header uses HEADER_NAV. */
export const PRIMARY_NAV = [
  { href: "/", label: "Home" },
  ...PRIMARY_SITE_NAV,
  { href: "/contact", label: "Contact" },
] as const;

export const HEADER_NAV = [...PRIMARY_SITE_NAV];

export const FOOTER_PRODUCTS = [
  { href: "/products", label: "All products" },
  { href: "/products/smohix-ai", label: "Smohix AI" },
  { href: "/products/smohix-platform", label: "Smohix Platform" },
  { href: "/products/smohix-assistant", label: "Smohix Assistant" },
  { href: "/products/private-ai", label: "Private AI" },
  { href: "/products/smohix-own-api", label: "Smohix Own API" },
  { href: "/pilot", label: "Pilot program" },
  { href: "/architecture", label: "Architecture" },
  { href: "/technology", label: "Technology" },
  { href: "/pricing", label: "Pricing" },
] as const;

export const FOOTER_DEVELOPERS = [
  { href: "/developers", label: "Developers" },
  { href: "/docs", label: "Documentation" },
  { href: "/docs/api", label: "API reference" },
  { href: "/playground", label: "API request builder" },
  { href: "/changelog", label: "Changelog" },
  { href: "https://github.com/aicodeai50/SMOHIX", label: "GitHub", external: true },
] as const;

export const FOOTER_COMPANY = [
  { href: "/company", label: "Company" },
  { href: "/about", label: "About" },
  { href: "/trust", label: "Trust center" },
  { href: "/careers", label: "Careers" },
  { href: "/contact", label: "Contact" },
  { href: "/next", label: "Roadmap" },
] as const;

export const FOOTER_LEGAL = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/cookies", label: "Cookies" },
  { href: "/acceptable-use", label: "Acceptable use" },
  { href: "/security", label: "Security" },
  { href: "/refund", label: "Refunds" },
] as const;

export const FOOTER_SUPPORT = [
  { href: "/status", label: "Status" },
  { href: "/trust", label: "Trust" },
  { href: "/docs", label: "Docs" },
  { href: "/contact", label: "Contact" },
] as const;

export const FOOTER_SOLUTIONS = [
  { href: "/solutions/business-automation", label: "Business Automation" },
  { href: "/solutions/enterprise-ai", label: "Enterprise AI" },
  { href: "/solutions/healthcare", label: "Healthcare" },
  { href: "/solutions/education", label: "Education" },
  { href: "/solutions/government", label: "Government" },
] as const;
