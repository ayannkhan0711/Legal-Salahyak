/**
 * modules/documents/documents.routes.js
 * Document upload, analysis, listing, and deletion.
 *
 * POST   /api/v1/documents          – upload and queue for analysis
 * GET    /api/v1/documents          – list user's documents
 * GET    /api/v1/documents/:id      – get document + analysis
 * DELETE /api/v1/documents/:id      – soft-delete (user can purge their data)
 */
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../../middleware/auth.js';
import { uploadLimiter } from '../../middleware/rateLimit.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/apiError.js';
import { Document } from './Document.model.js';
import { encryptBuffer, decryptBuffer } from '../../utils/crypto.js';
import { extractText, ALLOWED_MIME_TYPES } from './textExtractor.js';
import { encryptField, decryptField } from '../../utils/crypto.js';
import { complete } from '../rag/llmProvider.js';
import { retrieve } from '../rag/retriever.js';
import { DOCUMENT_CLASSIFY_PROMPT, DOCUMENT_ANALYSIS_PROMPT, buildRAGUserMessage } from '../rag/prompts.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

const router = Router();
router.use(authenticate);

// ── Multer storage (memory – we encrypt before writing to disk) ───

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    // Validate by MIME type, not just extension
    if (ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(ApiError.badRequest(`File type not allowed. Allowed: PDF, DOCX, TXT, JPG, PNG`));
    }
  },
});

// ── POST /api/v1/documents ───────────────────────────────────

router.post(
  '/',
  uploadLimiter,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest('No file provided.');

    const { buffer, originalname, mimetype, size } = req.file;
    const language = req.body.language || 'en';

    // 1. Encrypt file and write to disk with a random UUID filename
    const uploadDir = path.resolve(env.UPLOAD_DIR);
    await fs.mkdir(uploadDir, { recursive: true });

    const { iv, authTag, data: encryptedData } = encryptBuffer(buffer);
    const randomFilename = `${uuidv4()}.enc`;
    const filePath = path.join(uploadDir, randomFilename);
    await fs.writeFile(filePath, encryptedData);

    // 2. Create document record with status 'uploaded'
    const doc = await Document.create({
      userId: req.user._id,
      originalName: originalname,
      mimeType: mimetype,
      size,
      encryptedPath: filePath,
      encryptionIv: iv,
      encryptionAuthTag: authTag,
      status: 'uploaded',
    });

    // 3. Kick off analysis asynchronously (don't block the HTTP response)
    res.status(202).json({
      success: true,
      message: 'Document uploaded. Analysis is in progress.',
      data: { documentId: doc._id, status: doc.status },
    });

    // Async analysis pipeline (fire and forget, updates DB)
    analyzeDocumentAsync(doc._id, buffer, mimetype, language).catch((err) =>
      logger.error({ err, docId: doc._id }, 'Document analysis failed'),
    );
  }),
);

/**
 * Full document analysis pipeline (runs in background after upload response).
 */
