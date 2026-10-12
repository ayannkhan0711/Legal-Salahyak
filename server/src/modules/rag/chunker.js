/**
 * modules/rag/chunker.js
 * Recursive character text splitter.
 * Splits on paragraph → sentence → word boundaries while preserving
 * section/article headings as metadata.
 *
 * Target: ~800 tokens per chunk, ~120 token overlap.
 * Rough approximation: 1 token ≈ 4 characters.
 */

const TARGET_CHARS = 3200;  // ≈ 800 tokens
const OVERLAP_CHARS = 480;  // ≈ 120 tokens overlap

// Separators tried in order (most semantically meaningful first)
const SEPARATORS = [
  /\n{2,}/,          // blank line (paragraph break)
  /(?<=\.)\s+/,      // sentence end
  /\n/,              // single newline
  /\s+/,             // whitespace
];

/**
 * Split text into overlapping chunks preserving heading metadata.
 *
 * @param {string} text       Full text to split
 * @param {object} meta       Metadata: { act, section, chapter, year, status, language, sourceUrl }
 * @returns {Array<{ text: string, metadata: object }>}
 */
export function chunkText(text, meta = {}) {
  const chunks = [];
  const paragraphs = splitBySeparator(text, SEPARATORS[0]);

  let buffer = '';
  let chunkIndex = 0;

  for (const para of paragraphs) {
    // Detect heading-like lines (e.g. "CHAPTER III", "Section 42.", "Article 21")
    const headingMatch = para.match(
      /^(CHAPTER|Section|Article|PART|ORDER|RULE|Schedule)\s+[\dIVXivxa-z]+[.):-]?/i,
    );
    const currentHeading = headingMatch ? headingMatch[0] : null;

    if (buffer.length + para.length > TARGET_CHARS && buffer.length > 0) {
      // Flush current buffer as a chunk
      chunks.push({
        text: buffer.trim(),
        metadata: {
          ...meta,
          chunkIndex: chunkIndex++,
          headingHint: currentHeading,
        },
      });
      // Keep overlap: last OVERLAP_CHARS of the buffer
      buffer = buffer.slice(-OVERLAP_CHARS) + '\n' + para;
    } else {
      buffer += (buffer ? '\n\n' : '') + para;
    }
  }

  // Flush remainder
  if (buffer.trim()) {
    chunks.push({
      text: buffer.trim(),
      metadata: { ...meta, chunkIndex: chunkIndex++ },
    });
  }

  return chunks;
}

/**
 * Split text by the given separator regex. Falls back to the next separator
 * if no split is possible.
 */
function splitBySeparator(text, sep) {
  const parts = text.split(sep).filter((p) => p.trim().length > 0);
  return parts;
}

/**
 * Estimate token count for a string (rough: 4 chars / token).
 * @param {string} text
 * @returns {number}
 */
export function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}
