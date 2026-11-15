import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chunkByParagraphs, chunkByWords, chunkFile } from '../src/chunk.js';
import { cosine, search } from '../src/search.js';
import { buildPrompt, CITATION } from '../src/rag.js';

test('citations: [1] counts, scores[3] (code) does not', () => {
  const found = [...'It reads scores[3], which is undefined [1]. See arr[0][2] too [2].'.matchAll(CITATION)].map((m) => m[1]);
  assert.deepEqual(found, ['1', '2']);
});

const notes = `# Week 2: Arrays

## Arrays

An array is an ordered list.

Indexes start at 0.

## Loops

\`\`\`js
for (let i = 0; i < 3; i++) {

  console.log(i);
}
\`\`\`

Use < not <=.`;

test('paragraph chunker starts a new chunk at each heading and keeps the heading', () => {
  const chunks = chunkByParagraphs(notes, 'n.md', 150);
  assert.equal(chunks.length, 2);
  assert.equal(chunks[0].heading, 'Week 2: Arrays > Arrays');
  assert.match(chunks[0].text, /ordered list[\s\S]*start at 0/);
  assert.equal(chunks[1].heading, 'Week 2: Arrays > Loops');
});

test('a code block with a blank line inside stays in one piece', () => {
  const [, loops] = chunkByParagraphs(notes, 'n.md', 150);
  assert.match(loops.text, /for \(let i = 0[\s\S]*console\.log\(i\);\n\}\n```/);
});

test('long sections are split at paragraph boundaries', () => {
  const para = (w) => Array.from({ length: w }, () => 'word').join(' ');
  const chunks = chunkByParagraphs(`## A\n\n${para(100)}\n\n${para(100)}\n\n${para(40)}`, 'n.md', 150);
  assert.deepEqual(chunks.map((c) => c.text.split(/\s+/).length), [100, 140]);
});

test('word chunker cuts blindly every N words', () => {
  const chunks = chunkByWords('a b c d e f g', 'n.md', 3);
  assert.deepEqual(chunks.map((c) => c.text), ['a b c', 'd e f', 'g']);
});

test('chunkFile gives every chunk an id', () => {
  assert.deepEqual(chunkFile(notes, 'n.md').map((c) => c.id), ['n.md#1', 'n.md#2']);
});

test('cosine: same direction 1, opposite -1, unrelated 0', () => {
  assert.equal(cosine([1, 2], [2, 4]).toFixed(5), '1.00000');
  assert.equal(cosine([1, 0], [-1, 0]), -1);
  assert.equal(cosine([1, 0], [0, 1]), 0);
  assert.equal(cosine([0, 0], [1, 1]), 0);
});

test('search returns the k closest chunks, best first', () => {
  const chunks = [
    { id: 'a', vector: [1, 0] },
    { id: 'b', vector: [0.9, 0.1] },
    { id: 'c', vector: [0, 1] },
  ];
  assert.deepEqual(search([1, 0], chunks, 2).map((c) => c.id), ['a', 'b']);
});

test('prompt numbers the notes so the AI can cite them', () => {
  const prompt = buildPrompt('why NaN?', [{ source: 'n.md', heading: 'Loops', text: 'off by one' }]);
  assert.match(prompt, /\[1\] \(n\.md, Loops\)\noff by one/);
  assert.match(prompt, /QUESTION: why NaN\?$/);
});
