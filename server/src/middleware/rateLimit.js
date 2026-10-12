/**
 * middleware/rateLimit.js
 * express-rate-limit configurations. Stricter for unauthenticated auth routes.
 */
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const isDev = env.NODE_ENV === 'development';

// Helper: standard error response
const handler = (req, res) => {
  res.status(429).json({
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please try again later.',
    },
  });
};

/** Auth routes – very tight (10 per 15 min) */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 200 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

/** AI / agent routes – moderate (30 per min) */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 500 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

/** Document upload routes – tight (5 per 5 min) */
export const uploadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: isDev ? 100 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

/** General API – broad limit (200 per 15 min) */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 2000 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});
