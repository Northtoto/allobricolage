/**
 * Vercel serverless entry point.
 *
 * Imports the PRE-BUILT esbuild server bundle (dist/server/index.js), not the TS
 * source. The bundle has all "@/" path aliases already resolved, so Vercel's
 * @vercel/node function bundler never has to resolve tsconfig paths — which it
 * does not do reliably. buildCommand ("npm run build") produces dist/server/
 * index.js before this function is bundled.
 *
 * server/index.ts skips app.listen()/startServer() when VERCEL is set, so this
 * import does not open a port — Vercel invokes the exported app per request.
 *
 * Not type-checked (excluded from tsconfig) because it imports a build artifact;
 * the server source it wraps is fully typed.
 */
// @ts-ignore - resolved at build time from the esbuild bundle
import { app } from "../dist/server/index.js";

export default app;
