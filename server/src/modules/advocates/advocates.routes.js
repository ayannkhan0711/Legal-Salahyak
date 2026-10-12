/**
 * modules/advocates/advocates.routes.js
 * Advocate directory, enrollment, and profile management.
 *
 * GET  /api/v1/advocates          – public directory with filters
 * GET  /api/v1/advocates/:id      – public advocate profile
 * POST /api/v1/advocates/me/enroll – advocate applies for verification
 * PUT  /api/v1/advocates/me/profile – update own profile (advocate only)
 * PUT  /api/v1/advocates/me/availability – update availability slots
 */
import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth.js';
import { rbac } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/apiError.js';
import { AdvocateProfile } from './AdvocateProfile.model.js';
import { User } from '../auth/User.model.js';

const router = Router();

// ── Public routes ─────────────────────────────────────────────

/**
 * GET /api/v1/advocates
 * Filters: practiceArea, state, city, language, minExperience, maxFee (paise), mode (chat|video), q (search)
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { practiceArea, state, city, language, minExp, maxFee, mode, q, page = 1, limit = 12 } = req.query;

    const filter = { verificationStatus: 'verified' };

    if (practiceArea) filter.practiceAreas = { $in: [practiceArea] };
    if (state) filter.state = new RegExp(state, 'i');
    if (city) filter.city = new RegExp(city, 'i');
    if (language) filter.languages = { $in: [language] };
    if (minExp) filter.experienceYears = { $gte: parseInt(minExp) };
    if (maxFee && mode === 'chat') filter['fees.chat'] = { $lte: parseInt(maxFee) };
    if (maxFee && mode === 'video') filter['fees.video'] = { $lte: parseInt(maxFee) };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [advocates, total] = await Promise.all([
      AdvocateProfile.find(filter)
        .populate('userId', 'name email')
        .select('-bankAccountRef -enrollmentDocUrl')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ rating: -1, experienceYears: -1 }),
      AdvocateProfile.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        advocates,
        pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
      },
    });
  }),
);

/** GET /api/v1/advocates/:id */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const advocate = await AdvocateProfile.findOne({
      _id: req.params.id,
      verificationStatus: 'verified',
    })
      .populate('userId', 'name email')
      .select('-bankAccountRef -enrollmentDocUrl');

    if (!advocate) throw ApiError.notFound('Advocate not found.');
    res.json({ success: true, data: { advocate } });
  }),
);

// ── Protected routes ──────────────────────────────────────────

router.use(authenticate);

const enrollSchema = z.object({
  body: z.object({
    enrollmentNumber: z.string().min(3),
    barCouncil: z.string().min(3),
    practiceAreas: z.array(z.string()).min(1),
    courts: z.array(z.string()).optional(),
    languages: z.array(z.string()).min(1),
    experienceYears: z.coerce.number().min(0),
    city: z.string().min(2),
    state: z.string().min(2),
    bio: z.string().max(2000).optional(),
    fees: z.object({
      chat: z.coerce.number().min(0),
      video: z.coerce.number().min(0),
    }).optional(),
  }),
});

/** POST /api/v1/advocates/me/enroll */
router.post(
  '/me/enroll',
  rbac('advocate', 'user'), // user can apply to become advocate
  validate(enrollSchema),
  asyncHandler(async (req, res) => {
    const existing = await AdvocateProfile.findOne({ userId: req.user._id });
    if (existing) throw ApiError.conflict('You have already submitted an enrollment application.');

    // Update user role to advocate
    await User.findByIdAndUpdate(req.user._id, { role: 'advocate' });

    const profile = await AdvocateProfile.create({
      userId: req.user._id,
      ...req.body,
    });

    res.status(201).json({
      success: true,
      message: 'Enrollment submitted for verification. You will be notified once reviewed.',
      data: { profile },
    });
  }),
);

const profileUpdateSchema = z.object({
  body: z.object({
    bio: z.string().max(2000).optional(),
    practiceAreas: z.array(z.string()).optional(),
    courts: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    fees: z.object({
      chat: z.coerce.number().min(0).optional(),
      video: z.coerce.number().min(0).optional(),
    }).optional(),
  }),
});

/** PUT /api/v1/advocates/me/profile */
router.put(
  '/me/profile',
  rbac('advocate'),
  validate(profileUpdateSchema),
  asyncHandler(async (req, res) => {
    const profile = await AdvocateProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: req.body },
      { new: true },
    );
    if (!profile) throw ApiError.notFound('Advocate profile not found. Please enroll first.');
    res.json({ success: true, data: { profile } });
  }),
);

const availabilitySchema = z.object({
  body: z.object({
    availability: z.array(z.object({
      dayOfWeek: z.number().min(0).max(6),
      startTime: z.string().regex(/^\d{2}:\d{2}$/),
      endTime: z.string().regex(/^\d{2}:\d{2}$/),
      durationMinutes: z.number().default(30),
    })),
    blockedDates: z.array(z.string()).optional(),
  }),
});

/** PUT /api/v1/advocates/me/availability */
router.put(
  '/me/availability',
  rbac('advocate'),
  validate(availabilitySchema),
  asyncHandler(async (req, res) => {
    const { availability, blockedDates = [] } = req.body;
    const profile = await AdvocateProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        $set: {
          availability,
          blockedDates: blockedDates.map((d) => new Date(d)),
        },
      },
      { new: true },
    );
    if (!profile) throw ApiError.notFound('Profile not found.');
    res.json({ success: true, data: { profile } });
  }),
);

/** GET /api/v1/advocates/me/dashboard */
router.get(
  '/me/dashboard',
  rbac('advocate'),
  asyncHandler(async (req, res) => {
    const { Booking } = await import('../bookings/Booking.model.js');
    const profile = await AdvocateProfile.findOne({ userId: req.user._id });
    if (!profile) throw ApiError.notFound('Profile not found.');

    const [upcoming, earnings] = await Promise.all([
      Booking.find({ advocateId: req.user._id, status: { $in: ['paid', 'active'] } })
        .populate('userId', 'name email')
        .sort({ slotStart: 1 })
        .limit(10),
      Booking.aggregate([
        { $match: { advocateId: req.user._id, status: 'completed' } },
        {
          $group: {
            _id: null,
            total: { $sum: '$advocatePayoutPaise' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        profile,
        upcoming,
        earnings: earnings[0] || { total: 0, count: 0 },
      },
    });
  }),
);

export default router;
