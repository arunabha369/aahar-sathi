import type { Express } from 'express';
import { createApp } from '../../../server/src/app';

/**
 * The Express API from `server/`, running inside this Next.js app: `pages/api/[...path].ts`
 * serves it to the browser, and Server Components call it in-process. One instance per
 * server process, so the database pool is shared rather than opened per request.
 *
 * No `import 'server-only'` here: that guard throws inside Pages Router API routes, and
 * nothing on the client imports this file (lib/api/server.ts, which does use it, is guarded).
 */
let app: Express | undefined;

export function getExpressApp(): Express {
  app ??= createApp();
  return app;
}
