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
console.log('test-hq-guide: all checks passed');
