/**
 * scripts/ingest.js
 * Ingestion script to load curated Indian law corpus into MongoDB Atlas.
 * Run with: npm run ingest
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { connectDB } from '../src/config/db.js';
import { LegalChunk } from '../src/modules/rag/LegalChunk.model.js';
import { chunkText, estimateTokens } from '../src/modules/rag/chunker.js';
import { batchEmbeddings } from '../src/modules/rag/embeddingProvider.js';
import { logger } from '../src/utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LAWS_DIR = path.resolve(__dirname, '../data/laws');

/**
 * Generate mock deterministic 768-dim embedding if no API keys are configured,
 * ensuring local development and testing never crash.
 */
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

async function runIngestion() {
  logger.info('🚀 Starting Indian Law Corpus Ingestion...');
  await connectDB();

  if (!fs.existsSync(LAWS_DIR)) {
    logger.error(`Laws directory not found at: ${LAWS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(LAWS_DIR).filter((f) => f.endsWith('.json'));
  logger.info(`Found ${files.length} law corpus data file(s)`);

  let totalChunksIngested = 0;

  for (const file of files) {
    const filePath = path.join(LAWS_DIR, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    logger.info(`Processing ${file} (${content.length} entries)...`);

    for (const item of content) {
      const { act, section, chapter, year, status, language, sourceUrl, text } = item;
      const chunks = chunkText(text, { act, section, chapter, year, status, language, sourceUrl });

      const textsToEmbed = chunks.map((c) => c.text);
      let embeddings = [];

      const hasApiKey =
        (env.AI_PROVIDER === 'gemini' && !!env.GEMINI_API_KEY && env.GEMINI_API_KEY !== 'your_gemini_api_key_here') ||
        (env.AI_PROVIDER === 'openai' && !!env.OPENAI_API_KEY && env.OPENAI_API_KEY !== 'your_openai_api_key_here');

      if (hasApiKey) {
        try {
          embeddings = await batchEmbeddings(textsToEmbed);
        } catch (err) {
          logger.warn(`API embedding failed (${err.message}). Using synthetic vector fallback for development.`);
          embeddings = textsToEmbed.map((t) => generateMockEmbedding(t));
        }
      } else {
        logger.info(`No active AI key found. Using synthetic embeddings (dim=768) for local offline testing.`);
        embeddings = textsToEmbed.map((t) => generateMockEmbedding(t));
      }

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = embeddings[i];

        await LegalChunk.findOneAndUpdate(
          {
            act: chunk.metadata.act,
            section: chunk.metadata.section,
            chunkIndex: chunk.metadata.chunkIndex || 0,
          },
          {
            act: chunk.metadata.act,
            section: chunk.metadata.section,
            chapter: chunk.metadata.chapter,
            year: chunk.metadata.year || 2024,
            status: chunk.metadata.status || 'in_force',
            language: chunk.metadata.language || 'en',
            sourceUrl: chunk.metadata.sourceUrl || '',
            text: chunk.text,
            chunkIndex: chunk.metadata.chunkIndex || 0,
            tokenCount: estimateTokens(chunk.text),
            embedding,
          },
          { upsert: true, new: true },
        );
        totalChunksIngested++;
      }
    }
  }

  logger.info(`✅ Ingestion complete! Total ${totalChunksIngested} legal chunks saved to database.`);
  await mongoose.disconnect();
  process.exit(0);
}

runIngestion().catch((err) => {
  logger.error(err, '❌ Ingestion failed');
  process.exit(1);
});
