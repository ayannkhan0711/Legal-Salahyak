/**
 * middleware/auth.js
 * JWT authentication middleware.
 * Access token is read from httpOnly cookie 'accessToken'.
 * The middleware attaches req.user = { _id, role, email }.
 */
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/apiError.js';
import { env } from '../config/env.js';
import { User } from '../modules/auth/User.model.js';

/**
 * Verify the access token and attach req.user.
 * Throws 401 if missing or invalid.
 */
export async function authenticate(req, _res, next) {
  try {
    // Support both cookie and Authorization header (Bearer token) for flexibility
    let token = req.cookies?.accessToken;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw ApiError.unauthorized('Authentication required. Please log in.');
    }

    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);

    // Optionally check that the user still exists and isn't suspended
    const user = await User.findById(payload.sub).select('role email isSuspended deletedAt');
    if (!user || user.deletedAt) {
      throw ApiError.unauthorized('Account not found.');
    }
    if (user.isSuspended) {
      throw ApiError.forbidden('Your account has been suspended. Please contact support.');
    }

    req.user = { _id: user._id, role: user.role, email: user.email };
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    if (err.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Session expired. Please refresh your token.'));
    }
    if (err.name === 'JsonWebTokenError') {
      return next(ApiError.unauthorized('Invalid token.'));
    }
    next(err);
  }
}

/**
 * Role-based access control (RBAC) middleware factory.
 * Usage: rbac('admin') or rbac('admin', 'advocate')
 * @param {...string} roles
 */
export function rbac(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Access restricted to: ${roles.join(', ')}`));
    }
    next();
  };
}
