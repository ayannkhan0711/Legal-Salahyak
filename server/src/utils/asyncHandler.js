/**
 * utils/asyncHandler.js
 * Wraps async route handlers so errors are forwarded to next().
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
