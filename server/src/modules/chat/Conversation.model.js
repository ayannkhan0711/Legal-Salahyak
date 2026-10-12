/**
 * modules/chat/Conversation.model.js
 * Stores agent chat conversations per user. Messages include citations from RAG.
 */
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const citationSchema = new Schema(
  {
    act: String,
    section: String,
    year: Number,
    status: { type: String, enum: ['in_force', 'repealed'], default: 'in_force' },
    sourceUrl: String,
    excerpt: String, // short quoted passage
  },
  { _id: false },
);

const messageSchema = new Schema(
  {
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    citations: [citationSchema],
    tokensUsed: Number, // for usage tracking
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const conversationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, default: 'New Conversation', maxlength: 200 },
    language: { type: String, enum: ['en', 'hi'], default: 'en' },
    messages: [messageSchema],
    // Linked document analysis (optional)
    linkedDocumentId: { type: Schema.Types.ObjectId, ref: 'Document', default: null },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true },
);

conversationSchema.index({ userId: 1, createdAt: -1 });

export const Conversation = model('Conversation', conversationSchema);
