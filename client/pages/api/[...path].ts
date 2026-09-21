import type { NextApiRequest, NextApiResponse } from 'next';
import { getExpressApp } from '@/lib/api/expressApp';

/**
 * Every /api/* request is handed to the Express API unchanged, so the whole backend
 * deploys with the website — no separate server. The Pages Router is used here because
 * its handlers receive Node's own request and response objects, which Express expects.
 */
export const config = {
  api: {
    // Express parses JSON itself (with its own size limit).
    bodyParser: false,
    // Express sends every response, so Next need not warn that the handler "returned early".
    externalResolver: true,
  },
};

/**
 * Next attaches its own res.status/send/json/redirect and a pre-parsed req.query (which also
 * carries this route's `path` param). As own properties they would shadow Express's versions,
 * so they are removed and Express runs exactly as it does standalone and in the test suite.
 */
const NEXT_RESPONSE_HELPERS = ['status', 'send', 'json', 'redirect'] as const;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  for (const helper of NEXT_RESPONSE_HELPERS) {
    delete (res as unknown as Record<string, unknown>)[helper];
  }
  delete (req as unknown as Record<string, unknown>).query;

  getExpressApp()(req, res);
}
