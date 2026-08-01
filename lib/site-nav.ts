/**
 * Shared marketing navigation — Header, Navbar, mobile nav, and footer.
 */

export const FOOTER_EXPERIENCE = [
  { href: "/products", label: "Product Access" },
  { href: "/explore", label: "Explore Zentro" },
  { href: "/playground", label: "API request builder" },
  { href: "/use-cases", label: "Use cases" },
  { href: "/faq", label: "FAQ" },
  { href: "/search", label: "Search" },
] as const;

export const PRIMARY_NAV = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/pilot", label: "Pilot" },
  { href: "/professional-services", label: "Professional services" },
  { href: "/solutions", label: "Solutions" },
  { href: "/developers", label: "Developers" },
  { href: "/pricing", label: "Pricing" },
  { href: "/enterprise", label: "Enterprise" },
  { href: "/company", label: "Company" },
  { href: "/contact", label: "Contact" },
] as const;

/** Compact nav for desktop header (hides Home on homepage context). */
export const HEADER_NAV = PRIMARY_NAV.filter((item) => item.href !== "/");

export const FOOTER_PRODUCTS = [
  { href: "/products", label: "All products" },
  { href: "/products/zentro-platform", label: "Zentro Platform" },
  { href: "/products/zentro-ai", label: "Zentro AI" },
  { href: "/products/zentro-own-api", label: "Zentro Own API" },
  { href: "/pilot", label: "Pilot program" },
  { href: "/professional-services", label: "Professional services" },
  { href: "/architecture", label: "Architecture" },
  { href: "/technology", label: "Technology" },
  { href: "/hub", label: "Console" },
  { href: "/pricing", label: "Pricing" },
] as const;

export const FOOTER_DEVELOPERS = [
  { href: "/developers", label: "Developers" },
  { href: "/docs", label: "Documentation" },
  { href: "/docs/api", label: "API reference" },
  { href: "/architecture", label: "Architecture" },
  { href: "/technology", label: "Technology" },
  { href: "/changelog", label: "Changelog" },
  { href: "https://github.com/aicodeai50/ZENTRO", label: "GitHub", external: true },
] as const;

export const FOOTER_COMPANY = [
  { href: "/company", label: "Company" },
  { href: "/about", label: "About" },
  { href: "/trust", label: "Trust center" },
  { href: "/careers", label: "Careers" },
  { href: "/contact", label: "Contact" },
  { href: "/changelog", label: "Changelog" },
  { href: "/next", label: "What's next" },
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
