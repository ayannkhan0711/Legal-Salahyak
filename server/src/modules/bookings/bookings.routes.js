/**
 * modules/bookings/bookings.routes.js
 * Booking creation with Razorpay order, listing, cancellation, and webhook.
 *
 * POST   /api/v1/bookings                – create booking + Razorpay order
 * GET    /api/v1/bookings                – user's bookings
 * PATCH  /api/v1/bookings/:id/cancel     – cancel booking
 * POST   /api/v1/payments/verify         – verify payment signature
 * POST   /api/v1/payments/webhook        – Razorpay webhook (raw body required)
 */
import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { authenticate, rbac } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/apiError.js';
import { Booking } from './Booking.model.js';
import { AdvocateProfile } from '../advocates/AdvocateProfile.model.js';
import { Consultation } from '../consultations/Consultation.model.js';
import { razorpay } from '../../config/razorpay.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// ── POST /api/v1/bookings ─────────────────────────────────────

const createBookingSchema = z.object({
  body: z.object({
    advocateId: z.string().length(24),
    mode: z.enum(['chat', 'video']),
    slotStart: z.string().datetime(),
    slotEnd: z.string().datetime(),
    linkedDocumentId: z.string().optional(),
    documentConsentGiven: z.boolean().optional(),
  }),
});

router.post(
  '/',
  authenticate,
  rbac('user'),
  validate(createBookingSchema),
  asyncHandler(async (req, res) => {
    const { advocateId, mode, slotStart, slotEnd, linkedDocumentId, documentConsentGiven } = req.body;

    const advocateProfile = await AdvocateProfile.findOne({
      userId: advocateId,
      verificationStatus: 'verified',
    });
    if (!advocateProfile) throw ApiError.notFound('Verified advocate not found.');

    const feePaise = mode === 'chat' ? advocateProfile.fees.chat : advocateProfile.fees.video;
    if (feePaise < env.MIN_CONSULTATION_FEE_PAISE) {
      throw ApiError.badRequest('Consultation fee is below the platform minimum.');
    }

    const commissionPaise = Math.round(feePaise * (env.PLATFORM_COMMISSION_PERCENT / 100));
    const gstPaise = Math.round(commissionPaise * (env.GST_RATE_PERCENT / 100));
    const advocatePayoutPaise = feePaise - commissionPaise - gstPaise;

    const durationMinutes = Math.round((new Date(slotEnd) - new Date(slotStart)) / 60000);

    // Idempotency key: user + advocate + slot (prevents duplicate bookings for same slot)
    const idempotencyKey = crypto
      .createHash('sha256')
      .update(`${req.user._id}:${advocateId}:${slotStart}`)
      .digest('hex');

    // Check for duplicate
    const existing = await Booking.findOne({ idempotencyKey });
    if (existing) {
      return res.json({ success: true, data: { booking: existing, alreadyExists: true } });
    }

    // Create Razorpay order
    const rpOrder = await razorpay.orders.create({
      amount: feePaise, // in paise
      currency: 'INR',
      receipt: idempotencyKey.slice(0, 40),
      notes: {
        userId: req.user._id.toString(),
        advocateId,
        mode,
        slotStart,
      },
    });

    const booking = await Booking.create({
      userId: req.user._id,
      advocateId,
      advocateProfileId: advocateProfile._id,
      mode,
      slotStart: new Date(slotStart),
      slotEnd: new Date(slotEnd),
      durationMinutes,
      amountPaise: feePaise,
      platformFeePaise: commissionPaise,
      gstPaise,
      advocatePayoutPaise,
      razorpayOrderId: rpOrder.id,
      idempotencyKey,
      status: 'pending',
      linkedDocumentId: linkedDocumentId || null,
      documentConsentGiven: documentConsentGiven || false,
    });

    res.status(201).json({
      success: true,
      data: {
        booking,
        razorpayOrderId: rpOrder.id,
        razorpayKeyId: env.RAZORPAY_KEY_ID,
        amountPaise: feePaise,
      },
    });
  }),
);

