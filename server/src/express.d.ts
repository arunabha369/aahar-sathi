declare global {
  namespace Express {
    interface Request {
      /** Set by `requireAuth` once the JWT in the `token` cookie has been verified. */
      userId?: string;
      /** Parsed `req.query` — Express 5 makes `req.query` read-only, so it lands here. */
      validQuery?: unknown;
      /** Parsed `req.params`. */
      validParams?: unknown;
    }
  }
}

export {};
