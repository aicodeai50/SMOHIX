import { SMOHIX_SERVICES } from '@/lib/services-content';
import { SOLUTION_PAGES } from '@/lib/solutions-content';
import { SEARCH_INDEX } from '@/lib/experience/search-index';
import { USE_CASES } from '@/lib/experience/use-cases';
import { FAQ_GROUPS } from '@/lib/experience/faq';
import { getAllRegistryProducts, registryMaturityLabel } from '@/lib/product-registry';
import { PRICING_TIERS } from '@/lib/product-identity';
import type { GuideDocument } from './guide-search';
/** Public facts only; no credentials, workspace records, or model calls. */
export function buildHqGuideDocuments(): GuideDocument[] {
  const products: GuideDocument[] = getAllRegistryProducts().map((product) => ({
    id: product.id,
    title: product.publicName,
    answer: `${product.publicName}: ${product.description}\n\nRegistered maturity: ${registryMaturityLabel(product.maturity)}. ${product.capabilities.join('. ')}. ${product.limitations.join('. ')}. Runtime availability is checked separately on Service status.\n\n${product.productUrl ? `Open product: ${product.productUrl}.` : ''}${product.docsUrl ? ` Documentation: ${product.docsUrl}.` : ''}\nAccess options: ${product.availableActions.map(action=>`${action.label}: ${action.href}`).join('; ')}.`,
    href: product.productPagePath,
    keywords: [product.id, product.publicName, ...(product.id === 'private-ai' ? ['PRI private AI deployment'] : []), ...(product.id === 'smohix-workshop' ? ['company project custom software build from scratch delivery milestones client'] : [])],
  }));
  const groupLinks: Record<string, string> = { products: '/products', developers: '/docs/api', pricing: '/pricing', security: '/security', enterprise: '/enterprise', pilots: '/pilot', privacy: '/privacy' };
  const faqs = FAQ_GROUPS.flatMap((group) => group.items.map((item, index) => ({
    id: `faq-${group.id}-${index}`, title: item.q, answer: item.a, href: groupLinks[group.id] ?? '/faq', keywords: [group.title],
  })));
  const pages: GuideDocument[] = SEARCH_INDEX.filter(entry=>entry.category!=='product' && !['pricing','contact'].includes(entry.id)).map(entry=>({
    id:`page-${entry.id}`, title:entry.title, answer:`${entry.title}: ${entry.description}. Open ${entry.href} for the published guidance.`, href:entry.href, keywords:[...entry.keywords],
  }));
  const useCases: GuideDocument[] = USE_CASES.map(item=>({
    id:`use-case-${item.id}`,title:`${item.title} use case`,href:'/use-cases',keywords:[item.id,item.title,'use case solution scenario'],
    answer:`${item.problem}\n\n${item.solution}\n\nAvailable today: ${item.deliversNow.join('; ')}. Pilot scope: ${item.requiresPilot.join('; ')}. Planned: ${item.planned.join('; ')}.`,
  }));
  const services: GuideDocument[] = SMOHIX_SERVICES.map(service=>({id:`service-${service.id}`,title:service.title,href:'/professional-services',keywords:[service.id,service.title,service.audience],answer:`${service.problem}\n\n${service.outcome}\nFor: ${service.audience}\nRelated products: ${service.relatedProducts.join(', ')}. Scope and availability are agreed with the team.`}));
  const solutions: GuideDocument[] = SOLUTION_PAGES.map(solution=>({id:`solution-${solution.slug}`,title:`${solution.title} solution`,href:`/solutions/${solution.slug}`,keywords:[solution.slug,solution.title,'solution'],answer:`${solution.description}\n\n${solution.outcomes.join('\n')}\nRelated products: ${solution.relatedProducts.map(product=>product.label).join(', ')}. Next step: ${solution.cta.label} at ${solution.cta.href}.`}));
  const additional: GuideDocument[] = [
    {id:'ecosystem-domains',title:'Smohix ecosystem and product domains',href:'/products',keywords:['ecosystem domain domains subdomain subdomains connected relationship HQ homepage'],answer:`Smohix.run is the public HQ and Platform entry point for one Smohix ecosystem. Registered product destinations:\n${getAllRegistryProducts().filter(product=>product.productUrl).map(product=>`${product.publicName}: ${product.productUrl} — ${product.description}`).join('\n')}\n\nProducts share the Smohix brand while keeping their own workspace purposes and access requirements. The HQ guide helps you understand them; it does not replace the full Assistant, AI, or PRI workspaces. Registered maturity and endpoint reachability are separate; check /status for runtime checks.`},
    {id:'hq-assistant',title:'HQ guide and full Smohix Assistant',href:'/products/smohix-assistant',keywords:['HQ chatbot chat guide widget corner assistant difference'],answer:'The corner assistant on Smohix.run is the HQ guide: it explains the public ecosystem, products, plans, documentation, and destinations from published sources without paid model calls. The full Smohix Assistant at https://assistant.smohix.run is a separate personal productivity workspace. Smohix AI is the reasoning and team-chat product; PRI is the organization-scoped private AI workspace. Closing this HQ panel preserves the current page-session chat; it cannot read private workspace records.'},
    {id:'technology-stack',title:'Smohix technology',href:'/technology',keywords:['technology stack framework frontend backend database infrastructure'],answer:'Smohix brings operational workflows and intelligence together. Visit the published technology overview for product information.'},
    {id:'architecture-flow',title:'Platform overview',href:'/architecture',keywords:['architecture flow gateway routing models intelligence'],answer:'Smohix connects incident response, approvals and evidence in an operations workspace. See the published overview for more information.'},
    {id:'site-overview',title:'About Smohix.run',href:'/about',keywords:['website site smohix.run company about'],answer:'Smohix.run is the public HQ for Smohix Technologies: product access, developer resources, enterprise programs, pilots, pricing, and trust guidance. Product Access lists destinations and maturity; sign in for organization-scoped operational workspaces.'},
    ...['technology','integrations','professional-services','careers','terms','cookies','acceptable-use','refund','changelog','next','company','tour','why'].map(path=>({id:`page-${path}`,title:path.replaceAll('-',' '),href:`/${path}`,keywords:[path.replaceAll('-',' '),...(path==='next'?['roadmap future upcoming']:[])],answer:`The ${path.replaceAll('-',' ')} page is available at /${path}. Use its published content for current details; the assistant does not infer commitments or legal terms.`})),
    {id:'workspace-access',title:'Sign in and workspace access',href:'/auth/sign-in?next=/hub',keywords:['login log in sign in account dashboard workspace hub register'],answer:'Sign in to open your organization’s Hub and operational workspaces. Access depends on your session, organization membership, roles, and enabled capabilities. This public assistant cannot see or change your account, private records, approvals, or billing.'},
  ];
  return [...products, ...faqs, ...pages, ...useCases, ...services, ...solutions, ...additional,
    { id: 'pricing', title: 'Pricing and plans', answer: PRICING_TIERS.map((plan) => `${plan.name}: ${plan.price} ${plan.period}. ${plan.description}`).join('\n') + '\n\nSelf-serve checkout is coming soon. Contact the team or start a pilot for paid access.', href: '/pricing', keywords: ['pricing price cost plans free pro team'] },
    { id: 'api-access', title: 'API keys and authentication', answer: 'Manage Smohix API keys in your signed-in workspace under Settings → API keys. Sign in for browser access. Follow the API reference for integrations and never share credentials in chat. The HQ guide answers from published Smohix sources without a paid model call.', href: '/auth/sign-in?next=/settings/api-keys', keywords: ['apikey authenticate authentication token save api key'] },
    { id: 'command', title: 'Operational command and live console', answer: 'Platform connects incidents, guarded automations, human approvals, and audit evidence. The HQ workflow preview is illustrative; sign in to Hub for your organization’s real records. The service-check panel reports public endpoint reachability, not private incident data or historical uptime.', href: '/platform', keywords: ['command console incident incidents approvals audit automation operations hub'] },
    { id: 'contact', title: 'Contact Smohix', answer: 'Contact the Smohix team for product questions, enterprise requirements, and pilot access.', href: '/contact', keywords: ['contact support help team'] },
  ];
}
