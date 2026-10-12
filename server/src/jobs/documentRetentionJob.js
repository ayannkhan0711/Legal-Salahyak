/**
 * jobs/documentRetentionJob.js
 * Scans for expired or soft-deleted documents, securely removes physical
 * files from disk, and cleans up document records (DPDP compliance).
 */
import fs from 'fs';
import { Document } from '../modules/documents/Document.model.js';
import { logger } from '../utils/logger.js';

export async function runDocumentRetentionJob() {
  logger.info('🧹 Running Document Retention & Cleanup Job...');

  try {
    const now = new Date();
    // Match either explicitly expired or soft-deleted more than 24 hours ago
    const expiredDocs = await Document.find({
      $or: [
        { retentionUntil: { $lte: now } },
        { deletedAt: { $lte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
      ],
    }).limit(100);

    let cleanedCount = 0;

    for (const doc of expiredDocs) {
      if (doc.encryptedPath && fs.existsSync(doc.encryptedPath)) {
        try {
          fs.unlinkSync(doc.encryptedPath);
          logger.debug(`Deleted disk file: ${doc.encryptedPath}`);
        } catch (fileErr) {
          logger.warn(`Could not delete file ${doc.encryptedPath}: ${fileErr.message}`);
        }
      }

      await Document.deleteOne({ _id: doc._id });
      cleanedCount++;
    }

    logger.info(`✅ Document Retention Job finished. Purged ${cleanedCount} expired documents.`);
  } catch (err) {
    logger.error(err, '❌ Error in Document Retention Job');
  }
}
