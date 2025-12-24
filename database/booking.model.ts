import { Schema, model, models, Document, Model, Types } from 'mongoose';
import { Event, EventModel } from './event.model';

export interface BookingAttrs {
  eventId: Types.ObjectId;
  email: string;
}

export interface BookingDocument extends BookingAttrs, Document {
  createdAt: Date;
  updatedAt: Date;
}

export type BookingModel = Model<BookingDocument>;

/**
 * Simple but robust email validation regex.
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const bookingSchema = new Schema<BookingDocument, BookingModel>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true, // Index for faster lookups by event.
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: (value: string): boolean => EMAIL_REGEX.test(value),
        message: 'Invalid email address format',
      },
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

// Explicit index on eventId (redundant with field-level index but safe & explicit).
bookingSchema.index({ eventId: 1 });

/**
 * Pre-save hook to validate references and field format:
 * - Ensures the referenced Event exists before creating a booking.
 */
bookingSchema.pre<BookingDocument>('save', async function preSave(next) {
  try {
    // Double-check email format at hook time (schema validator already guards this).
    if (!EMAIL_REGEX.test(this.email)) {
      throw new Error('Invalid email address format');
    }

    const eventModel: EventModel = Event;
    const eventExists = await eventModel.exists({ _id: this.eventId }).lean();

    if (!eventExists) {
      throw new Error('Cannot create booking: referenced event does not exist');
    }

    next();
  } catch (err) {
    next(err as Error);
  }
});

// Prevent model recompilation issues in development / hot-reload.
export const Booking: BookingModel =
  (models.Booking as BookingModel) || model<BookingDocument, BookingModel>('Booking', bookingSchema);
