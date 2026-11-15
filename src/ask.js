// npm run ask -- "why does my average become NaN?"

import { answer } from './rag.js';

const question = process.argv.slice(2).join(' ').trim();
if (!question) {
  console.log('Usage: npm run ask -- "your question"');
  process.exit(1);
}

try {
  const result = await answer(question);
  console.log('\nTop chunks found:');
  result.sources.forEach((s, i) => console.log(`  [${i + 1}] ${s.score.toFixed(3)}  ${s.id}  ${s.heading}`));
  console.log(`\nAnswer (${result.model}):\n${result.answer}\n`);
} catch (error) {
  console.error(error.code === 'ENOENT' ? 'No index yet. Run: npm run ingest' : `Failed: ${error.message}`);
  process.exit(1);
}
