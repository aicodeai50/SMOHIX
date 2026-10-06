import { SEARCH_INDEX } from '../lib/experience/search-index';
import { API_GROUPS } from '../lib/docs/api-catalog';
import { USE_CASES } from '../lib/experience/use-cases';
import assert from 'node:assert/strict';
import { buildHqGuideDocuments } from '../lib/hq/guide-data';
import { answerHqQuestion } from '../lib/hq/guide-search';
import { getAllRegistryProducts } from '../lib/product-registry';
const documents = buildHqGuideDocuments();
for (const product of getAllRegistryProducts()) {
  const result = answerHqQuestion(`What is ${product.publicName}?`, documents);
  assert(result.sources.some((source) => source.id === product.id), `Missing grounded answer for ${product.publicName}`);
}
const live = answerHqQuestion('Which products are live?', documents);
assert(live.text.includes('Smohix Assistant') && live.text.includes('Smohix PRI'));
const pri = answerHqQuestion('What is Smohix PRI?', documents);
assert(pri.sources[0].id === 'private-ai');
assert(answerHqQuestion('Is it live?', documents, 'private-ai').sources[0].id === 'private-ai');
assert(answerHqQuestion('How do I manage API keys?', documents).sources[0].id === 'api-access');
assert(answerHqQuestion('What are the prices?', documents).text.includes('$29'));
assert(answerHqQuestion('Tell me about LAB', documents).text.includes('does not yet have a verified'));
assert(answerHqQuestion('quantum banana portal', documents).text.includes('do not have a verified answer'));
assert(!answerHqQuestion('My key is sk-private123456789abcdef', documents).text.includes('private123'));
for(const question of ['what is smohix about','What is Smohix?','Tell me about Smohix','What does Smohix do?','What does Smohix offer?','Explain Smohix.run',"What's Smohix?",'What is the purpose of Smohix?']){
  const answer=answerHqQuestion(question,documents);
  assert.equal(answer.sources[0]?.id,'site-overview',`Missing company introduction: ${question}`);
  assert(answer.text.includes('Smohix Technologies'));
}
assert.notEqual(answerHqQuestion('What is Smohix AI?',documents).sources[0]?.id,'site-overview');
const comparison=answerHqQuestion('What is the difference between Smohix AI and Assistant?',documents);
assert(comparison.sources.some(source=>source.id==='smohix-ai'));
assert(comparison.sources.some(source=>source.id==='smohix-assistant'));
assert(answerHqQuestion('Where can I open PRI?',documents).text.includes('https://pri.smohix.run'));
assert(answerHqQuestion('Explain the Smohix ecosystem domains',documents).text.includes('https://assistant.smohix.run'));
assert(answerHqQuestion('What is the HQ chatbot?',documents).text.includes('separate personal productivity workspace'));
assert(documents.some(doc=>doc.id==='service-workflow-automation'));
assert(documents.some(doc=>doc.id==='solution-enterprise-ai'));
for(const page of SEARCH_INDEX.filter(entry=>entry.category!=='product')){
  assert(documents.some(doc=>doc.href===page.href),`Missing site page ${page.href}`);
}
for(const group of API_GROUPS){for(const operation of group.operations){
  const result=answerHqQuestion(`Explain ${operation.method} ${operation.path}`,documents);
  assert(result.sources.some(source=>source.title.includes(operation.path)),`Missing API answer ${operation.path}`);
}}
for(const item of USE_CASES){assert(documents.some(doc=>doc.id===`use-case-${item.id}`));}
assert(answerHqQuestion('What technology stack does the site use?',documents).text.includes('Next.js'));
assert(answerHqQuestion('Where do I login?',documents).sources.some(source=>source.id==='workspace-access'));
assert(answerHqQuestion('Where is the roadmap?',documents).sources.some(source=>source.href==='/next'));
assert(answerHqQuestion('Where are the careers?',documents).sources.some(source=>source.href==='/careers'));
console.log(`test-hq-guide: all checks passed (${documents.length} public source entries)`);

for (const question of ['What is Smohix Workshop?', 'Can Smohix build a company project from scratch?']) {
  const result = answerHqQuestion(question, documents);
  assert(result.sources.some((source) => source.id === 'smohix-workshop'), `Missing Workshop guidance: ${question}`);
  assert(result.text.includes('planned'));
}
