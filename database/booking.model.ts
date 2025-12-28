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
      unique: true, // Enforce at most one booking per event.
      index: true,
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

// Explicit unique index on eventId so each event can only have a single booking document.
bookingSchema.index({ eventId: 1 }, { unique: true });

/**
 * Pre-save hook to validate references and field format:
 * - Ensures the referenced Event exists before creating a booking.
 * - Guards against duplicate bookings for the same event at application level.
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

    // If this is a new booking, ensure no other booking already exists for this event.
    if (this.isNew) {
      const duplicate = await Booking.exists({ eventId: this.eventId }).lean();
      if (duplicate) {
        throw new Error('A booking for this event already exists');
      }
    }

    next();
  } catch (err) {
    next(err as Error);
  }
});

// Prevent model recompilation issues in development / hot-reload.
export const Booking: BookingModel =
  (models.Booking as BookingModel) || model<BookingDocument, BookingModel>('Booking', bookingSchema);
