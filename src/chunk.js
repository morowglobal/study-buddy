// STEP 1: CHUNKING
// Split long notes into small pieces, so search can find the ONE piece that answers a question.

const countWords = (text) => text.split(/\s+/).filter(Boolean).length;

/**
 * The naive way: cut every `size` words, no matter where we are.
 * Cuts sentences in half and mixes topics in one chunk. Kept for the debugging chapter.
 */
export function chunkByWords(text, source, size = 500) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks = [];
  for (let i = 0; i < words.length; i += size) {
    chunks.push({ source, heading: '', text: words.slice(i, i + size).join(' ') });
  }
  return chunks;
}

/** Read markdown line by line into sections: [{ title, heading, paragraphs: [] }]. */
function toSections(markdown) {
  const sections = [];
  let title = '';
  let current = { title, heading: '', paragraphs: [] };
  let paragraph = [];
  let inCode = false;

  const endParagraph = () => {
    if (paragraph.length) current.paragraphs.push(paragraph.join('\n').trim());
    paragraph = [];
  };

  for (const line of markdown.replace(/\r\n/g, '\n').split('\n')) {
    if (line.trim().startsWith('```')) inCode = !inCode; // never split inside a code block

    const heading = !inCode && line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      endParagraph();
      sections.push(current);
      if (heading[1] === '#') title = heading[2].trim();
      current = { title, heading: heading[1] === '#' ? '' : heading[2].trim(), paragraphs: [] };
    } else if (!inCode && line.trim() === '') {
      endParagraph();
    } else {
      paragraph.push(line);
    }
  }
  endParagraph();
  sections.push(current);
  return sections.filter((s) => s.paragraphs.length);
}

/**
 * The good way: start a new chunk at every heading, never cut a paragraph in half,
 * and keep the heading with the chunk so it knows what it is about.
 */
export function chunkByParagraphs(markdown, source, maxWords = 150) {
  const chunks = [];
  for (const section of toSections(markdown)) {
    const heading = [section.title, section.heading].filter(Boolean).join(' > ');
    let parts = [];
    let words = 0;
    for (const paragraph of section.paragraphs) {
      const size = countWords(paragraph);
      if (parts.length && words + size > maxWords) {
        chunks.push({ source, heading, text: parts.join('\n\n') });
        parts = [];
        words = 0;
      }
      parts.push(paragraph);
      words += size;
    }
    if (parts.length) chunks.push({ source, heading, text: parts.join('\n\n') });
  }
  return chunks;
}

/** Chunk one notes file with the chosen strategy, and give every chunk an id like "02-arrays-and-loops.md#3". */
export function chunkFile(markdown, source, { chunker = 'paragraphs', chunkWords = 150 } = {}) {
  const chunks = chunker === 'words' ? chunkByWords(markdown, source, chunkWords) : chunkByParagraphs(markdown, source, chunkWords);
  return chunks.map((chunk, i) => ({ id: `${source}#${i + 1}`, ...chunk }));
}
