import { Schema, model, models, Document, Model } from 'mongoose';

// Core Event fields (excluding timestamps).
export interface EventAttrs {
  title: string;
  slug?: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string; // Normalized to ISO date (YYYY-MM-DD).
  time: string; // Normalized to 24h time (HH:mm).
  mode: string;
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
}

// Event document stored in MongoDB, including Mongoose-specific fields.
export interface EventDocument extends EventAttrs, Document {
  createdAt: Date;
  updatedAt: Date;
}

export type EventModel = Model<EventDocument>;

/**
 * Utility to create a URL-safe slug from the event title.
 */
function slugify(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric characters with dashes.
    .replace(/^-+|-+$/g, ''); // Trim leading/trailing dashes.
}

/**
 * Normalize a date string to ISO 8601 date format (YYYY-MM-DD).
 * Throws if the date is not parseable.
 */
function normalizeDate(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid date format for Event.date');
  }
  // Store only the calendar date portion.
  return parsed.toISOString().split('T')[0];
}

/**
 * Normalize time to 24-hour HH:mm format.
 * Accepts variants like "HH:mm" or "HH:mm:ss".
 */
function normalizeTime(time: string): string {
  const trimmed = time.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) {
    throw new Error('Invalid time format for Event.time (expected HH:mm or HH:mm:ss)');
  }

  let [hours, minutes] = [Number(match[1]), Number(match[2])];

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error('Invalid time range for Event.time');
  }

  const hh = hours.toString().padStart(2, '0');
  const mm = minutes.toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Ensure required string and string[] fields are present and non-empty.
 */
function validateRequiredFields(doc: EventDocument): void {
  const requiredStrings: Array<keyof EventAttrs> = [
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

  for (const field of requiredStrings) {
    const value = doc[field];
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new Error(`Event.${String(field)} is required and must be a non-empty string`);
    }
  }

  const requiredStringArrays: Array<keyof EventAttrs> = ['agenda', 'tags'];

  for (const field of requiredStringArrays) {
    const value = doc[field];
    if (!Array.isArray(value) || value.length === 0 || value.some((v) => typeof v !== 'string' || v.trim().length === 0)) {
      throw new Error(`Event.${String(field)} is required and must be a non-empty array of strings`);
    }
  }
}

const eventSchema = new Schema<EventDocument, EventModel>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    description: { type: String, required: true, trim: true },
    overview: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    venue: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    mode: { type: String, required: true, trim: true },
    audience: { type: String, required: true, trim: true },
    agenda: { type: [String], required: true },
    organizer: { type: String, required: true, trim: true },
    tags: { type: [String], required: true },
  },
  {
    timestamps: true, // Auto-manage createdAt and updatedAt.
    strict: true,
  }
);

// Explicit unique index on slug for safety.
eventSchema.index({ slug: 1 }, { unique: true });

/**
 * Pre-save hook to:
 * - Generate a URL-friendly, unique slug from the title (only when the title changes).
 * - Normalize and validate date/time fields.
 * - Validate that all required fields are non-empty.
 */
eventSchema.pre<EventDocument>('save', async function preSave(this: EventDocument) {
  // Only touch the slug when the title changes or slug is missing.
  if (this.isModified('title') || !this.slug) {
    const baseSlug = slugify(this.title);
    const maxAttempts = 5;
    let attempt = 0;
    let candidate = baseSlug;

    // Ensure slug uniqueness by checking for existing documents with the same slug.
    while (attempt < maxAttempts) {
      const existing = await (this.constructor as EventModel).exists({
        slug: candidate,
        _id: { $ne: this._id }, // Ignore the current document when updating.
      });

      if (!existing) {
        this.slug = candidate;
        break;
      }

      // On collision, append a short random suffix and retry.
      const suffix = Math.random().toString(36).slice(2, 8); // 4–6 chars.
      candidate = `${baseSlug}-${suffix}`;
      attempt += 1;
    }

    if (!this.slug) {
      throw new Error('Unable to generate a unique slug for Event after multiple attempts');
    }
  }

  if (this.isModified('date')) {
    this.date = normalizeDate(this.date);
  }

  if (this.isModified('time')) {
    this.time = normalizeTime(this.time);
  }

  validateRequiredFields(this);
});

// Prevent model recompilation issues in development / hot-reload.
export const Event: EventModel = (models.Event as EventModel) || model<EventDocument, EventModel>('Event', eventSchema);
