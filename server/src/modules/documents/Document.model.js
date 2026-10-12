/**
 * modules/documents/Document.model.js
 * Uploaded document record. Actual file is encrypted and stored on disk.
 * extractedText and analysis are encrypted at the field level.
 */
import mongoose from 'mongoose';
import { env } from '../../config/env.js';

const { Schema, model } = mongoose;

// Structured document analysis returned by the AI
const analysisSchema = new Schema(
  {
    inOneLine: String,
    whatItSays: [String],   // 3–6 bullet points
    whatToDo: [String],     // actions and deadlines
    yourRights: [String],   // RAG-grounded legal rights with citations
    risksOrRedFlags: [String],
    suggestedNextStep: String,
    citations: [
      {
        act: String,
        section: String,
        year: Number,
        status: { type: String, enum: ['in_force', 'repealed'], default: 'in_force' },
        sourceUrl: String,
      },
    ],
  },
  { _id: false },
);

const documentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true }, // bytes

    // Encrypted file storage
    encryptedPath: { type: String, required: true }, // path on disk (random UUID filename)
    encryptionIv: { type: String, required: true },
    encryptionAuthTag: { type: String, required: true },

    status: {
      type: String,
      enum: ['uploaded', 'processing', 'analysed', 'error'],
      default: 'uploaded',
      index: true,
    },
    errorMessage: String,

    // Encrypted extracted text (may be large)
    extractedTextEncrypted: { type: String, default: null },

    // Structured analysis (encrypted JSON string)
    analysisEncrypted: { type: String, default: null },

    // Quick-access unencrypted summary fields
    documentType: { type: String, default: null }, // "rent_agreement", "FIR", etc.
    documentTypeConfidence: Number,
    detectedLanguage: { type: String, default: 'en' },
    parties: [String],

    // Retention
    retentionUntil: {
      type: Date,
      default: () => {
        const d = new Date();
        d.setDate(d.getDate() + (env.DOCUMENT_RETENTION_DAYS || 30));
        return d;
      },
    },
    deletedAt: { type: Date, default: null }, // user-triggered soft delete
  },
  { timestamps: true },
);

// TTL index so MongoDB auto-deletes expired records (physical file cleanup is done by a job)
documentSchema.index({ retentionUntil: 1 }, { expireAfterSeconds: 0 });

export const Document = model('Document', documentSchema);
