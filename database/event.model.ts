import mongoose, { Document, Model, Schema } from 'mongoose';

// Strongly typed representation of an Event document.
export interface EventDocument extends Document {
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string; // Normalized ISO date string (YYYY-MM-DD).
  time: string; // Normalized 24h time string (HH:MM).
  mode: string;
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a URL-safe slug from a title.
 *
 * @param title - The input title to convert into a slug
 * @returns The resulting slug: lowercase, hyphen-separated, containing only letters, numbers, and hyphens
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove invalid chars.
    .replace(/\s+/g, '-') // Replace spaces with dashes.
    .replace(/-+/g, '-'); // Collapse multiple dashes.
}

/**
 * Checks whether a value is a non-empty string.
 *
 * @param value - The value to test
 * @returns `true` if `value` is a string containing at least one non-whitespace character, `false` otherwise
 */
function isNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

const EventSchema = new Schema<EventDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isNonEmptyString,
        message: 'Title is required',
      },
    },
    slug: {
      type: String,
      unique: true,
      index: true, // Unique index on slug for fast lookup.
    },
    description: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isNonEmptyString,
        message: 'Description is required',
      },
    },
    overview: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isNonEmptyString,
        message: 'Overview is required',
      },
    },
    image: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isNonEmptyString,
        message: 'Image is required',
      },
    },
    venue: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isNonEmptyString,
        message: 'Venue is required',
      },
    },
    location: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isNonEmptyString,
        message: 'Location is required',
      },
    },
    date: {
      type: String,
      required: true,
      validate: {
        validator: isNonEmptyString,
        message: 'Date is required',
      },
    },
    time: {
      type: String,
      required: true,
      validate: {
        validator: isNonEmptyString,
        message: 'Time is required',
      },
    },
    mode: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isNonEmptyString,
        message: 'Mode is required',
      },
    },
    audience: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isNonEmptyString,
        message: 'Audience is required',
      },
    },
    agenda: {
      type: [String],
      required: true,
      validate: {
        validator: (value: unknown): boolean =>
          Array.isArray(value) && value.length > 0 && value.every((item) => isNonEmptyString(item)),
        message: 'Agenda must be a non-empty array of strings',
      },
    },
    organizer: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isNonEmptyString,
        message: 'Organizer is required',
      },
    },
    tags: {
      type: [String],
      required: true,
      validate: {
        validator: (value: unknown): boolean =>
          Array.isArray(value) && value.length > 0 && value.every((item) => isNonEmptyString(item)),
        message: 'Tags must be a non-empty array of strings',
      },
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt.
    strict: 'throw', // Disallow unknown fields for predictable data shape.
  }
);

// Pre-save hook to generate slug and normalize date/time.
EventSchema.pre<EventDocument>('save', function preSave(next) {
  // Regenerate slug only if title changed or slug is missing.
  if (this.isModified('title') || !this.slug) {
    this.slug = generateSlug(this.title);
  }

  // Normalize date to ISO (YYYY-MM-DD).
  if (this.isModified('date')) {
    const parsedDate = new Date(this.date);
    if (Number.isNaN(parsedDate.getTime())) {
      return next(new Error('Invalid date format'));
    }
    this.date = parsedDate.toISOString().split('T')[0];
  }

  // Normalize time to 24h HH:MM.
  if (this.isModified('time')) {
    const time = this.time.trim();
    const timeMatch = time.match(/^(\d{1,2}):(\d{2})$/);
    if (!timeMatch) {
      return next(new Error('Time must be in HH:MM 24-hour format'));
    }
    const hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);

    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return next(new Error('Time must be a valid 24-hour time'));
    }

    const normalized = `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}`;
    this.time = normalized;
  }

  next();
});

// Ensure a unique index on slug at the schema level.
EventSchema.index({ slug: 1 }, { unique: true });

export const Event: Model<EventDocument> =
  (mongoose.models.Event as Model<EventDocument> | undefined) ||
  mongoose.model<EventDocument>('Event', EventSchema);

export default Event;