# Study Buddy: an AI that answers only from your notes

A small RAG (Retrieval-Augmented Generation) app. Ask a question, and it finds the 3 most relevant pieces of your notes, answers using only those, and shows you the source. If the answer is not in your notes, it says so instead of making something up.

Built for the Morow Global tutorial: [morowglobal.com](https://morowglobal.com)

- No database: the "vector store" is one JSON file
- No npm packages: Node 20.6+ and plain `fetch` to the Gemini API (free tier)
- About 300 lines of code you can read in one sitting

## How it works

```
PREP (once)                          ASK (every question)
notes/*.md                           "why does my loop give NaN?"
   | 1. chunk                           | embed the question
[chunk][chunk][chunk]...             [0.03, -0.71, ...]
   | 2. embed each chunk                | 3. cosine similarity vs every chunk
data/vectors.json  ----------------> top 3 chunks
                                        | 4. answer ONLY from them, cite [1] [2]
                                     answer + sources
```

| Step | File | What it does |
|---|---|---|
| 1. Chunk | `src/chunk.js` | Splits notes at headings and paragraphs (max ~150 words), keeps the heading with each chunk |
| 2. Embed | `src/gemini.js` | Turns each chunk into 768 numbers with `gemini-embedding-001` |
| 3. Search | `src/search.js` | Cosine similarity between the question and every chunk, keeps the top 3 |
| 4. Answer | `src/rag.js` | Sends the numbered chunks + strict rules to Gemini, collects the citations |
| 5. Chat UI | `public/` | Chat page with source cards; click a [1] to jump to its source |
| API | `api/ask.js` | `POST /api/ask { question }`, runs locally and on Vercel |

All settings (chunk size, top K, models) are in `src/config.js`.

## Run it

1. Get a free API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Copy `.env.example` to `.env` and paste the key after `GEMINI_API_KEY=`
3. Put your notes in `notes/` as `.md` or `.txt` files (sample JavaScript class notes included)

```bash
npm run ingest                                 # notes -> data/vectors.json
npm run ask -- "why does my average become NaN?"   # try it in the terminal
npm run dev                                    # chat page on http://localhost:3000
npm test                                       # unit tests, no key needed
```

Run `npm run ingest` again whenever your notes change.

## Deploy (Vercel, free)

1. Run `npm run ingest` and commit `data/vectors.json` (it holds your notes text and vectors, no secrets)
2. Import the repo on [vercel.com](https://vercel.com), framework preset "Other"
3. Add `GEMINI_API_KEY` under Settings > Environment Variables, then deploy

Your key stays on the server. The browser only ever talks to `/api/ask`.

## License

MIT
