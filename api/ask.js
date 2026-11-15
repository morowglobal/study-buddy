// POST /api/ask { question } -> { answer, notFound, sources, cited, model }
// The same file runs locally (server.js) and on Vercel as a serverless function.

import { answer } from '../src/rag.js';
import { config } from '../src/config.js';

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export async function POST(request) {
  let question;
  try {
    question = String((await request.json())?.question ?? '').trim();
  } catch {
    return json({ error: 'Send JSON like { "question": "..." }' }, 400);
  }
  if (!question) return json({ error: 'Ask a question first.' }, 400);
  if (question.length > config.maxQuestionChars) return json({ error: `Keep it under ${config.maxQuestionChars} characters.` }, 400);

  try {
    return json(await answer(question));
  } catch (error) {
    console.error('[ask]', error.message);
    const status = error.code === 'ENOENT' ? 503 : 502;
    return json({ error: status === 503 ? 'No notes indexed yet. Run npm run ingest.' : 'The AI did not answer. Try again in a moment.' }, status);
  }
}
