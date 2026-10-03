import { PLATFORM_ARCHITECTURE_FLOW, TECHNOLOGY_STACK_CATEGORIES } from '@/lib/technology-content';
import { SEARCH_INDEX } from '@/lib/experience/search-index';
import { USE_CASES } from '@/lib/experience/use-cases';
import { API_GROUPS } from '@/lib/docs/api-catalog';
import { FAQ_GROUPS } from '@/lib/experience/faq';
import { getAllRegistryProducts, registryMaturityLabel } from '@/lib/product-registry';
import { PRICING_TIERS } from '@/lib/product-identity';
import type { GuideDocument } from './guide-search';
/** Public facts only; no credentials, workspace records, or model calls. */
export function buildHqGuideDocuments(): GuideDocument[] {
  const products: GuideDocument[] = getAllRegistryProducts().map((product) => ({
    id: product.id,
    title: product.publicName,
    answer: `${product.publicName}: ${product.description}\n\nRegistered maturity: ${registryMaturityLabel(product.maturity)}. ${product.capabilities.join('. ')}. ${product.limitations.join('. ')}. Runtime availability is checked separately on Service status.`,
    href: product.productPagePath,
    keywords: [product.id, product.publicName, ...(product.id === 'private-ai' ? ['PRI private AI deployment'] : [])],
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
  const apis: GuideDocument[] = API_GROUPS.flatMap(group=>group.operations.map(operation=>({
    id:`api-${operation.method}-${operation.path}`,title:`${operation.method} ${operation.path}`,href:`/docs/api#${group.id}`,
    keywords:[group.title,operation.path,operation.summary],
    answer:`${operation.method} ${operation.path}: ${operation.summary}\nAuthentication: ${operation.auth ?? 'Consult the API reference for this operation’s authentication requirements'}.${operation.notes ? `\n${operation.notes}` : ''}\nThe HQ assistant explains this endpoint; it does not execute it.`,
  })));
  const additional: GuideDocument[] = [
    {id:'technology-stack',title:'Technology stack',href:'/technology',keywords:['technology stack framework frontend backend database infrastructure'],answer:TECHNOLOGY_STACK_CATEGORIES.map(category=>`${category.category}: ${category.items.join(', ')}.`).join('\n')},
    {id:'architecture-flow',title:'Platform architecture',href:'/architecture',keywords:['architecture flow gateway routing models intelligence'],answer:PLATFORM_ARCHITECTURE_FLOW.map(step=>`${step.label}: ${step.description}.`).join('\n')},
    {id:'site-overview',title:'About Smohix.run',href:'/about',keywords:['website site smohix.run company about'],answer:'Smohix.run is the public HQ for Smohix Technologies: product access, developer resources, enterprise programs, pilots, pricing, and trust guidance. Product Access lists destinations and maturity; sign in for organization-scoped operational workspaces.'},
    ...['technology','integrations','professional-services','careers','terms','cookies','acceptable-use','refund','changelog','next','company','tour','why'].map(path=>({id:`page-${path}`,title:path.replaceAll('-',' '),href:`/${path}`,keywords:[path.replaceAll('-',' '),...(path==='next'?['roadmap future upcoming']:[])],answer:`The ${path.replaceAll('-',' ')} page is available at /${path}. Use its published content for current details; the assistant does not infer commitments or legal terms.`})),
    {id:'workspace-access',title:'Sign in and workspace access',href:'/auth/sign-in?next=/hub',keywords:['login log in sign in account dashboard workspace hub register'],answer:'Sign in to open your organization’s Hub and operational workspaces. Access depends on your session, organization membership, roles, and enabled capabilities. This public assistant cannot see or change your account, private records, approvals, or billing.'},
  ];
  return [...products, ...faqs, ...pages, ...useCases, ...apis, ...additional,
    { id: 'pricing', title: 'Pricing and plans', answer: PRICING_TIERS.map((plan) => `${plan.name}: ${plan.price} ${plan.period}. ${plan.description}`).join('\n') + '\n\nSelf-serve checkout is coming soon. Contact the team or start a pilot for paid access.', href: '/pricing', keywords: ['pricing price cost plans free pro team'] },
    { id: 'api-access', title: 'API keys and authentication', answer: 'Manage Smohix API keys in your signed-in workspace under Settings → API keys. Browser requests use your session; scripts use a Bearer API key. Alert ingest uses dedicated ingest tokens. Keep provider secrets on the server. The HQ guide answers from published Smohix sources without a paid model call.', href: '/auth/sign-in?next=/settings/api-keys', keywords: ['apikey authenticate authentication token save api key'] },
    { id: 'command', title: 'Operational command and live console', answer: 'Platform connects incidents, guarded automations, human approvals, and audit evidence. The HQ workflow preview is illustrative; sign in to Hub for your organization’s real records. The service-check panel reports public endpoint reachability, not private incident data or historical uptime.', href: '/platform', keywords: ['command console incident incidents approvals audit automation operations hub'] },
    { id: 'contact', title: 'Contact Smohix', answer: 'Contact the Smohix team for product questions, enterprise requirements, and pilot access.', href: '/contact', keywords: ['contact support help team'] },
  ];
}