async function analyzeDocumentAsync(docId, fileBuffer, mimeType, language) {
  await Document.findByIdAndUpdate(docId, { status: 'processing' });

  try {
    // Step 1: Extract text
    const extractedText = await extractText(fileBuffer, mimeType);
    if (!extractedText || extractedText.trim().length < 10) {
      throw new Error('Could not extract meaningful text from the document.');
    }

    // Truncate to ~8000 chars for LLM context safety
    const truncatedText = extractedText.slice(0, 8000);

    // Step 2: Classify document type (fast single call)
    const classifyResponse = await complete(
      DOCUMENT_CLASSIFY_PROMPT,
      `Document text:\n<<<DOCUMENT_START>>>\n${truncatedText}\n<<<DOCUMENT_END>>>\n\nClassify this document.`,
    );

    let classification = { type: 'other', confidence: 0.5, parties: [], language: 'en' };
    try {
      // Strip potential markdown fences before parsing
      const jsonText = classifyResponse.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      classification = JSON.parse(jsonText);
    } catch {
      logger.warn({ classifyResponse }, 'Classification JSON parse failed');
    }

    // Step 3: RAG retrieval based on extracted text and document type
    const relevantChunks = await retrieve(
      `${classification.type} ${truncatedText.slice(0, 500)}`,
      { language },
    ).catch(() => []);

    const contextMessage = buildRAGUserMessage(
      `Analyse this legal document and explain it to the user in plain language:\n<<<DOCUMENT_START>>>\n${truncatedText}\n<<<DOCUMENT_END>>>`,
      relevantChunks,
      language,
    );

    // Step 4: Full analysis
    const analysisResponse = await complete(DOCUMENT_ANALYSIS_PROMPT, contextMessage);

    let analysis = null;
    try {
      const jsonText = analysisResponse.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      analysis = JSON.parse(jsonText);
    } catch {
      logger.warn({ analysisResponse }, 'Analysis JSON parse failed');
      analysis = {
        inOneLine: 'Document analysis completed.',
        whatItSays: [analysisResponse.slice(0, 500)],
        whatToDo: [],
        yourRights: [],
        risksOrRedFlags: [],
        suggestedNextStep: 'Consult a licensed advocate for specific legal advice.',
        citations: [],
      };
    }

    // Step 5: Encrypt and store extracted text and analysis
    const extractedTextEncrypted = encryptField(extractedText);
    const analysisEncrypted = encryptField(JSON.stringify(analysis));

    await Document.findByIdAndUpdate(docId, {
      status: 'analysed',
      extractedTextEncrypted,
      analysisEncrypted,
      documentType: classification.type,
      documentTypeConfidence: classification.confidence,
      detectedLanguage: classification.language,
      parties: classification.parties || [],
    });

    logger.info({ docId }, 'Document analysis completed');
  } catch (err) {
    logger.error({ err, docId }, 'Document analysis pipeline error');
    await Document.findByIdAndUpdate(docId, {
      status: 'error',
      errorMessage: err.message,
    });
  }
}

// ── GET /api/v1/documents ────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const docs = await Document.find({ userId: req.user._id, deletedAt: null })
      .select('originalName mimeType size status documentType createdAt retentionUntil')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: { documents: docs } });
  }),
);

// ── GET /api/v1/documents/:id ────────────────────────────────

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const doc = await Document.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null });
    if (!doc) throw ApiError.notFound('Document not found.');

    // Decrypt analysis on the fly before returning (never stored unencrypted)
    let analysis = null;
    if (doc.analysisEncrypted) {
      try {
        analysis = JSON.parse(decryptField(doc.analysisEncrypted));
      } catch {
        logger.error({ docId: doc._id }, 'Failed to decrypt analysis');
      }
    }

    res.json({
      success: true,
      data: {
        document: {
          _id: doc._id,
          originalName: doc.originalName,
          mimeType: doc.mimeType,
          size: doc.size,
          status: doc.status,
          errorMessage: doc.errorMessage,
          documentType: doc.documentType,
          documentTypeConfidence: doc.documentTypeConfidence,
          detectedLanguage: doc.detectedLanguage,
          parties: doc.parties,
          retentionUntil: doc.retentionUntil,
          createdAt: doc.createdAt,
          analysis,
        },
      },
    });
  }),
);

// ── DELETE /api/v1/documents/:id ─────────────────────────────

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const doc = await Document.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null });
    if (!doc) throw ApiError.notFound('Document not found.');

    // Soft-delete record and physically delete encrypted file
    doc.deletedAt = new Date();
    await doc.save();

    try {
      await fs.unlink(doc.encryptedPath);
    } catch {
      logger.warn({ docId: doc._id }, 'Could not delete encrypted file (may already be removed)');
    }

    res.json({ success: true, message: 'Document deleted successfully.' });
  }),
);

export default router;
