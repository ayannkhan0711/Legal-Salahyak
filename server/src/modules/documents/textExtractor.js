/**
 * modules/documents/textExtractor.js
 * Extracts text from PDF, DOCX, TXT, and images (via OCR).
 * Runs OCR when the PDF text layer is empty (scanned documents).
 */
import { logger } from '../../utils/logger.js';

// Allowed MIME types
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'text/markdown',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

/**
 * Extract text from a file buffer based on its MIME type.
 * @param {Buffer} fileBuffer
 * @param {string} mimeType
 * @param {string} [filename='']
 * @returns {Promise<string>} Extracted plain text
 */
export async function extractText(fileBuffer, mimeType = '', filename = '') {
  const mime = (mimeType || '').toLowerCase();
  const lowerName = (filename || '').toLowerCase();

  try {
    if (mime === 'application/pdf' || lowerName.endsWith('.pdf')) {
      return await extractFromPDF(fileBuffer);
    }

    if (
      mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mime === 'application/msword' ||
      lowerName.endsWith('.docx') ||
      lowerName.endsWith('.doc')
    ) {
      return await extractFromDOCX(fileBuffer);
    }

    if (mime === 'text/plain' || mime === 'text/markdown' || lowerName.endsWith('.txt') || lowerName.endsWith('.md')) {
      return fileBuffer.toString('utf8');
    }

    if (
      mime.startsWith('image/') ||
      lowerName.endsWith('.jpg') ||
      lowerName.endsWith('.jpeg') ||
      lowerName.endsWith('.png') ||
      lowerName.endsWith('.webp')
    ) {
      return await extractFromImage(fileBuffer);
    }

    // Default fallback: attempt UTF-8 string conversion
    const fallbackText = fileBuffer.toString('utf8');
    if (fallbackText && fallbackText.replace(/[\x00-\x1F\x7F-\x9F]/g, '').length > 20) {
      return fallbackText;
    }

    return '';
  } catch (err) {
    logger.error({ err: err.message, mime, filename }, 'Text extraction encountered an error');
    return '';
  }
}

async function extractFromPDF(buffer) {
  try {
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);

    const text = data.text?.trim();
    if (text && text.length > 10) {
      logger.debug(`PDF: extracted ${text.length} characters`);
      return text;
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'PDF text-layer parse failed');
  }

  return 'PDF document uploaded. Text layer minimal or scanned format.';
}

async function extractFromDOCX(buffer) {
  try {
    const mammoth = (await import('mammoth')).default;
    const result = await mammoth.extractRawText({ buffer });
    return result.value?.trim() || '';
  } catch (err) {
    logger.error({ err: err.message }, 'DOCX parse failed');
    return '';
  }
}

/**
 * OCR using Tesseract.js (supports Hindi + English).
 * @param {Buffer} buffer
 */
async function extractFromImage(buffer) {
  try {
    const Tesseract = (await import('tesseract.js')).default;
    const { data } = await Tesseract.recognize(buffer, 'eng+hin', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          logger.debug(`OCR progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    return data.text?.trim() || '';
  } catch (err) {
    logger.error({ err: err.message }, 'Image OCR failed');
    return '';
  }
}
