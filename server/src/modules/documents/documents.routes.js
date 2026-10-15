/**
 * modules/documents/documents.routes.js
 * Document upload, analysis, listing, and deletion.
 *
 * POST   /api/v1/documents/upload   – direct upload & analysis (works for guests & logged in users)
 * POST   /api/v1/documents          – upload & analyze
 * POST   /api/v1/documents/scan     – scan document
 * POST   /api/v1/documents/:id/analyze – get/run analysis on existing document
 * GET    /api/v1/documents          – list user's documents (authenticated)
 * GET    /api/v1/documents/:id      – get document + analysis
 * DELETE /api/v1/documents/:id      – soft-delete (user can purge their data)
 */
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../../middleware/auth.js';
import { uploadLimiter } from '../../middleware/rateLimit.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/apiError.js';
import { Document } from './Document.model.js';
import { User } from '../auth/User.model.js';
import { encryptBuffer, decryptBuffer } from '../../utils/crypto.js';
import { extractText, ALLOWED_MIME_TYPES } from './textExtractor.js';
import { encryptField, decryptField } from '../../utils/crypto.js';
import { complete } from '../rag/llmProvider.js';
import { retrieve } from '../rag/retriever.js';
import { DOCUMENT_CLASSIFY_PROMPT, DOCUMENT_ANALYSIS_PROMPT, buildRAGUserMessage } from '../rag/prompts.js';
import { analyzeDocumentContent } from './documentAnalyzer.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

const router = Router();

// ── Optional Auth Middleware ─────────────────────────────────

async function optionalAuthenticate(req, _res, next) {
  try {
    let token = req.cookies?.accessToken;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
      const user = await User.findById(payload.sub).select('role email isSuspended deletedAt');
      if (user && !user.deletedAt && !user.isSuspended) {
        req.user = { _id: user._id, role: user.role, email: user.email };
      }
    }
  } catch {
    // Guest user or unverified token - proceed without req.user
  }
  next();
}

// ── Multer storage (memory – we encrypt before writing to disk) ───

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const mime = (file.mimetype || '').toLowerCase();
    const ext = path.extname(file.originalname || '').toLowerCase();
    const isAllowedExt = ['.pdf', '.docx', '.doc', '.txt', '.md', '.jpg', '.jpeg', '.png', '.webp'].includes(ext);

    if (ALLOWED_MIME_TYPES.includes(mime) || mime.startsWith('image/') || isAllowedExt) {
      cb(null, true);
    } else {
      cb(ApiError.badRequest(`File type not allowed. Allowed: PDF, DOCX, TXT, JPG, PNG`));
    }
  },
});

// Accepts either 'file' or 'document' field name
const uploadAny = upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'document', maxCount: 1 },
]);

// Helper to extract the uploaded file from multer
function getUploadedFile(req) {
  if (req.file) return req.file;
  if (req.files?.file?.[0]) return req.files.file[0];
  if (req.files?.document?.[0]) return req.files.document[0];
  return null;
}

// ── Document Analysis Engine ─────────────────────────────────

/**
 * Executes full analysis on file buffer based on the actual extracted text.
 */
async function processAndAnalyzeDocument(buffer, originalname, mimetype, language = 'en') {
  // Step 1: Extract real text from the uploaded document
  let extractedText = await extractText(buffer, mimetype, originalname);

  // If extraction returned very little, provide a descriptive string based on filename
  if (!extractedText || extractedText.trim().length < 10) {
    extractedText = `Document: ${originalname}. Content could not be read as text layer.`;
  }

  // Step 2: Run content-aware grounded Indian legal document analysis
  let analysis = analyzeDocumentContent(extractedText, originalname, language);

  // Step 3: If a live AI key is provided and functional, attempt LLM enhancement
  const hasLiveAiKey =
    (env.AI_PROVIDER === 'gemini' && env.GEMINI_API_KEY && !env.GEMINI_API_KEY.includes('your_') && !env.GEMINI_API_KEY.startsWith('AQ.')) ||
    (env.AI_PROVIDER === 'openai' && env.OPENAI_API_KEY && !env.OPENAI_API_KEY.includes('your_'));

  if (hasLiveAiKey && extractedText.length > 50) {
    try {
      const truncatedText = extractedText.slice(0, 8000);
      const relevantChunks = await retrieve(
        `${analysis.documentType} ${truncatedText.slice(0, 400)}`,
        { language },
      ).catch(() => []);

      const contextMessage = buildRAGUserMessage(
        `Analyse this legal document and explain it to the user in plain language:\n<<<DOCUMENT_START>>>\n${truncatedText}\n<<<DOCUMENT_END>>>`,
        relevantChunks,
        language,
      );

      const aiResponse = await complete(DOCUMENT_ANALYSIS_PROMPT, contextMessage);
      const jsonText = aiResponse.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      const aiAnalysis = JSON.parse(jsonText);

      if (aiAnalysis && aiAnalysis.inOneLine && Array.isArray(aiAnalysis.whatItSays)) {
        analysis = {
          ...analysis,
          ...aiAnalysis,
          documentType: aiAnalysis.documentType || analysis.documentType,
        };
      }
    } catch (err) {
      logger.warn({ err: err.message }, 'Live LLM enhancement skipped; utilizing grounded content analyzer');
    }
  }

  return { analysis, extractedText };
}

