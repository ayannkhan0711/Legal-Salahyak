/**
 * modules/consultations/Consultation.model.js
 * Live consultation session between user and advocate after payment.
 */
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const consultationMessageSchema = new Schema(
  {
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, enum: ['user', 'advocate'] },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const consultationSchema = new Schema(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    advocateId: { type: Schema.Types.ObjectId, ref: 'User', index: true },

    messages: [consultationMessageSchema],

    startedAt: Date,
    endedAt: Date,
    durationSeconds: Number,
    endedBy: { type: String, enum: ['user', 'advocate', 'system'], default: null },

    // Flagged for moderation
    isFlagged: { type: Boolean, default: false },
    flagReason: String,
  },
  { timestamps: true },
);

export const Consultation = model('Consultation', consultationSchema);
