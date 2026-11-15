// The whole RAG pipeline in one place: build the index once, then answer questions from it.

import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { config } from './config.js';
import { chunkFile } from './chunk.js';
import { embed, embedQuestion, generate } from './gemini.js';
import { search } from './search.js';

/** What we embed for each chunk: the heading gives the numbers extra context. */
const embedText = (chunk) => (chunk.heading ? `${chunk.heading}\n\n${chunk.text}` : chunk.text);

/** PREP (run once, or when notes change): notes -> chunks -> vectors -> data/vectors.json */
export async function buildIndex({ root = process.cwd(), log = console.log } = {}) {
  const dir = path.join(root, config.notesDir);
  const files = (await readdir(dir)).filter((f) => /\.(md|txt)$/i.test(f)).sort();

  const chunks = [];
  for (const file of files) {
    const text = await readFile(path.join(dir, file), 'utf8');
    chunks.push(...chunkFile(text, file, config));
  }
  log(`Step 1: ${files.length} notes files -> ${chunks.length} chunks`);

  const vectors = await embed(chunks.map(embedText));
  chunks.forEach((chunk, i) => (chunk.vector = vectors[i]));
  log(`Step 2: ${vectors.length} vectors with ${vectors[0]?.length ?? 0} numbers each`);

  const index = { model: config.embedModel, chunker: config.chunker, chunkWords: config.chunkWords, createdAt: new Date().toISOString(), chunks };
  const out = path.join(root, config.indexFile);
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, JSON.stringify(index));
  log(`Saved ${config.indexFile}`);
  return index;
}

let cached;
export async function loadIndex(root = process.cwd()) {
  if (!cached) cached = JSON.parse(await readFile(path.join(root, config.indexFile), 'utf8'));
  return cached;
}

export const NOT_FOUND = "That's not in your notes.";

// A citation is [1] on its own. scores[3] is code (an array index), not a citation.
export const CITATION = /(?<![\w\]])\[(\d+)\]/g;

const SYSTEM = `You are a study buddy. You answer ONLY from the student's notes given to you.
Rules:
- Use only facts from the NOTES. Never use outside knowledge, even if you know the answer.
- If the notes do not contain the answer, reply exactly: ${NOT_FOUND}
- After each fact, cite the note it came from like [1] or [2].
- Be short and clear: 2 to 5 sentences, like a friend explaining it before an exam.`;

/** Build the prompt: numbered notes first, then the question. */
export function buildPrompt(question, sources) {
  const notes = sources.map((s, i) => `[${i + 1}] (${s.source}${s.heading ? `, ${s.heading}` : ''})\n${s.text}`).join('\n\n');
  return `NOTES:\n${notes}\n\nQUESTION: ${question}`;
}

/** ASK (every question): question -> vector -> top chunks -> answer with sources */
export async function answer(question, { root } = {}) {
  const index = await loadIndex(root);
  const questionVector = await embedQuestion(question);
  const found = search(questionVector, index.chunks, config.topK);
  const sources = found.map(({ vector, ...rest }) => rest); // the browser does not need the numbers

  const { text, model } = await generate({ system: SYSTEM, prompt: buildPrompt(question, sources) });
  const cited = [...new Set([...text.matchAll(CITATION)].map((m) => Number(m[1])))].filter((n) => n >= 1 && n <= sources.length);

  return { answer: text, notFound: text.includes(NOT_FOUND), sources, cited, model, searched: index.chunks.length };
}
