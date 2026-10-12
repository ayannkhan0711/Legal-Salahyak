/**
 * modules/rag/retriever.js
 * Vector retrieval using MongoDB Atlas Vector Search.
 *
 * Flow:
 *  1. (Optional) Query rewriting – expand abbreviations, add context
 *  2. Embed the (rewritten) query
 *  3. Run $vectorSearch on the LegalChunk collection (top-k)
 *  4. Filter: prefer in_force, flag repealed chunks
 *  5. Return chunks with metadata for citation building
 */
import { LegalChunk } from './LegalChunk.model.js';
import { getEmbedding } from './embeddingProvider.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

/**
 * Rewrite query to improve retrieval.
 * Expands common Indian legal abbreviations.
 * @param {string} query
 * @returns {string}
 */
function rewriteQuery(query) {
  const expansions = {
    'IPC': 'Indian Penal Code / Bharatiya Nyaya Sanhita',
    'BNS': 'Bharatiya Nyaya Sanhita 2023',
    'CrPC': 'Code of Criminal Procedure / Bharatiya Nagarik Suraksha Sanhita',
    'BNSS': 'Bharatiya Nagarik Suraksha Sanhita 2023',
    'RTI': 'Right to Information Act 2005',
    'DV Act': 'Protection of Women from Domestic Violence Act 2005',
    'IT Act': 'Information Technology Act 2000',
    'DPDP': 'Digital Personal Data Protection Act 2023',
    'CPC': 'Code of Civil Procedure 1908',
  };
  let rewritten = query;
  for (const [abbr, full] of Object.entries(expansions)) {
    rewritten = rewritten.replace(new RegExp(`\\b${abbr}\\b`, 'gi'), full);
  }
  return rewritten;
}

/**
 * Retrieve top-k relevant legal chunks for a given query.
 * @param {string} query
 * @param {{ language?: string, actFilter?: string, k?: number }} opts
 * @returns {Promise<Array<{ text: string, metadata: object, score: number }>>}
 */
export async function retrieve(query, opts = {}) {
  const { language = 'en', actFilter = null, k = env.VECTOR_TOP_K } = opts;

  const rewritten = rewriteQuery(query);
  logger.debug({ original: query, rewritten }, 'RAG query (possibly rewritten)');

  const queryEmbedding = await getEmbedding(rewritten);

  // Build Atlas Vector Search aggregation pipeline
  const pipeline = [
    {
      $vectorSearch: {
        index: env.ATLAS_VECTOR_INDEX,
        path: 'embedding',
        queryVector: queryEmbedding,
        numCandidates: k * 10, // over-fetch then filter
        limit: k,
        filter: {
          // Prefer in_force; actFilter narrows to a specific act
          ...(actFilter ? { act: actFilter } : {}),
        },
      },
    },
    {
      $project: {
        text: 1,
        act: 1,
        section: 1,
        chapter: 1,
        year: 1,
        status: 1,
        language: 1,
        sourceUrl: 1,
        score: { $meta: 'vectorSearchScore' },
        _id: 0,
      },
    },
  ];

  let results = [];
  try {
    results = await LegalChunk.aggregate(pipeline);
  } catch (vectorErr) {
    logger.warn(`Atlas $vectorSearch failed (${vectorErr.message}). Using fallback keyword search.`);
    // Split rewritten query into keywords for regex search
    const words = rewritten
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .slice(0, 5);
    const regex = new RegExp(words.join('|'), 'i');

    const docs = await LegalChunk.find({
      ...(actFilter ? { act: actFilter } : {}),
      $or: [{ text: regex }, { section: regex }, { act: regex }],
    }).limit(k);

    results = docs.map((doc) => ({
      text: doc.text,
      act: doc.act,
      section: doc.section,
      chapter: doc.chapter,
      year: doc.year,
      status: doc.status,
      language: doc.language,
      sourceUrl: doc.sourceUrl,
      score: doc.status === 'in_force' ? 0.85 : 0.65,
    }));
  }

  // Sort: in_force chunks first, then by score descending
  results.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'in_force' ? -1 : 1;
    return b.score - a.score;
  });

  logger.debug(`Retrieval returned ${results.length} chunks`);
  return results;
}
