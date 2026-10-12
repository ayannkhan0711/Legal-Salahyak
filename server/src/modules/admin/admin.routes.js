/**
 * modules/admin/admin.routes.js
 * Admin-only endpoints. All routes require authenticate + rbac('admin').
 *
 * GET  /api/v1/admin/overview           – dashboard stats
 * GET  /api/v1/admin/verifications      – pending advocate applications
 * POST /api/v1/admin/verifications/:id/approve
 * POST /api/v1/admin/verifications/:id/reject
 * GET  /api/v1/admin/users              – user management
 * POST /api/v1/admin/users/:id/suspend
 * POST /api/v1/admin/users/:id/unsuspend
 * GET  /api/v1/admin/audit-logs
 * GET  /api/v1/admin/reports
 * POST /api/v1/admin/knowledge-base/ingest – trigger re-ingestion
 */
import { Router } from 'express';
import { z } from 'zod';
import { authenticate, rbac } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/apiError.js';
import { User } from '../auth/User.model.js';
import { AdvocateProfile } from '../advocates/AdvocateProfile.model.js';
import { Booking } from '../bookings/Booking.model.js';
import { AuditLog } from './AuditLog.model.js';
import { Report } from './Report.model.js';
import { sendEmail } from '../../utils/email.js';
import { writeAuditLog } from '../auth/auth.service.js';

const router = Router();
router.use(authenticate, rbac('admin'));

// ── Overview ─────────────────────────────────────────────────

router.get(
  '/overview',
  asyncHandler(async (req, res) => {
    const [
      totalUsers,
      totalAdvocates,
      pendingVerifications,
      totalBookings,
      revenueResult,
      openReports,
    ] = await Promise.all([
      User.countDocuments({ role: 'user', deletedAt: null }),
      AdvocateProfile.countDocuments({ verificationStatus: 'verified' }),
      AdvocateProfile.countDocuments({ verificationStatus: 'pending' }),
      Booking.countDocuments(),
      Booking.aggregate([
        { $match: { status: { $in: ['paid', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$amountPaise' } } },
      ]),
      Report.countDocuments({ status: 'open' }),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalAdvocates,
        pendingVerifications,
        totalBookings,
        revenueInPaise: revenueResult[0]?.total || 0,
        openReports,
      },
    });
  }),
);

// ── Advocate Verifications ────────────────────────────────────

router.get(
  '/verifications',
  asyncHandler(async (req, res) => {
    const { status = 'pending' } = req.query;
    const profiles = await AdvocateProfile.find({ verificationStatus: status })
      .populate('userId', 'name email createdAt')
      .sort({ createdAt: 1 });
    res.json({ success: true, data: { profiles } });
  }),
);

router.post(
  '/verifications/:id/approve',
  asyncHandler(async (req, res) => {
    const profile = await AdvocateProfile.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: 'verified', verificationNote: null },
      { new: true },
    ).populate('userId', 'name email');

    if (!profile) throw ApiError.notFound('Profile not found.');

    // Notify advocate
    sendEmail({
      to: profile.userId.email,
      subject: 'Your LegalSahayak advocate profile is verified!',
      text: `Congratulations ${profile.userId.name}! Your enrollment has been verified. You can now receive client bookings.`,
    }).catch(() => {});

    await writeAuditLog({
      actorId: req.user._id,
      actorRole: 'admin',
      action: 'admin.verify_advocate.approve',
      target: { model: 'AdvocateProfile', id: profile._id },
      req,
    });

    res.json({ success: true, data: { profile } });
  }),
);

const rejectSchema = z.object({ body: z.object({ reason: z.string().min(5) }) });

router.post(
  '/verifications/:id/reject',
  validate(rejectSchema),
  asyncHandler(async (req, res) => {
    const profile = await AdvocateProfile.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: 'rejected', verificationNote: req.body.reason },
      { new: true },
    ).populate('userId', 'name email');

    if (!profile) throw ApiError.notFound('Profile not found.');

    sendEmail({
      to: profile.userId.email,
      subject: 'LegalSahayak – Enrollment update',
      text: `Hi ${profile.userId.name}, your enrollment was not approved. Reason: ${req.body.reason}. Please re-apply with correct documents.`,
    }).catch(() => {});

    await writeAuditLog({
      actorId: req.user._id,
      actorRole: 'admin',
      action: 'admin.verify_advocate.reject',
      target: { model: 'AdvocateProfile', id: profile._id },
      metadata: { reason: req.body.reason },
      req,
    });

    res.json({ success: true, data: { profile } });
  }),
);

// ── User Management ───────────────────────────────────────────

router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const { role, suspended, q, page = 1, limit = 20 } = req.query;
    const filter = { deletedAt: null };
    if (role) filter.role = role;
    if (suspended !== undefined) filter.isSuspended = suspended === 'true';
    if (q) filter.$or = [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }];

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(filter).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ]);

    res.json({ success: true, data: { users, total } });
  }),
);

router.post(
  '/users/:id/suspend',
  asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isSuspended: true, suspendedReason: req.body.reason },
      { new: true },
    );
    if (!user) throw ApiError.notFound('User not found.');
    await writeAuditLog({
      actorId: req.user._id,
      actorRole: 'admin',
      action: 'admin.user.suspend',
      target: { model: 'User', id: user._id },
      req,
    });
    res.json({ success: true, data: { user } });
  }),
);

router.post(
  '/users/:id/unsuspend',
  asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isSuspended: false, suspendedReason: null },
      { new: true },
    );
    if (!user) throw ApiError.notFound('User not found.');
    await writeAuditLog({
      actorId: req.user._id,
      actorRole: 'admin',
      action: 'admin.user.unsuspend',
      target: { model: 'User', id: user._id },
      req,
    });
    res.json({ success: true, data: { user } });
  }),
);

// ── Audit Logs ────────────────────────────────────────────────

router.get(
  '/audit-logs',
  asyncHandler(async (req, res) => {
    const { action, actorId, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (action) filter.action = new RegExp(action, 'i');
    if (actorId) filter.actorId = actorId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('actorId', 'name email role')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      AuditLog.countDocuments(filter),
    ]);

    res.json({ success: true, data: { logs, total } });
  }),
);

// ── Reports ───────────────────────────────────────────────────

router.get(
  '/reports',
  asyncHandler(async (req, res) => {
    const { status = 'open' } = req.query;
    const reports = await Report.find({ status })
      .populate('reporterId', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, data: { reports } });
  }),
);

// ── Knowledge Base Ingest Trigger ─────────────────────────────

router.post(
  '/knowledge-base/ingest',
  asyncHandler(async (req, res) => {
    // Dynamically import and run the ingestor so it doesn't load at startup
    const { runIngestor } = await import('../../modules/rag/ingestor.js');
    // Fire and forget; actual progress can be tracked via logs
    runIngestor(req.body?.actFilter).catch((e) =>
      logger.error({ e }, 'Admin-triggered ingestion failed'),
    );

    await writeAuditLog({
      actorId: req.user._id,
      actorRole: 'admin',
      action: 'admin.knowledge_base.ingest',
      req,
    });

    res.json({ success: true, message: 'Ingestion started. Check server logs for progress.' });
  }),
);

export default router;
