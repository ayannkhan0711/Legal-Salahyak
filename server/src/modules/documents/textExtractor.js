/**
 * modules/documents/textExtractor.js
 * Extracts text from PDF, DOCX, TXT, and images (via OCR).
 * Runs OCR when the PDF text layer is empty (scanned documents).
 */
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../../utils/logger.js';

// Allowed MIME types
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

/**
 * Extract text from a file buffer based on its MIME type.
 * @param {Buffer} fileBuffer
 * @param {string} mimeType
 * @returns {Promise<string>} Extracted plain text
 */
export async function extractText(fileBuffer, mimeType) {
  const mime = mimeType.toLowerCase();

  if (mime === 'application/pdf') {
    return extractFromPDF(fileBuffer);
  }

  if (
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mime === 'application/msword'
  ) {
    return extractFromDOCX(fileBuffer);
  }

  if (mime === 'text/plain') {
    return fileBuffer.toString('utf8');
  }

  if (mime === 'image/jpeg' || mime === 'image/jpg' || mime === 'image/png') {
    return extractFromImage(fileBuffer);
  }

  throw new Error(`Unsupported MIME type: ${mimeType}`);
}

async function extractFromPDF(buffer) {
  try {
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);

    const text = data.text?.trim();
    if (text && text.length > 50) {
      logger.debug('PDF: text layer extracted successfully');
      return text;
    }

    // Text layer is empty or too short → likely a scanned PDF, run OCR
    logger.debug('PDF: empty text layer, falling back to OCR');
    return extractFromImage(buffer, 'pdf');
  } catch (err) {
    logger.error({ err }, 'PDF parse failed, attempting OCR fallback');
    return extractFromImage(buffer, 'pdf');
  }
}

async function extractFromDOCX(buffer) {
  const mammoth = (await import('mammoth')).default;
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

/**
 * OCR using Tesseract.js (supports Hindi + English).
 * @param {Buffer} buffer
 * @param {string} [hint] 'pdf' means we need to convert to image first
 */
async function extractFromImage(buffer, hint) {
  const Tesseract = (await import('tesseract.js')).default;

  // Tesseract supports 'hin+eng' for bilingual documents
  const { data } = await Tesseract.recognize(buffer, 'hin+eng', {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        logger.debug(`OCR progress: ${Math.round(m.progress * 100)}%`);
      }
    },
  });

  return data.text;
}
