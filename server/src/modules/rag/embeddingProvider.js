/**
 * modules/rag/embeddingProvider.js
 * Abstract embedding provider. Swappable via AI_PROVIDER env variable.
 * Supports Gemini (default) and OpenAI.
 *
 * All public API: getEmbedding(text) → number[]
 *                 batchEmbeddings(texts) → number[][]
 */
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

// ── Gemini Embedding ─────────────────────────────────────────

async function geminiEmbed(texts) {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: env.GEMINI_EMBEDDING_MODEL });

  const embeddings = [];
  for (const text of texts) {
    const result = await model.embedContent(text);
    embeddings.push(result.embedding.values);
  }
  return embeddings;
}

// ── OpenAI Embedding ─────────────────────────────────────────

async function openaiEmbed(texts) {
  const { default: OpenAI } = await import('openai');
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  const res = await openai.embeddings.create({
    model: env.OPENAI_EMBEDDING_MODEL,
    input: texts,
  });
  return res.data.map((d) => d.embedding);
}

function generateMockEmbedding(text, dim = 768) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  const vec = new Array(dim);
  let norm = 0;
  for (let i = 0; i < dim; i++) {
    const val = Math.sin(hash + i);
    vec[i] = val;
    norm += val * val;
  }
  norm = Math.sqrt(norm);
  return vec.map((v) => Number((v / norm).toFixed(6)));
}

// ── Public API ───────────────────────────────────────────────

/**
 * Get embedding vector for a single text.
 * @param {string} text
 * @returns {Promise<number[]>}
 */
export async function getEmbedding(text) {
  const [embedding] = await batchEmbeddings([text]);
  return embedding;
}

/**
 * Get embeddings for an array of texts.
 * Automatically batches in groups of 20 to avoid API limits.
 * @param {string[]} texts
 * @returns {Promise<number[][]>}
 */
export async function batchEmbeddings(texts) {
  const hasKey =
    (env.AI_PROVIDER === 'gemini' && env.GEMINI_API_KEY && !env.GEMINI_API_KEY.includes('your_')) ||
    (env.AI_PROVIDER === 'openai' && env.OPENAI_API_KEY && !env.OPENAI_API_KEY.includes('your_'));

  if (!hasKey) {
    logger.debug('No valid LLM API key provided. Using synthetic vector embedding.');
    return texts.map((t) => generateMockEmbedding(t));
  }

  const BATCH_SIZE = 20;
  const results = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    logger.debug(`Embedding batch ${i / BATCH_SIZE + 1}: ${batch.length} texts`);

    try {
      const embedFn = env.AI_PROVIDER === 'openai' ? openaiEmbed : geminiEmbed;
      const batchResult = await embedFn(batch);
      results.push(...batchResult);
    } catch (err) {
      logger.warn(`Live embedding call failed: ${err.message}. Falling back to deterministic vectors.`);
      results.push(...batch.map((t) => generateMockEmbedding(t)));
    }

    // Respect rate limits
    if (i + BATCH_SIZE < texts.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  return results;
}
