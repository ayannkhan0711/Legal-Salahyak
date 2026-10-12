/**
 * modules/payments/Payout.model.js
 * Tracks payouts to advocates via Razorpay Route.
 */
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const payoutSchema = new Schema(
  {
    advocateId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    amountPaise: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'settled', 'failed'],
      default: 'pending',
      index: true,
    },
    razorpayTransferId: String,
    failureReason: String,
    settledAt: Date,
  },
  { timestamps: true },
);

export const Payout = model('Payout', payoutSchema);
