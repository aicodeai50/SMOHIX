export type GuideDocument = { id: string; title: string; answer: string; href: string; keywords: string[] };
export type GuideAnswer = { text: string; sources: GuideDocument[] };
const STOP = new Set('a an the is are was it its this that what which how why do does can could i we you me my to for of in on with about tell please smohix technologies'.split(' '));
function words(text: string) {
  return text.toLowerCase().replace(/api\s+keys?/g, 'apikey').replace(/prices?|costs?|plans?/g, 'pricing').replace(/\bapis\b/g, 'api').match(/[a-z0-9]+/g)?.filter((word) => !STOP.has(word)) ?? [];
}
export function answerHqQuestion(question: string, documents: GuideDocument[], previousId?: string): GuideAnswer {
  const tokens = [...new Set(words(question))];
  if (/\b(sk-[a-z0-9_-]{12,}|smohix_sk_[a-z0-9_-]{8,})\b/i.test(question)) {
    return { text: 'Manage API keys in your signed-in workspace. Ask your question without including a key.', sources: documents.filter((d) => d.id === 'api-access') };
  }
  if (/\b(hello|hi|hey)\b/i.test(question) && tokens.length <= 1) {
    return { text: 'Welcome to Smohix HQ. Ask about AI, Assistant, PRI, Platform, APIs, pricing, security, or product availability.', sources: [] };
  }
  if (/\b(lab)\b/i.test(question)) {
    return { text: 'Smohix LAB does not yet have a verified product entry in this HQ registry. Contact Smohix for its current destination and availability.', sources: documents.filter((d) => d.id === 'contact') };
  }
  const followUp = /\b(it|its|that|this product)\b/i.test(question);
  const ranked = documents.map((doc) => {
    const title = new Set(words(doc.title));
    const keys = new Set(words(doc.keywords.join(' ')));
    const body = new Set(words(doc.answer));
    const score = tokens.reduce((sum, token) => sum + (title.has(token) ? 4 : 0) + (keys.has(token) ? 6 : 0) + (body.has(token) ? 0.2 : 0), 0)
      + (followUp && doc.id === previousId ? 20 : 0);
    return { doc, score };
  }).filter((item) => item.score >= 4).sort((a, b) => b.score - a.score);
  if (!ranked.length) return { text: 'I do not have a verified answer to that in the Smohix HQ sources. Try a product name or a question about APIs, pricing, security, or pilots. For broader help, open Smohix AI or contact the team.', sources: documents.filter((d) => d.id === 'contact') };
  const sources = ranked.filter((item) => item.score >= ranked[0].score * 0.8).slice(0, 2).map((item) => item.doc);
  return { text: sources.map((doc) => doc.answer).join('\n\n'), sources };
}
