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
  return [...products, ...faqs,
    { id: 'pricing', title: 'Pricing and plans', answer: PRICING_TIERS.map((plan) => `${plan.name}: ${plan.price} ${plan.period}. ${plan.description}`).join('\n') + '\n\nSelf-serve checkout is coming soon. Contact the team or start a pilot for paid access.', href: '/pricing', keywords: ['pricing price cost plans free pro team'] },
    { id: 'api-access', title: 'API keys and authentication', answer: 'Manage Smohix API keys in your signed-in workspace under Settings → API keys. Browser requests use your session; scripts use a Bearer API key. Alert ingest uses dedicated ingest tokens. Keep provider secrets on the server. The HQ guide answers from published Smohix sources without a paid model call.', href: '/auth/sign-in?next=/settings/api-keys', keywords: ['apikey authenticate authentication token save api key'] },
    { id: 'command', title: 'Operational command and live console', answer: 'Platform connects incidents, guarded automations, human approvals, and audit evidence. The HQ workflow preview is illustrative; sign in to Hub for your organization’s real records. The service-check panel reports public endpoint reachability, not private incident data or historical uptime.', href: '/platform', keywords: ['command console incident incidents approvals audit automation operations hub'] },
    { id: 'contact', title: 'Contact Smohix', answer: 'Contact the Smohix team for product questions, enterprise requirements, and pilot access.', href: '/contact', keywords: ['contact support help team'] },
  ];
}
