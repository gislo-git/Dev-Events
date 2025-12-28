import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { Event } from './event.model';

// Strongly typed representation of a Booking document.
export interface BookingDocument extends Document {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// Basic email validator. For stricter rules, replace with a dedicated validator.
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const BookingSchema = new Schema<BookingDocument>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true, // Index on eventId for fast lookups by event.
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: (value: unknown): boolean =>
          typeof value === 'string' && isValidEmail(value),
        message: 'Email must be a valid email address',
      },
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt.
    strict: 'throw', // Disallow unknown fields.
  }
);

// Indexes to optimize common query patterns.
// Supports Booking.find({ email })
BookingSchema.index({ email: 1 });
// Supports Booking.find({ createdAt: { $gte: someDate } })
BookingSchema.index({ createdAt: -1 });

// Pre-save hook to verify referenced event and validate email format.
BookingSchema.pre<BookingDocument>('save', async function preSave(next) {
  // Validate email again at runtime in case it was modified directly.
  if (!isValidEmail(this.email)) {
    return next(new Error('Invalid email address'));
  }

  // Ensure the referenced event exists before creating a booking.
  const eventExists = await Event.exists({ _id: this.eventId }).lean();
  if (!eventExists) {
    return next(new Error('Referenced event does not exist'));
  }

  next();
});

export const Booking: Model<BookingDocument> =
  (mongoose.models.Booking as Model<BookingDocument> | undefined) ||
  mongoose.model<BookingDocument>('Booking', BookingSchema);

export default Booking;
