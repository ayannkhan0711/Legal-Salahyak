/**
 * modules/admin/AuditLog.model.js
 * Immutable audit trail for auth events, payments, and admin actions.
 */
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const auditLogSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    actorRole: { type: String, enum: ['user', 'advocate', 'admin', 'system'] },
    action: { type: String, required: true, index: true },
    // e.g. "auth.login", "admin.verify_advocate", "payment.refund"

    target: {
      model: String,  // e.g. "User", "Booking"
      id: Schema.Types.ObjectId,
    },

    metadata: Schema.Types.Mixed, // additional context (no PII)
    ip: String,
    userAgent: String,
    createdAt: { type: Date, default: Date.now, index: true },
  },
  {
    // No timestamps: createdAt is our only timestamp; the log is append-only
    timestamps: false,
  },
);

// TTL: keep audit logs for 2 years
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 730 });

export const AuditLog = model('AuditLog', auditLogSchema);
