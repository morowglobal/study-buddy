// Talking to Google Gemini with plain fetch. No SDK, so you can see exactly what is sent.

import { config } from './config.js';

const API = 'https://generativelanguage.googleapis.com/v1beta/models';

function apiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is missing. Copy .env.example to .env and paste your key.');
  return key;
}

async function post(url, body, { retries = 3 } = {}) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey() },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) return data;

    // 429 = free-tier rate limit. Wait a bit and try again instead of failing.
    if (res.status === 429 && attempt < retries) {
      await new Promise((r) => setTimeout(r, 5000 * (attempt + 1)));
      continue;
    }
    const error = new Error(`Gemini ${res.status}: ${data?.error?.message ?? 'request failed'}`);
    error.status = res.status;
    throw error;
  }
}

/**
 * STEP 2: EMBEDDINGS
 * Turn texts into vectors (lists of numbers). Similar meaning = similar numbers.
 * taskType tells Gemini whether it is embedding notes (DOCUMENT) or a question (QUERY).
 */
export async function embed(texts, taskType = 'RETRIEVAL_DOCUMENT') {
  const model = config.embedModel;
  const vectors = [];
  // The API takes up to 100 texts per request.
  for (let i = 0; i < texts.length; i += 100) {
    const batch = texts.slice(i, i + 100);
    const data = await post(`${API}/${model}:batchEmbedContents`, {
      requests: batch.map((text) => ({
        model: `models/${model}`,
        content: { parts: [{ text }] },
        taskType,
        outputDimensionality: config.embedDimensions,
      })),
    });
    vectors.push(...data.embeddings.map((e) => e.values));
  }
  return vectors;
}

export async function embedQuestion(question) {
  const [vector] = await embed([question], 'RETRIEVAL_QUERY');
  return vector;
}

// Newer Gemini models "think" before answering, which is slow. Turn it down.
const thinking = (model) => (model.includes('2.5') ? { thinkingBudget: 0 } : { thinkingLevel: 'minimal' });

/** STEP 4: ask the chat model. Tries each model in config.chatModels until one answers. */
export async function generate({ system, prompt }) {
  let lastError;
  for (const model of [...new Set(config.chatModels)]) {
    const body = {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 800, thinkingConfig: thinking(model) },
    };
    try {
      let data;
      try {
        data = await post(`${API}/${model}:generateContent`, body, { retries: 1 });
      } catch (error) {
        // Some models do not accept the thinking setting: ask again without it.
        if (error.status !== 400 || !/thinking/i.test(error.message)) throw error;
        delete body.generationConfig.thinkingConfig;
        data = await post(`${API}/${model}:generateContent`, body, { retries: 1 });
      }
      const text = (data?.candidates?.[0]?.content?.parts ?? [])
        .filter((p) => !p.thought)
        .map((p) => p.text ?? '')
        .join('')
        .trim();
      if (text) return { text, model };
      lastError = new Error(`${model} gave an empty answer`);
    } catch (error) {
      lastError = error;
      // A wrong key fails on every model, so stop right away.
      if (error.status === 401 || error.status === 403) break;
    }
  }
  throw lastError ?? new Error('No chat model answered');
}
