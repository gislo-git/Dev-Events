import mongoose, { Connection, ConnectOptions, Mongoose } from 'mongoose';

/**
 * Interface describing the cached connection object that will live on the
 * global object in development. This prevents creating multiple connections
 * when Next.js hot-reloads server code.
 */
interface MongooseGlobalCache {
  conn: Connection | null;
  promise: Promise<Connection> | null;
}

/**
 * Augment the global type definition so TypeScript knows about `mongoose` on
 * the global object. This is safe because global is scoped per Node.js process.
 */
declare global {
  // `var` is required here because we are extending the NodeJS global scope.
  // eslint-disable-next-line no-var
  var mongoose: MongooseGlobalCache | undefined;
}

// Reuse the existing cached connection if it exists (mainly in development).
const globalWithMongoose = global as typeof global & {
  mongoose?: MongooseGlobalCache;
};

const MONGODB_URI: string | undefined = process.env.MONGODB_URI;

// Initialize the cache on the global object if it does not exist yet.
const cached: MongooseGlobalCache = globalWithMongoose.mongoose ?? {
  conn: null,
  promise: null,
};

globalWithMongoose.mongoose = cached;

/**
 * Establishes (or reuses) a single Mongoose connection.
 *
 * This function should be used anywhere you need database access in the
 * application (API routes, server components, server actions, etc.).
 */
export async function connectToDatabase(): Promise<Connection> {
  // Validate the connection string at connection time instead of module load
  // so importing this module does not crash builds where the DB is unused.
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not defined');
  }

  // If a connection already exists, reuse it.
  if (cached.conn) {
    return cached.conn;
  }

  // If a connection is already being established, wait for it to resolve.
  if (!cached.promise) {
    const options: ConnectOptions = {
      // Add any mongoose options you rely on here.
      // `bufferCommands` is usually left as default (true), but can be
      // configured explicitly if desired.
      bufferCommands: true,
    };

    // `mongoose.connect` returns a Mongoose instance. We then take its
    // underlying connection so that call sites receive a `Connection` type.
    cached.promise = mongoose
      .connect(MONGODB_URI, options)
      .then((m: Mongoose) => m.connection);
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    // If the connection attempt fails, clear the cached promise so that
    // subsequent calls can retry establishing a new connection.
    cached.promise = null;
    throw error;
  }
}

/**
 * Convenience re-export of the Mongoose instance, in case some parts of the
 * codebase prefer using `mongoose` directly (e.g. for model creation).
 */
export { mongoose };
