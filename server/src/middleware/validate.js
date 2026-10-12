/**
 * middleware/validate.js
 * Zod-based request validation middleware factory.
 * Usage: validate(schema) where schema is a Zod object schema for { body?, query?, params? }.
 */
import { z } from 'zod';

/**
 * @param {z.ZodSchema} schema
 */
export function validate(schema) {
  return (req, _res, next) => {
    try {
      const result = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      // Replace req fields with validated (and possibly coerced) data
      req.body = result.body ?? req.body;
      req.query = result.query ?? req.query;
      req.params = result.params ?? req.params;
      next();
    } catch (err) {
      next(err); // ZodError → caught by errorHandler
    }
  };
}
