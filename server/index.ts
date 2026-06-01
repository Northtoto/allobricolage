import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { isProd, config } from "@/config/index.ts";
import { testDatabaseConnection, closeDbConnection } from "@/db/index.ts";
import { logger } from "@/utils/logger.ts";
import { requestLoggerMiddleware } from "@/middleware/request-logger.ts";
import { errorHandler, notFoundHandler } from "@/middleware/error-handler.ts";
import { generalLimiter } from "@/middleware/rate-limiter.ts";
import { securityHeaders, helmetConfig } from "@/middleware/security-headers.ts";
import routes from "@/routes/index.ts";
import { randomUUID } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust proxy for rate limiting behind reverse proxy
app.set("trust proxy", 1);

// Request correlation ID for tracing
app.use((req, _res, next) => {
  (req as { id?: string }).id = (req.headers["x-request-id"] as string) || randomUUID();
  next();
});

// Security headers (Helmet + custom)
app.use(helmetConfig);
app.use(securityHeaders);

// CORS — allow frontend origin with credentials
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
}));

// Body parsing with size limits
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Rate limiting
app.use(generalLimiter);

// Request logging
app.use(requestLoggerMiddleware);

// Health check (unauthenticated but rate-limited)
app.get("/health", (_req, res) => {
  res.json({ status: "ok", version: process.env.npm_package_version || "2.0.0" });
});

// API routes
app.use("/api", routes);

// Serve frontend static files in production (Express serves both API + SPA)
if (isProd) {
  // In compiled output dist/server/index.js, __dirname is dist/server — parent is dist
  const distPath = path.resolve(__dirname, "..");
  app.use(express.static(distPath, { index: false }));
  // SPA fallback — only for non-API routes
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// Global error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Process-level safety net: an unhandled rejection or uncaught exception must be
// logged, never a silent crash. We log and keep serving on rejections; on a truly
// uncaught exception we exit so a process manager can restart from a clean state.
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception — exiting for clean restart", {
    message: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

let httpServer: ReturnType<typeof app.listen> | undefined;

async function startServer(): Promise<void> {
  try {
    const connected = await testDatabaseConnection();
    if (!connected) {
      logger.error("Failed to connect to database. Exiting.");
      process.exit(1);
    }

    if (isProd && !config.REDIS_URL) {
      logger.warn(
        "REDIS_URL not set — rate-limiting & account-lockout use in-memory stores. " +
          "On serverless/multi-instance this degrades brute-force protection. Set REDIS_URL in production."
      );
    }

    const port = Number(process.env.PORT) || config.PORT;
    httpServer = app.listen(port, () => {
      logger.info(`Server running on port ${port} in ${isProd ? "production" : "development"} mode`);
    });
  } catch (error) {
    logger.error("Failed to start server", { error });
    process.exit(1);
  }
}

async function shutdown(signal: string): Promise<void> {
  logger.info(`${signal} received. Shutting down gracefully...`);
  // Force-exit guard: never let a hung connection close block shutdown forever.
  const forceExit = setTimeout(() => {
    logger.error("Graceful shutdown timed out — forcing exit");
    process.exit(1);
  }, 10000);
  forceExit.unref();

  try {
    if (httpServer) {
      await new Promise<void>((resolve) => httpServer!.close(() => resolve()));
    }
    await closeDbConnection();
    clearTimeout(forceExit);
    process.exit(0);
  } catch (error) {
    logger.error("Error during shutdown", { error });
    process.exit(1);
  }
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

// Only start an HTTP listener when run directly (local/Node host). Under serverless
// (Vercel) the app is imported and invoked per-request; see api/index.ts.
if (!process.env.VERCEL) {
  startServer();
}

export { app };
