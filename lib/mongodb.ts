import mongoose, { ConnectOptions } from 'mongoose';

/**
 * MongoDB connection URI
 *
 * Must be provided via the MONGODB_URI environment variable.
 * Example (local):
 *   mongodb://localhost:27017/my_database
 */
const MONGODB_URI: string | undefined = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable in your environment');
}

/**
 * Shape of the cached Mongoose connection stored on the Node.js global object.
 *
 * This avoids creating multiple connections during development when Next.js
 * hot-reloads modules.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

/**
 * Augment the Node.js global type to include our Mongoose cache.
 *
 * `var` is required here so that TypeScript understands this is a global
 * variable, not a block-scoped variable.
 */
declare global {
  // eslint-disable-next-line no-var
  // eslint-disable-next-line vars-on-top
  var _mongoose: MongooseCache | undefined;
}

// Use the cached connection if it exists, otherwise initialize it.
const cached: MongooseCache = global._mongoose ?? {
  conn: null,
  promise: null,
};

// Ensure the global cache is always initialized so subsequent imports reuse it.
if (!global._mongoose) {
  global._mongoose = cached;
}

/**
 * Establishes or reuses a cached Mongoose connection to the MongoDB URI specified in the environment.
 *
 * Reuses an existing active connection or an in-progress connection promise stored on the global cache to avoid creating duplicate connections across imports or hot reloads.
 *
 * @returns The connected Mongoose instance
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  // If we already have an active connection, reuse it.
  if (cached.conn) {
    return cached.conn;
  }

  // If a connection is not already in progress, start one and cache the promise.
  if (!cached.promise) {
    const options: ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10, // Adjust based on your workload and deployment environment.
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, options)
      .then((mongooseInstance) => mongooseInstance);
  }

  // Wait for the connection to resolve and cache the resolved connection.
  cached.conn = await cached.promise;

  return cached.conn;
}

export default connectToDatabase;