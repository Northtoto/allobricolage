// Provide dummy env so server/config/index.ts passes validation at import time
// during tests/CI (no real DB or secrets needed for unit tests).
process.env.NODE_ENV ||= "test";
process.env.DATABASE_URL ||= "postgresql://test:test@localhost:5432/test";
process.env.SESSION_SECRET ||= "test-session-secret-at-least-32-characters-long";
process.env.JWT_SECRET ||= "test-jwt-secret-at-least-32-characters-long-ok";
process.env.BASE_URL = "http://localhost:5002";
process.env.FRONTEND_URL = "http://localhost:5173";
// Ensure the cost estimator uses the deterministic formula path in tests.
delete process.env.HUGGINGFACE_API_KEY;
// Gate startServer()/app.listen() in server/index.ts so importing { app } for
// route tests does not open a port or hit the real database.
process.env.VERCEL ||= "1";
