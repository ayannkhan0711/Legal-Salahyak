/**
 * modules/rag/LegalChunk.model.js
 * Stores law text chunks with vector embeddings for Atlas Vector Search.
 *
 * Atlas Search index definition (create manually in Atlas UI or via API):
 * {
 *   "fields": [{
 *     "type": "vector",
 *     "path": "embedding",
 *     "numDimensions": 768,   // 768 for Gemini text-embedding-004, 1536 for OpenAI ada-002
 *     "similarity": "cosine"
 *   }]
 * }
 */
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const legalChunkSchema = new Schema(
  {
    // ── Source metadata ──────────────────────────────────────
    act: { type: String, required: true, index: true },   // "Indian Contract Act"
    section: { type: String },                             // "Section 2(h)"
    chapter: { type: String },                             // "Chapter II"
    year: { type: Number, index: true },
    jurisdiction: { type: String, default: 'India' },

    status: {
      type: String,
      enum: ['in_force', 'repealed'],
      default: 'in_force',
      index: true,
    },
    language: { type: String, enum: ['en', 'hi'], default: 'en', index: true },
    sourceUrl: { type: String },                           // URL on indiacode.nic.in or egazette
    version: { type: Number, default: 1 },                 // incremented on re-ingestion

    // ── Content ─────────────────────────────────────────────
    text: { type: String, required: true },
    chunkIndex: { type: Number },                          // position in parent document
    tokenCount: { type: Number },

    // ── Embedding ────────────────────────────────────────────
    // Stored as a plain array; Atlas Vector Search indexes it.
    embedding: { type: [Number], required: true },
  },
  { timestamps: true },
);

// Compound index for metadata filtering during retrieval
legalChunkSchema.index({ act: 1, status: 1, language: 1 });

export const LegalChunk = model('LegalChunk', legalChunkSchema);
