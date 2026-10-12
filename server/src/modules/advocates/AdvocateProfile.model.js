/**
 * modules/advocates/AdvocateProfile.model.js
 * Profile for advocates (lawyers). A User with role='advocate' will have exactly one profile.
 * Fees stored in paise for precision.
 */
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const feeSchema = new Schema(
  {
    chat: { type: Number, default: 0 }, // paise
    video: { type: Number, default: 0 }, // paise
  },
  { _id: false },
);

// A weekly availability slot
const slotSchema = new Schema(
  {
    dayOfWeek: { type: Number, min: 0, max: 6 }, // 0=Sun, 6=Sat
    startTime: String, // "09:00"
    endTime: String,   // "10:00"
    durationMinutes: { type: Number, default: 30 },
  },
  { _id: true },
);

const advocateProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    // Bar Council details
    enrollmentNumber: { type: String, trim: true },
    barCouncil: { type: String, trim: true }, // e.g. "Bar Council of Madhya Pradesh"
    enrollmentDocUrl: { type: String }, // encrypted path stored in Document model

    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'suspended'],
      default: 'pending',
      index: true,
    },
    verificationNote: { type: String }, // admin rejection/suspension reason

    // Professional details
    practiceAreas: [{ type: String, trim: true }], // e.g. ["Criminal", "Family", "Consumer"]
    courts: [{ type: String, trim: true }],         // e.g. ["Supreme Court of India", "Madhya Pradesh High Court"]
    languages: [{ type: String, trim: true }],      // e.g. ["Hindi", "English"]
    experienceYears: { type: Number, default: 0 },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    bio: { type: String, maxlength: 2000 },

    fees: { type: feeSchema, default: () => ({}) },
    availability: [slotSchema],
    blockedDates: [Date],

    // Metrics
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },

    // Earnings in paise
    earningsTotal: { type: Number, default: 0 },

    // Bank account reference (Razorpay linked account) – stored encrypted
    bankAccountRef: { type: String, default: null },

    // Photo URL
    photoUrl: { type: String, default: null },
  },
  { timestamps: true },
);

advocateProfileSchema.index({ verificationStatus: 1, practiceAreas: 1, state: 1 });

export const AdvocateProfile = model('AdvocateProfile', advocateProfileSchema);
