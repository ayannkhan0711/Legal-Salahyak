/**
 * modules/auth/User.model.js
 * Core user model. Sensitive fields are encrypted at rest.
 */
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const { Schema, model } = mongoose;

const consentSchema = new Schema(
  {
    documentProcessing: { type: Boolean, default: false },
    shareWithAdvocate: { type: Boolean, default: false },
    marketingEmails: { type: Boolean, default: false },
    consentedAt: Date,
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String, trim: true, default: null },
    passwordHash: { type: String, select: false }, // excluded by default

    role: {
      type: String,
      enum: ['user', 'advocate', 'admin'],
      default: 'user',
      index: true,
    },

    // Profile
    state: { type: String, trim: true },
    preferredLanguage: { type: String, enum: ['en', 'hi'], default: 'en' },

    // Verification
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    otp: { type: String, select: false },
    otpExpiry: { type: Date, select: false },

    // Account status
    isSuspended: { type: Boolean, default: false },
    suspendedReason: { type: String },

    // OAuth
    googleId: { type: String, sparse: true },

    // DPDP Act compliance
    consents: { type: consentSchema, default: () => ({}) },
    deletedAt: { type: Date, default: null }, // soft delete

    // Refresh token hashes stored for revocation (latest 5)
    refreshTokenHashes: { type: [String], select: false, default: [] },
  },
  {
    timestamps: true,
  },
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash') || !this.passwordHash) return next();
  // bcrypt cost 12 as specified
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

/**
 * Verify a plain-text password against the stored hash.
 * @param {string} plainPassword
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

// Never expose passwordHash or OTP in JSON responses
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.otp;
  delete obj.otpExpiry;
  delete obj.refreshTokenHashes;
  return obj;
};

export const User = model('User', userSchema);