// ── Shared Upload Handler ────────────────────────────────────

const handleDocumentUploadAndAnalysis = asyncHandler(async (req, res) => {
  const uploadedFile = getUploadedFile(req);
  if (!uploadedFile) {
    throw ApiError.badRequest('No file provided. Please attach a document (PDF, DOCX, TXT, or Image).');
  }

  const { buffer, originalname, mimetype, size } = uploadedFile;
  const language = req.body.language || 'en';

  logger.info({ filename: originalname, size, mimetype }, 'Processing document upload');

  // Perform content analysis
  const { analysis, extractedText } = await processAndAnalyzeDocument(buffer, originalname, mimetype, language);

  let docRecord = null;

  // If user is authenticated, persist encrypted document in DB
  if (req.user && req.user._id) {
    try {
      const uploadDir = path.resolve(env.UPLOAD_DIR);
      await fs.mkdir(uploadDir, { recursive: true });

      const { iv, authTag, data: encryptedData } = encryptBuffer(buffer);
      const randomFilename = `${uuidv4()}.enc`;
      const filePath = path.join(uploadDir, randomFilename);
      await fs.writeFile(filePath, encryptedData);

      const extractedTextEncrypted = encryptField(extractedText);
      const analysisEncrypted = encryptField(JSON.stringify(analysis));

      docRecord = await Document.create({
        userId: req.user._id,
        originalName: originalname,
        mimeType: mimetype,
        size,
        encryptedPath: filePath,
        encryptionIv: iv,
        encryptionAuthTag: authTag,
        status: 'analysed',
        documentType: analysis.documentType,
        documentTypeConfidence: analysis.confidence || 0.95,
        detectedLanguage: language,
        parties: [],
        extractedTextEncrypted,
        analysisEncrypted,
      });
    } catch (dbErr) {
      logger.error({ err: dbErr.message }, 'Failed to persist document to DB, returning analysis directly');
    }
  }

  const documentId = docRecord ? docRecord._id : `doc_${uuidv4().slice(0, 12)}`;

  res.status(200).json({
    success: true,
    message: 'Document analysed successfully.',
    data: {
      document: {
        _id: documentId,
        originalName: originalname,
        mimeType: mimetype,
        size,
        status: 'analysed',
        documentType: analysis.documentType,
        confidence: analysis.confidence,
        analysis,
        extractedTextPreview: extractedText.slice(0, 600),
      },
      analysis,
      extractedText: extractedText.slice(0, 4000),
    },
  });
});

// ── Upload Routes (support /upload, /scan, and root /) ────────

router.post('/upload', optionalAuthenticate, uploadLimiter, uploadAny, handleDocumentUploadAndAnalysis);
router.post('/scan', optionalAuthenticate, uploadLimiter, uploadAny, handleDocumentUploadAndAnalysis);
router.post('/', optionalAuthenticate, uploadLimiter, uploadAny, handleDocumentUploadAndAnalysis);

// ── POST /api/v1/documents/:id/analyze ─────────────────────────

router.post(
  '/:id/analyze',
  optionalAuthenticate,
  asyncHandler(async (req, res) => {
    const docId = req.params.id;

    if (docId && docId.startsWith('doc_')) {
      // Ephemeral ID
      return res.json({
        success: true,
        data: {
          document: { _id: docId, status: 'analysed' },
        },
      });
    }

    if (!req.user) {
      throw ApiError.unauthorized('Authentication required to retrieve saved document analysis.');
    }

    const doc = await Document.findOne({ _id: docId, userId: req.user._id, deletedAt: null });
    if (!doc) throw ApiError.notFound('Document not found.');

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
          documentType: doc.documentType,
          status: doc.status,
          analysis,
        },
        analysis,
      },
    });
  }),
);

// ── GET /api/v1/documents (User's Document History) ───────────

router.get(
  '/',
  authenticate,
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
  authenticate,
  asyncHandler(async (req, res) => {
    const doc = await Document.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null });
    if (!doc) throw ApiError.notFound('Document not found.');

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
  authenticate,
  asyncHandler(async (req, res) => {
    const doc = await Document.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null });
    if (!doc) throw ApiError.notFound('Document not found.');

    doc.deletedAt = new Date();
    await doc.save();

    try {
      await fs.unlink(doc.encryptedPath);
    } catch {
      logger.warn({ docId: doc._id }, 'Could not delete encrypted file');
    }

    res.json({ success: true, message: 'Document deleted successfully.' });
  }),
);

export default router;
