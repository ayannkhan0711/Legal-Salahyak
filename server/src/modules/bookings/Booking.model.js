/**
 * modules/bookings/Booking.model.js
 * Records a consultation booking. Amount stored in paise for precision.
 * Idempotency key prevents duplicate charges.
 */
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const bookingSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    advocateId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    advocateProfileId: {
      type: Schema.Types.ObjectId,
      ref: 'AdvocateProfile',
      required: true,
    },

    mode: { type: String, enum: ['chat', 'video'], required: true },

    // Slot details
    slotStart: { type: Date, required: true },
    slotEnd: { type: Date, required: true },
    durationMinutes: { type: Number, required: true },

    // Financial – all in paise
    amountPaise: { type: Number, required: true },          // total paid by user
    platformFeePaise: { type: Number, required: true },     // platform cut
    gstPaise: { type: Number, default: 0 },                 // GST on platform fee
    advocatePayoutPaise: { type: Number },                  // amountPaise - platformFeePaise - gstPaise

    status: {
      type: String,
      enum: ['pending', 'paid', 'active', 'completed', 'cancelled', 'refunded'],
      default: 'pending',
      index: true,
    },

    // Razorpay
    razorpayOrderId: { type: String, unique: true, sparse: true },
    razorpayPaymentId: { type: String, sparse: true },

    // Prevent double charges
    idempotencyKey: { type: String, unique: true, required: true },

    // Cancellation
    cancelledBy: { type: String, enum: ['user', 'advocate', 'admin'], default: null },
    cancellationReason: String,
    cancelledAt: Date,

    // Linked document (optional – user may share summary)
    linkedDocumentId: { type: Schema.Types.ObjectId, ref: 'Document', default: null },
    documentConsentGiven: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Booking = model('Booking', bookingSchema);