// ── GET /api/v1/bookings ──────────────────────────────────────

router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const filter =
      req.user.role === 'advocate'
        ? { advocateId: req.user._id }
        : { userId: req.user._id };

    const bookings = await Booking.find(filter)
      .populate('advocateId', 'name email')
      .populate('userId', 'name email')
      .populate('advocateProfileId', 'practiceAreas city state fees')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, data: { bookings } });
  }),
);

// ── PATCH /api/v1/bookings/:id/cancel ─────────────────────────

router.patch(
  '/:id/cancel',
  authenticate,
  asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) throw ApiError.notFound('Booking not found.');

    // Only the user, advocate, or admin can cancel
    const isAuthorized =
      booking.userId.toString() === req.user._id.toString() ||
      booking.advocateId.toString() === req.user._id.toString() ||
      req.user.role === 'admin';
    if (!isAuthorized) throw ApiError.forbidden();

    if (['completed', 'refunded', 'cancelled'].includes(booking.status)) {
      throw ApiError.badRequest(`Booking is already ${booking.status}.`);
    }

    booking.status = 'cancelled';
    booking.cancelledBy = req.user.role;
    booking.cancellationReason = req.body.reason;
    booking.cancelledAt = new Date();
    await booking.save();

    // Initiate refund if payment was captured
    if (booking.razorpayPaymentId && booking.status === 'paid') {
      try {
        await razorpay.payments.refund(booking.razorpayPaymentId, { amount: booking.amountPaise });
        booking.status = 'refunded';
        await booking.save();
      } catch (err) {
        logger.error({ err, bookingId: booking._id }, 'Razorpay refund failed');
      }
    }

    res.json({ success: true, data: { booking } });
  }),
);

// ── POST /api/v1/payments/verify ─────────────────────────────

const verifySchema = z.object({
  body: z.object({
    razorpayOrderId: z.string(),
    razorpayPaymentId: z.string(),
    razorpaySignature: z.string(),
  }),
});

router.post(
  '/payments/verify',
  authenticate,
  validate(verifySchema),
  asyncHandler(async (req, res) => {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    // Verify HMAC-SHA256 signature (server-side, source of truth)
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      throw ApiError.badRequest('Payment signature verification failed.');
    }

    const booking = await Booking.findOneAndUpdate(
      { razorpayOrderId },
      { status: 'paid', razorpayPaymentId },
      { new: true },
    );
    if (!booking) throw ApiError.notFound('Booking not found for this order.');

    // Create consultation room
    await Consultation.findOneAndUpdate(
      { bookingId: booking._id },
      { bookingId: booking._id, userId: booking.userId, advocateId: booking.advocateId },
      { upsert: true, new: true },
    );

    res.json({ success: true, data: { booking } });
  }),
);

// ── POST /api/v1/payments/webhook ────────────────────────────
// Razorpay sends raw body; requires express.raw middleware mounted before this route.

router.post(
  '/payments/webhook',
  asyncHandler(async (req, res) => {
    const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    if (webhookSecret && signature) {
      const digest = crypto
        .createHmac('sha256', webhookSecret)
        .update(req.body) // raw Buffer
        .digest('hex');

      if (digest !== signature) {
        logger.warn('Razorpay webhook signature mismatch');
        return res.status(400).json({ success: false, error: { message: 'Invalid signature' } });
      }
    }

    const event = JSON.parse(req.body.toString());
    logger.info({ event: event.event }, 'Razorpay webhook received');

    if (event.event === 'payment.captured') {
      const orderId = event.payload.payment.entity.order_id;
      const paymentId = event.payload.payment.entity.id;
      await Booking.findOneAndUpdate(
        { razorpayOrderId: orderId, status: 'pending' },
        { status: 'paid', razorpayPaymentId: paymentId },
      );
    }

    if (event.event === 'payment.failed') {
      const orderId = event.payload.payment.entity.order_id;
      await Booking.findOneAndUpdate({ razorpayOrderId: orderId }, { status: 'cancelled' });
    }

    res.json({ success: true });
  }),
);

export default router;
