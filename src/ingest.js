// npm run ingest  ->  reads notes/, chunks them, embeds them, saves data/vectors.json

import { buildIndex } from './rag.js';

try {
  const index = await buildIndex();
  const sample = index.chunks[0];
  console.log(`\nFirst chunk (${sample.id}, ${sample.heading}):\n${sample.text.slice(0, 200)}...`);
  console.log(`Its vector starts with: [${sample.vector.slice(0, 5).map((n) => n.toFixed(3)).join(', ')}, ...]`);
} catch (error) {
  console.error(`\nIngest failed: ${error.message}`);
  process.exit(1);
}
