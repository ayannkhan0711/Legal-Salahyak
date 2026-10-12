/**
 * modules/advocates/Review.model.js
 */
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const reviewSchema = new Schema(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    advocateId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 1000 },
    isFlagged: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Review = model('Review', reviewSchema);
