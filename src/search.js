// STEP 3: SEARCH
// Find the chunks whose meaning is closest to the question.

/**
 * Cosine similarity: how much two vectors point the same way.
 * 1 = same meaning, 0 = unrelated. We only compare directions, not lengths.
 */
export function cosine(a, b) {
  let dot = 0;
  let lengthA = 0;
  let lengthB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    lengthA += a[i] * a[i];
    lengthB += b[i] * b[i];
  }
  if (!lengthA || !lengthB) return 0;
  return dot / (Math.sqrt(lengthA) * Math.sqrt(lengthB));
}

/** Score every chunk against the question vector and keep the best k. */
export function search(questionVector, chunks, k = 3) {
  return chunks
    .map((chunk) => ({ ...chunk, score: cosine(questionVector, chunk.vector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
