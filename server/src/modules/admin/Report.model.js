/**
 * modules/admin/Report.model.js
 * Content/abuse report filed by any user.
 */
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const reportSchema = new Schema(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetType: {
      type: String,
      enum: ['Consultation', 'Review', 'User', 'AdvocateProfile'],
      required: true,
    },
    targetId: { type: Schema.Types.ObjectId, required: true },
    reason: { type: String, required: true, maxlength: 500 },
    status: {
      type: String,
      enum: ['open', 'under_review', 'resolved', 'dismissed'],
      default: 'open',
      index: true,
    },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolution: String,
  },
  { timestamps: true },
);

export const Report = model('Report', reportSchema);
