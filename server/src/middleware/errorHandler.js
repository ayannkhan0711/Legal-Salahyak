/**
 * middleware/errorHandler.js
 * Global Express error handler. Returns uniform JSON error responses.
 * Never leaks stack traces in production.
 */
import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  // Zod validation errors (thrown by validateRequest middleware)
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.flatten().fieldErrors,
      },
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      error: { code: 'CONFLICT', message: `${field} already exists.` },
    });
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: { code: 'BAD_REQUEST', message: 'Invalid ID format' },
    });
  }

  // Our own ApiError
  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      logger.error({ err, req: { method: req.method, url: req.url } }, err.message);
    }
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
    });
  }

  // Unhandled error – log fully, return generic message
  logger.error({ err, req: { method: req.method, url: req.url } }, 'Unhandled error');
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred. Please try again later.',
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}
