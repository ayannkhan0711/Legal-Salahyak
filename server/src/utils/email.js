/**
 * utils/email.js
 * Nodemailer email sender. Gracefully no-ops if SMTP is not configured.
 */
import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from './logger.js';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!env.SMTP_HOST || !env.SMTP_USER) {
    logger.warn('SMTP not configured – emails will be logged to console only');
    return null;
  }
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  return transporter;
}

/**
 * Send an email.
 * @param {{ to: string, subject: string, text: string, html?: string }} opts
 */
export async function sendEmail({ to, subject, text, html }) {
  const t = getTransporter();
  if (!t) {
    // Development fallback: log to console
    logger.info({ to, subject, text }, '📧  [DEV] Email (not sent – SMTP not configured)');
    return;
  }
  await t.sendMail({ from: env.EMAIL_FROM, to, subject, text, html });
}
