import { Schema, model, models, Document, Model, Types } from 'mongoose';
import { EventDocument, EventModel, EventModel as Event } from './event.model';

/**
 * Booking document interface.
 */
export interface Booking {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingDocument extends Booking, Document {}

/**
 * Booking model interface with common query helpers.
 */
export interface BookingModel extends Model<BookingDocument> {
  findByEventId(eventId: Types.ObjectId | string): Promise<BookingDocument[]>;
  findByEmailAndEvent(
    email: string,
    eventId: Types.ObjectId | string
  ): Promise<BookingDocument | null>;
}

/**
 * Simple email format validator.
 */
function isValidEmail(email: string): boolean {
  // Basic RFC 5322-compliant pattern for common cases.
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

const bookingSchema = new Schema<BookingDocument, BookingModel>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true, // index for faster lookups by event
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: (value: string) => isValidEmail(value),
        message: 'Email must be a valid email address.',
      },
    },
  },
  {
    timestamps: true,
    strict: 'throw',
  }
);

/**
 * Query helpers on the Booking model for common access patterns.
 */
bookingSchema.statics.findByEventId = function findByEventId(
  this: BookingModel,
  eventId: Types.ObjectId | string
): Promise<BookingDocument[]> {
  return this.find({ eventId }).sort({ createdAt: -1 }).exec();
};

bookingSchema.statics.findByEmailAndEvent = function findByEmailAndEvent(
  this: BookingModel,
  email: string,
  eventId: Types.ObjectId | string
): Promise<BookingDocument | null> {
  return this.findOne({ email, eventId }).exec();
};

/**
 * Pre-save hook to validate:
 * - the referenced event exists
 * - the email address is correctly formatted (extra safeguard beyond schema).
 */
bookingSchema.pre<BookingDocument>('save', async function preSave(next) {
  try {
    if (!this.eventId) {
      throw new Error('eventId is required.');
    }

    // Double-check email format in code as well, in case the field was set bypassing validation.
    if (!isValidEmail(this.email)) {
      throw new Error('Email must be a valid email address.');
    }

    // Confirm that the referenced Event exists before saving the booking.
    const eventExists = await Event.exists({ _id: this.eventId } as Pick<EventDocument, '_id'>);

    if (!eventExists) {
      throw new Error('Cannot create booking: referenced event does not exist.');
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

// Indexes to support fast queries on typical access patterns.
bookingSchema.index({ eventId: 1 }); // lookups by event
bookingSchema.index({ eventId: 1, createdAt: -1 }); // recent bookings for an event
bookingSchema.index({ email: 1, eventId: 1 }); // user bookings per event

export const BookingModel: BookingModel =
  (models.Booking as BookingModel) ||
  model<BookingDocument, BookingModel>('Booking', bookingSchema);

export default BookingModel;
