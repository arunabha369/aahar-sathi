import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';

async function start(): Promise<void> {
  await connectDb(env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`🍛 Aahar Sathi API listening on http://localhost:${env.PORT}`);
  });

  // Without this a busy port fails quietly and every /api call 404s somewhere else.
  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(
        `❌ Port ${env.PORT} is already in use. Stop whatever is using it, or set PORT in server/.env (and API_URL in client/.env.local to match).`,
      );
    } else {
      console.error('❌ The server could not start:', error);
    }
    process.exit(1);
  });
}

start().catch((error: unknown) => {
  console.error('❌ Failed to start the server:', error);
  process.exit(1);
});
