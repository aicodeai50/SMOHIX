/** Workshop is a Smohix project-delivery offering; the dedicated client portal is planned. */
export const WORKSHOP_CONTACT_PATH = "/contact?inquiry=enterprise&product=smohix-workshop";
export const WORKSHOP_STAGES = [
  { title: "Define", detail: "Agree on the business problem, users, requirements, budget and success criteria.", output: "Project brief and delivery scope" },
  { title: "Design", detail: "Review the user journeys, product structure and technical approach before building.", output: "Reviewed designs and implementation plan" },
  { title: "Build", detail: "Work through agreed milestones with progress reviews and explicit acceptance criteria.", output: "Tested increments and review decisions" },
  { title: "Launch and hand over", detail: "Plan deployment, ownership, documentation and any ongoing support together.", output: "Deployment and handover plan" },
] as const;
export const WORKSHOP_PROJECT_TYPES = [
  { title: "Web products and customer portals", description: "A new digital product or service built around your customers and business model." },
  { title: "Internal tools and business systems", description: "Purpose-built workflows that replace disconnected spreadsheets and manual work." },
  { title: "AI-enabled applications", description: "Useful intelligence integrated into the product, with clear access and usage controls." },
  { title: "APIs and connected services", description: "Documented integrations that connect existing systems and support future development." },
] as const;
