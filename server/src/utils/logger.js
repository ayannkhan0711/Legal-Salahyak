/**
 * utils/logger.js
 * Pino logger with pretty printing in dev, JSON in production.
 * PII masking rules are applied here to prevent Aadhaar/PAN/phone
 * numbers from appearing in logs.
 */
import pino from 'pino';
import { env } from '../config/env.js';

// Regex patterns for PII masking
const AADHAAR_RE = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;
const PAN_RE = /\b[A-Z]{5}\d{4}[A-Z]\b/g;
const PHONE_RE = /\b[6-9]\d{9}\b/g;

function maskPII(obj) {
  if (typeof obj === 'string') {
    return obj
      .replace(AADHAAR_RE, 'XXXX-XXXX-XXXX')
      .replace(PAN_RE, 'XXXXX####X')
      .replace(PHONE_RE, 'XXXXXXXXXX');
  }
  return obj;
}

const transport =
  env.NODE_ENV === 'development'
    ? {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' },
      }
    : undefined;

export const logger = pino({
  level: env.LOG_LEVEL,
  ...(transport ? { transport } : {}),
  // Apply PII masking to the msg field
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
  hooks: {
    logMethod(inputArgs, method) {
      if (inputArgs.length > 0) {
        inputArgs[inputArgs.length - 1] = maskPII(inputArgs[inputArgs.length - 1]);
      }
      return method.apply(this, inputArgs);
    },
  },
});
