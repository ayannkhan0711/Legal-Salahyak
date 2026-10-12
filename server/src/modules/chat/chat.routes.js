/**
 * modules/chat/chat.routes.js
 * Agent conversation endpoints with SSE streaming.
 *
 * POST /api/v1/agent/conversations            – create new conversation
 * GET  /api/v1/agent/conversations            – list user's conversations
 * PATCH /api/v1/agent/conversations/:id       – rename conversation
 * DELETE /api/v1/agent/conversations/:id      – delete conversation
 * POST /api/v1/agent/conversations/:id/messages – send a message (SSE stream)
 */
import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth.js';
import { aiLimiter } from '../../middleware/rateLimit.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { Conversation } from './Conversation.model.js';
import { ApiError } from '../../utils/apiError.js';
import { retrieve } from '../rag/retriever.js';
import { streamResponse } from '../rag/llmProvider.js';
import { LEGAL_AGENT_SYSTEM_PROMPT, buildRAGUserMessage } from '../rag/prompts.js';
import { logger } from '../../utils/logger.js';

const router = Router();
router.use(authenticate);

// ── Schemas ─────────────────────────────────────────────────

const createConversationSchema = z.object({
  body: z.object({
    language: z.enum(['en', 'hi']).optional().default('en'),
    title: z.string().max(200).optional(),
  }),
});

const sendMessageSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(4000),
    language: z.enum(['en', 'hi']).optional(),
  }),
  params: z.object({ id: z.string().length(24) }),
});

const renameSchema = z.object({
  body: z.object({ title: z.string().min(1).max(200) }),
  params: z.object({ id: z.string().length(24) }),
});

// ── Routes ───────────────────────────────────────────────────

/** POST /api/v1/agent/conversations */
router.post(
  '/',
  validate(createConversationSchema),
  asyncHandler(async (req, res) => {
    const { language = 'en', title } = req.body;
    const conv = await Conversation.create({
      userId: req.user._id,
      language,
      title: title || 'New Conversation',
      messages: [],
    });
    res.status(201).json({ success: true, data: { conversation: conv } });
  }),
);

/** GET /api/v1/agent/conversations */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const conversations = await Conversation.find({
      userId: req.user._id,
      isArchived: false,
    })
      .select('title language createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(50);
    res.json({ success: true, data: { conversations } });
  }),
);

/** GET /api/v1/agent/conversations/:id */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const conv = await Conversation.findOne({ _id: req.params.id, userId: req.user._id });
    if (!conv) throw ApiError.notFound('Conversation not found');
    res.json({ success: true, data: { conversation: conv } });
  }),
);

/** PATCH /api/v1/agent/conversations/:id – rename */
router.patch(
  '/:id',
  validate(renameSchema),
  asyncHandler(async (req, res) => {
    const conv = await Conversation.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { title: req.body.title },
      { new: true },
    );
    if (!conv) throw ApiError.notFound('Conversation not found');
    res.json({ success: true, data: { conversation: conv } });
  }),
);

/** DELETE /api/v1/agent/conversations/:id */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const conv = await Conversation.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!conv) throw ApiError.notFound('Conversation not found');
    res.json({ success: true, message: 'Conversation deleted.' });
  }),
);

/**
 * POST /api/v1/agent/conversations/:id/messages
 * Streams the AI response via Server-Sent Events (SSE).
 *
 * Client should connect with Accept: text/event-stream.
 * Each event has data: <chunk_text>
 * Final event: data: [DONE] with the full message and citations.
 */
router.post(
  '/:id/messages',
  aiLimiter,
  validate(sendMessageSchema),
  asyncHandler(async (req, res) => {
    const conv = await Conversation.findOne({ _id: req.params.id, userId: req.user._id });
    if (!conv) throw ApiError.notFound('Conversation not found');

    const { content, language } = req.body;
    const effectiveLanguage = language || conv.language || 'en';

    // Persist the user message
    conv.messages.push({ role: 'user', content });
    await conv.save();

    // ── RAG retrieval ───────────────────────────────────────
    const chunks = await retrieve(content, { language: effectiveLanguage }).catch((err) => {
      logger.error({ err }, 'RAG retrieval failed; falling back to no context');
      return [];
    });

    const userMessage = buildRAGUserMessage(content, chunks, effectiveLanguage);

    // Convert conversation history for LLM (last 10 turns to stay within context window)
    const history = conv.messages.slice(-20, -1).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // ── SSE streaming ───────────────────────────────────────
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    let fullResponse = '';

    try {
      for await (const chunk of streamResponse(LEGAL_AGENT_SYSTEM_PROMPT, userMessage, history)) {
        fullResponse += chunk;
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }

      // Build citations from retrieved chunks
      const citations = chunks.map((c) => ({
        act: c.act,
        section: c.section,
        year: c.year,
        status: c.status,
        sourceUrl: c.sourceUrl,
        excerpt: c.text.slice(0, 200),
      }));

      // Persist the assistant message
      conv.messages.push({ role: 'assistant', content: fullResponse, citations });
      conv.updatedAt = new Date();
      await conv.save();

      // Signal completion with citations
      res.write(`data: ${JSON.stringify({ done: true, citations })}\n\n`);
    } catch (err) {
      logger.error({ err }, 'Streaming error');
      res.write(`data: ${JSON.stringify({ error: 'AI generation failed. Please try again.' })}\n\n`);
    } finally {
      res.end();
    }
  }),
);

export default router;
