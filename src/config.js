// Every setting in one place, so you can experiment without hunting through files.

export const config = {
  notesDir: 'notes',
  indexFile: 'data/vectors.json',

  // Step 1: chunking. "paragraphs" respects headings and paragraphs (good).
  // "words" just cuts every N words (the naive version we debug in the video).
  chunker: 'paragraphs',
  chunkWords: 150,

  // Step 2: embeddings. 768 numbers per chunk keeps vectors.json small.
  embedModel: process.env.EMBED_MODEL || 'gemini-embedding-001',
  embedDimensions: 768,

  // Step 3: search. How many chunks we hand to the AI.
  topK: 3,

  // Step 4: the chat model. If one model is busy or retired, the next one answers.
  chatModels: [process.env.GEMINI_MODEL, 'gemini-flash-latest', 'gemini-3-flash-preview', 'gemini-flash-lite-latest'].filter(Boolean),

  maxQuestionChars: 300,
};
