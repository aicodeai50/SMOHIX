export type GuideDocument = { id: string; title: string; answer: string; href: string; keywords: string[] };
export type GuideAnswer = { text: string; sources: GuideDocument[] };
const STOP = new Set('a an the is are was it its this that what which how why do does can could i we you me my to for of in on with about tell please smohix technologies'.split(' '));
function words(text: string) {
  return text.toLowerCase().replace(/api\s+keys?/g, 'apikey').replace(/prices?|costs?|plans?/g, 'pricing').replace(/\bapis\b/g, 'api').replace(/\b(logging|logs)\b/g, 'log').replace(/\b(signin|login)\b/g, 'account').match(/[a-z0-9]+/g)?.filter((word) => !STOP.has(word)) ?? [];
}
export function answerHqQuestion(question: string, documents: GuideDocument[], previousId?: string): GuideAnswer {
  const tokens = [...new Set(words(question))];
  if (/\b(sk-[a-z0-9_-]{12,}|smohix_sk_[a-z0-9_-]{8,})\b/i.test(question)) {
    return { text: 'Manage API keys in your signed-in workspace. Ask your question without including a key.', sources: documents.filter((d) => d.id === 'api-access') };
  }
  if (/\b(hello|hi|hey)\b/i.test(question) && tokens.length <= 1) {
    return { text: 'Welcome to Smohix HQ. Ask about AI, Assistant, PRI, Platform, APIs, pricing, security, or product availability.', sources: [] };
  }
  // Brand words are ignored for product ranking, but identify introduction questions.
  const introductionWords = new Set(['s','run','site','website','company','business','overview','introduction','introduce','explain','describe','offer','offers','offering','offerings','provide','provides','purpose','mission','built','build','building','who']);
  if (/\bsmohix(?:\.run)?\b/i.test(question) && tokens.every(token=>introductionWords.has(token))) {
    const overview=documents.find(doc=>doc.id==='site-overview');
    if(overview)return {text:overview.answer,sources:[overview]};
  }
  if (/\b(lab)\b/i.test(question)) {
    return { text: 'Smohix LAB does not yet have a verified product entry in this HQ registry. Contact Smohix for its current destination and availability.', sources: documents.filter((d) => d.id === 'contact') };
  }
  if(/\b(login|log in|sign in|signin)\b/i.test(question)){
    const access=documents.find(doc=>doc.id==='workspace-access');
    if(access)return {text:access.answer,sources:[access]};
  }
  const requestedPath = question.match(/\/api\/[a-z0-9_/{}/.-]+/i)?.[0];
  if(requestedPath){
    const matches=documents.filter(doc=>doc.id.startsWith('api-') && doc.title.split(' ')[1]?.toLowerCase()===requestedPath.toLowerCase());
    if(matches.length){const sources=matches.slice(0,3);return {text:sources.map(doc=>doc.answer).join('\n\n'),sources};}
  }
  if(/\b(ecosystem|subdomains?|domains?)\b/i.test(question)){
    const ecosystem=documents.find(doc=>doc.id==='ecosystem-domains');
    if(ecosystem)return {text:ecosystem.answer,sources:[ecosystem]};
  }
  if(/\b(chatbot|widget|corner|hq (assistant|guide|chat))\b/i.test(question)){
    const guide=documents.find(doc=>doc.id==='hq-assistant');
    if(guide)return {text:guide.answer,sources:[guide]};
  }
  // Named products should not lose to generic endpoint vocabulary.
  const namedProducts: [string,RegExp][] = [
    ['smohix-labs',/\blabs?\b/i],
    ['smohix-workshop',/\bworkshop\b/i],['private-ai',/\b(pri|private ai)\b/i],['smohix-assistant',/\bassistant\b/i],
    ['smohix-platform',/\bplatform\b/i],['smohix-log',/\b(log|logs)\b/i],
    ['smohix-own-api',/\bown api\b/i],['identity',/\bidentity\b/i],
    ['agents',/\bagents?\b/i],['analytics',/\banalytics\b/i],
    ['projects',/\bprojects\b/i],['knowledge',/\bknowledge\b/i],
  ];
  const named=namedProducts.filter(([,pattern])=>pattern.test(question)).map(([id])=>documents.find(doc=>doc.id===id)).filter((doc):doc is GuideDocument=>Boolean(doc));
  if(/\bai\b/i.test(question.replace(/private ai|own api/gi,''))){
    const ai=documents.find(doc=>doc.id==='smohix-ai');if(ai)named.push(ai);
  }
  const productQuestion=/\b(what|explain|describe|about|difference|compare|versus|vs|open|find|access|use|purpose|where|live)\b/i.test(question);
  const specificTopic=/\b(pricing|price|prices|cost|keys?|tokens?|security|privacy|billing|health|endpoint|integration|integrate|sdk)\b/i.test(question);
  if(named.length && productQuestion && !specificTopic){const sources=named.slice(0,4);return {text:sources.map(doc=>doc.answer).join('\n\n'),sources};}
  const followUp = /\b(it|its|that|this product)\b/i.test(question);
  const ranked = documents.map((doc) => {
    const title = new Set(words(doc.title));
    const keys = new Set(words(doc.keywords.join(' ')));
    const body = new Set(words(doc.answer));
    const score = tokens.reduce((sum, token) => sum + (title.has(token) ? 4 : 0) + (keys.has(token) ? 6 : 0) + (body.has(token) ? 0.2 : 0), 0)
      + (followUp && doc.id === previousId ? 20 : 0);
    return { doc, score };
  }).filter((item) => item.score >= 4).sort((a, b) => b.score - a.score);
  if (!ranked.length) return { text: 'I do not have a verified answer to that in the Smohix HQ sources. Try the relevant product, page, workflow, or API endpoint name. I cover the public site catalogs and documentation; unpublished details and private account records need the team. For broader help, open Smohix AI or contact the team.', sources: documents.filter((d) => d.id === 'contact') };
  const sources = ranked.filter((item) => item.score >= ranked[0].score * 0.8).slice(0, 2).map((item) => item.doc);
  return { text: sources.map((doc) => doc.answer).join('\n\n'), sources };
}
