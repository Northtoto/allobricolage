/**
 * Vercel serverless entry point.
 *
 * Imports the configured Express app from server/index.ts and exports it as the
 * default handler. server/index.ts skips app.listen()/startServer() when the
 * VERCEL env var is present, so importing here does not open a port — Vercel
 * invokes the exported app per request.
 *
 * vercel.json routes /api/* and /health to this function; the SPA is served as
 * static files from the client build.
 */
import { app } from "../server/index.ts";

export default app;
