/**
 * modules/auth/auth.routes.js
 * Auth endpoints: register, login, logout, refresh, verify-otp.
 */
import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { authLimiter } from '../../middleware/rateLimit.js';
import * as authService from './auth.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

// ── Schemas ─────────────────────────────────────────────────

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    email: z.string().email(),
    password: z
      .string()
      .min(8)
      .regex(/[A-Z]/, 'Must contain uppercase')
      .regex(/[0-9]/, 'Must contain a digit'),
    role: z.enum(['user', 'advocate']).optional(),
    state: z.string().optional(),
    language: z.enum(['en', 'hi']).optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email(),
    otp: z.string().length(6),
  }),
});

// ── Routes ──────────────────────────────────────────────────

/** POST /api/v1/auth/register */
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const user = await authService.registerUser(req.body);
    await authService.writeAuditLog({
      actorId: user._id,
      actorRole: user.role,
      action: 'auth.register',
      target: { model: 'User', id: user._id },
      req,
    });
    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email with the OTP sent.',
      data: { userId: user._id, email: user.email },
    });
  }),
);

/** POST /api/v1/auth/login */
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { user, accessToken } = await authService.loginUser(req.body, res);
    await authService.writeAuditLog({
      actorId: user._id,
      actorRole: user.role,
      action: 'auth.login',
      target: { model: 'User', id: user._id },
      req,
    });
    res.json({
      success: true,
      data: { user, accessToken },
    });
  }),
);

/** POST /api/v1/auth/logout */
router.post(
  '/logout',
  authenticate,
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;
    await authService.logoutUser(req.user._id, refreshToken, res);
    await authService.writeAuditLog({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: 'auth.logout',
      req,
    });
    res.json({ success: true, message: 'Logged out successfully.' });
  }),
);

/** POST /api/v1/auth/refresh */
router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'No refresh token provided.' },
      });
    }
    const { accessToken } = await authService.refreshAccessToken(refreshToken, res);
    res.json({ success: true, data: { accessToken } });
  }),
);

/** POST /api/v1/auth/verify-otp */
router.post(
  '/verify-otp',
  authLimiter,
  validate(verifyOtpSchema),
  asyncHandler(async (req, res) => {
    const user = await authService.verifyOTP(req.body);
    res.json({ success: true, message: 'Email verified successfully.', data: { user } });
  }),
);

/** GET /api/v1/auth/me – return current user */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const { User } = await import('./User.model.js');
    const user = await User.findById(req.user._id);
    if (!user) throw import('../../utils/apiError.js').then((m) => m.ApiError.notFound());
    res.json({ success: true, data: { user } });
  }),
);

export default router;
