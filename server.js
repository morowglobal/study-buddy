// npm run dev -> http://localhost:3000
// A tiny local server: serves public/ and sends /api/ask to api/ask.js. No Express needed.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { POST } from './api/ask.js';

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC = path.resolve('public');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/api/ask') {
    if (req.method !== 'POST') return res.writeHead(405).end();
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const response = await POST(new Request(url, { method: 'POST', headers: req.headers, body: Buffer.concat(chunks) }));
    res.writeHead(response.status, { 'Content-Type': 'application/json' });
    return res.end(await response.text());
  }

  // Static files. path.resolve + startsWith stops "../" from reading files outside public/.
  const file = path.resolve(PUBLIC, '.' + (url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname)));
  if (!file.startsWith(PUBLIC + path.sep)) return res.writeHead(403).end();
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(PORT, () => console.log(`Study buddy running on http://localhost:${PORT}`));
