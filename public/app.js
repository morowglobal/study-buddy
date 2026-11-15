// STEP 5: the chat page. Sends the question to /api/ask and shows the answer with its sources.

const chat = document.getElementById('chat');
const form = document.getElementById('form');
const input = document.getElementById('question');
const empty = document.getElementById('empty');
const submit = form.querySelector('button');

/** Turn text into safe HTML: never put AI text into the page without escaping it. */
const escape = (text) => text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

const scrollDown = () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

/** Escape first, then add small bits of formatting: `code`, **bold**, and [1] citation buttons. */
function formatAnswer(text) {
  return escape(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/(?<![\w\]])\[(\d+)\]/g, '<button type="button" class="cite" data-n="$1" aria-label="Show source $1">$1</button>');
}

function sourceCard(source, n, used) {
  const card = el('article', `source${used ? ' used' : ''}`);
  card.dataset.n = n;
  const pct = Math.max(0, Math.round(source.score * 100));
  card.innerHTML = `
    <div class="source-head">
      <span class="source-num">[${n}]</span>
      <span><b>${escape(source.source)}</b>${source.heading ? ` · ${escape(source.heading.split(' > ').pop())}` : ''}</span>
      <span class="score" title="How close this chunk is to your question">${source.score.toFixed(2)} <span class="bar"><i style="width:${pct}%"></i></span></span>
    </div>
    <p>${escape(source.text)}</p>
    <button type="button" class="more">show full chunk</button>`;
  card.querySelector('.more').addEventListener('click', (e) => {
    card.classList.toggle('open');
    e.target.textContent = card.classList.contains('open') ? 'show less' : 'show full chunk';
  });
  return card;
}

function showAnswer(data) {
  const bot = el('div', 'msg bot');
  bot.append(el('div', `answer${data.notFound ? ' missing' : ''}`, formatAnswer(data.answer)));

  if (!data.notFound) {
    const sources = el('div', 'sources');
    data.sources.forEach((s, i) => sources.append(sourceCard(s, i + 1, data.cited.includes(i + 1))));
    bot.append(sources);

    // Click a [1] in the answer: jump to that source and flash it.
    bot.addEventListener('click', (e) => {
      const n = e.target.closest('.cite')?.dataset.n;
      const card = n && sources.querySelector(`.source[data-n="${n}"]`);
      if (!card) return;
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('flash');
      setTimeout(() => card.classList.remove('flash'), 900);
    });
  }

  bot.append(el('div', 'meta', `searched ${data.searched} chunks · top ${data.sources.length} sent to ${escape(data.model)}`));
  chat.append(bot);
}

async function ask(question) {
  empty?.remove();
  chat.append(el('div', 'msg user', escape(question)));
  const loading = el('div', 'msg loading', '<span class="dots"><i></i><i></i><i></i></span> searching your notes…');
  chat.append(loading);
  scrollDown();
  submit.disabled = true;

  try {
    const res = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    loading.remove();
    if (!res.ok) throw new Error(data.error || 'Something went wrong.');
    showAnswer(data);
  } catch (error) {
    loading.remove();
    chat.append(el('div', 'msg error', escape(error.message)));
  } finally {
    submit.disabled = false;
    input.focus();
    scrollDown();
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const question = input.value.trim();
  if (!question || submit.disabled) return;
  input.value = '';
  ask(question);
});

document.getElementById('chips')?.addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON') ask(e.target.textContent);
});
