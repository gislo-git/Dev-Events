import { Schema, model, models, Document, Model } from 'mongoose';

/**
 * Event document interface describing the shape of data stored in MongoDB.
 */
export interface Event {
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string; // ISO 8601 date string (e.g. 2025-12-28)
  time: string; // Normalized 24h time (HH:mm)
  mode: string;
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EventDocument extends Event, Document {}

export type EventModel = Model<EventDocument>;

/**
 * Helper to generate a URL-friendly slug from a title.
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // remove non-alphanumeric characters
    .replace(/\s+/g, '-') // replace spaces with hyphens
    .replace(/-+/g, '-'); // collapse multiple hyphens
}

/**
 * Normalize a date string to an ISO 8601 date-only format (YYYY-MM-DD).
 * Throws if the value cannot be parsed.
 */
function normalizeDateToIso(dateStr: string): string {
  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date format. Expected a value parsable by Date.');
  }

  // Extract the UTC date portion as YYYY-MM-DD to avoid timezone drift.
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Normalize time strings to 24h HH:mm format.
 * Accepts inputs like "14:30", "2:30 pm", etc.
 */
function normalizeTime(timeStr: string): string {
  const trimmed = timeStr.trim().toLowerCase();

  // Simple 24h HH:mm or H:mm
  const twentyFourHourMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourHourMatch) {
    const [_, h, m] = twentyFourHourMatch;
    const hour = Number(h);
    const minute = Number(m);

    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      throw new Error('Invalid time value. Hour must be 0-23 and minute 0-59.');
    }

    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  // 12h with am/pm, e.g. "2:30 pm" or "11 am"
  const twelveHourMatch = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (twelveHourMatch) {
    const [, rawHour, rawMinute, meridiem] = twelveHourMatch;
    let hour = Number(rawHour);
    const minute = rawMinute ? Number(rawMinute) : 0;

    if (hour < 1 || hour > 12 || minute < 0 || minute > 59) {
      throw new Error('Invalid time value in 12h format.');
    }

    if (meridiem === 'pm' && hour !== 12) {
      hour += 12;
    }
    if (meridiem === 'am' && hour === 12) {
      hour = 0;
    }

    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  throw new Error('Invalid time format. Use HH:mm or 12h format like 2:30 pm.');
}

/**
 * Basic non-empty string validator for required text fields.
 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

const eventSchema = new Schema<EventDocument, EventModel>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    overview: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
      trim: true,
    },
    venue: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    mode: {
      type: String,
      required: true,
      trim: true,
    },
    audience: {
      type: String,
      required: true,
      trim: true,
    },
    agenda: {
      type: [String],
      required: true,
      validate: {
        validator: (value: string[]) => Array.isArray(value) && value.length > 0,
        message: 'Agenda must be a non-empty array of strings.',
      },
    },
    organizer: {
      type: String,
      required: true,
      trim: true,
    },
    tags: {
      type: [String],
      required: true,
      validate: {
        validator: (value: string[]) => Array.isArray(value) && value.length > 0,
        message: 'Tags must be a non-empty array of strings.',
      },
    },
  },
  {
    timestamps: true, // automatically manages createdAt and updatedAt
    strict: 'throw', // prevent saving fields not defined in the schema
  }
);

/**
 * Pre-save hook to:
 * - validate required fields are non-empty
 * - normalize date and time
 * - generate or update the slug when the title changes.
 */
eventSchema.pre<EventDocument>('save', function preSave(next) {
  try {
    // Validate required string fields are present and non-empty.
    const requiredFields: Array<keyof Event> = [
      'title',
      'description',
      'overview',
      'image',
      'venue',
      'location',
      'date',
      'time',
      'mode',
      'audience',
      'organizer',
    ];

    for (const field of requiredFields) {
      const value = this[field];
      if (!isNonEmptyString(value)) {
        throw new Error(`Field "${field}" is required and must be a non-empty string.`);
      }
    }

    // Normalize and validate date and time to consistent formats.
    if (this.isModified('date')) {
      this.date = normalizeDateToIso(this.date);
    }

    if (this.isModified('time')) {
      this.time = normalizeTime(this.time);
    }

    // Generate slug only when the title is new or has changed.
    if (this.isModified('title') || !this.slug) {
      this.slug = generateSlug(this.title);
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

// Ensure a unique index on slug at the schema level as an extra safeguard.
eventSchema.index({ slug: 1 }, { unique: true });

export const EventModel: EventModel =
  (models.Event as EventModel) || model<EventDocument, EventModel>('Event', eventSchema);

export default EventModel;
