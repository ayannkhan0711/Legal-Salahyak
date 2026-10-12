/**
 * jobs/index.js
 * Initializes and schedules background cron/interval tasks.
 */
import { runDocumentRetentionJob } from './documentRetentionJob.js';
import { runPayoutSettlementJob } from './payoutSettlementJob.js';
import { logger } from '../utils/logger.js';

export function startBackgroundJobs() {
  logger.info('⏱️ Initializing background jobs...');

  // Run initial retention check after 10 seconds of startup
  setTimeout(() => {
    runDocumentRetentionJob();
    runPayoutSettlementJob();
  }, 10000);

  // Periodic intervals:
  // Document retention: every 24 hours
  setInterval(runDocumentRetentionJob, 24 * 60 * 60 * 1000);

  // Payout settlement: every 1 hour
  setInterval(runPayoutSettlementJob, 60 * 60 * 1000);
}
