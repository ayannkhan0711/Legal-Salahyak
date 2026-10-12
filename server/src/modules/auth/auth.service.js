/**
 * modules/auth/auth.service.js
 * Core authentication business logic.
 * Issues access (15m) and refresh (7d) tokens in httpOnly cookies.
 * Supports refresh token rotation and revocation.
 */
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { env } from '../../config/env.js';
import { User } from './User.model.js';
import { ApiError } from '../../utils/apiError.js';
import { AuditLog } from '../admin/AuditLog.model.js';
import { logger } from '../../utils/logger.js';
import { sendEmail } from '../../utils/email.js';

// ── Token generation ────────────────────────────────────────

function generateAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, email: user.email },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN },
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), type: 'refresh' },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN },
  );
}

/** Attach httpOnly cookies to the response */
export function setTokenCookies(res, accessToken, refreshToken) {
  const isProduction = env.NODE_ENV === 'production';
  const cookieOpts = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'Strict' : 'Lax',
    path: '/',
  };

  res.cookie('accessToken', accessToken, {
    ...cookieOpts,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  res.cookie('refreshToken', refreshToken, {
    ...cookieOpts,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/v1/auth/refresh', // restrict refresh token scope
  });
}

export function clearTokenCookies(res) {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' });
}

// ── OTP helpers ─────────────────────────────────────────────

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
}

// ── Service methods ─────────────────────────────────────────

/**
 * Register a new user.
 */
export async function registerUser({ name, email, password, role = 'user', state, language }) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw ApiError.conflict('An account with this email already exists.');

  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash: password, // pre-save hook will bcrypt this
    role,
    state,
    preferredLanguage: language || 'en',
    otp,
    otpExpiry,
  });

  // Send OTP email (non-blocking)
  sendEmail({
    to: user.email,
    subject: 'Verify your LegalSahayak account',
    text: `Your verification OTP is: ${otp}. It expires in 10 minutes.`,
    html: `<p>Your verification OTP is: <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
  }).catch((e) => logger.error({ e }, 'OTP email failed'));

  return user;
}

/**
 * Log in and return tokens.
 */
export async function loginUser({ email, password }, res) {
  const user = await User.findOne({ email: email.toLowerCase(), deletedAt: null })
    .select('+passwordHash +refreshTokenHashes');

  if (!user) throw ApiError.unauthorized('Invalid email or password.');
  if (!(await user.comparePassword(password))) throw ApiError.unauthorized('Invalid email or password.');
  if (user.isSuspended) throw ApiError.forbidden('Account suspended. Contact support.');

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store hash of refresh token (keep latest 5 for multi-device)
  const rtHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  user.refreshTokenHashes = [...(user.refreshTokenHashes || []).slice(-4), rtHash];
  await user.save();

  setTokenCookies(res, accessToken, refreshToken);

  return { user, accessToken };
}

/**
 * Rotate the refresh token.
 */
export async function refreshAccessToken(refreshToken, res) {
  let payload;
  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token.');
  }

  const user = await User.findById(payload.sub).select('+refreshTokenHashes');
  if (!user) throw ApiError.unauthorized('User not found.');

  const rtHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  if (!user.refreshTokenHashes?.includes(rtHash)) {
    // Possible token reuse attack – revoke all refresh tokens
    user.refreshTokenHashes = [];
    await user.save();
    throw ApiError.unauthorized('Refresh token already used. Please log in again.');
  }

  // Rotate: remove old hash, add new one
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);
  const newRtHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');

  user.refreshTokenHashes = user.refreshTokenHashes.filter((h) => h !== rtHash);
  user.refreshTokenHashes.push(newRtHash);
  await user.save();

  setTokenCookies(res, newAccessToken, newRefreshToken);
  return { accessToken: newAccessToken };
}

/**
 * Verify OTP sent during registration.
 */
export async function verifyOTP({ email, otp }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+otp +otpExpiry');
  if (!user) throw ApiError.notFound('User not found.');
  if (!user.otp || user.otp !== otp) throw ApiError.badRequest('Invalid OTP.');
  if (new Date() > user.otpExpiry) throw ApiError.badRequest('OTP has expired. Please request a new one.');

  user.isEmailVerified = true;
  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();
  return user;
}

/**
 * Logout – revoke the specific refresh token.
 */
export async function logoutUser(userId, refreshToken, res) {
  const user = await User.findById(userId).select('+refreshTokenHashes');
  if (user && refreshToken) {
    const rtHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    user.refreshTokenHashes = (user.refreshTokenHashes || []).filter((h) => h !== rtHash);
    await user.save();
  }
  clearTokenCookies(res);
}

/**
 * Write an audit log entry.
 */
export async function writeAuditLog({ actorId, actorRole, action, target, metadata, req }) {
  try {
    await AuditLog.create({
      actorId,
      actorRole,
      action,
      target,
      metadata,
      ip: req?.ip,
      userAgent: req?.headers?.['user-agent'],
    });
  } catch (e) {
    logger.error({ e }, 'Audit log write failed');
  }
}
