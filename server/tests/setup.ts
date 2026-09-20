import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, afterEach } from 'vitest';

// These run before the test file (and therefore src/config/env.ts) is imported,
// so the server validates a real in-memory database instead of a developer's .env.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-value-that-is-long-enough';
process.env.DEMO_ENABLED = 'true';

const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongo.getUri();
await mongoose.connect(process.env.MONGODB_URI);

afterEach(async () => {
  const collections = await mongoose.connection.db?.collections();
  await Promise.all((collections ?? []).map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});
