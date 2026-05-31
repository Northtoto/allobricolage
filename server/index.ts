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

async function startServer(): Promise<void> {
  try {
    const connected = await testDatabaseConnection();
    if (!connected) {
      logger.error("Failed to connect to database. Exiting.");
      process.exit(1);
    }

    app.listen(5002, () => {
      logger.info(`Server running on port 5002 in ${isProd ? "production" : "development"} mode`);
    });
  } catch (error) {
    logger.error("Failed to start server", { error });
    process.exit(1);
  }
}

process.on("SIGTERM", async () => {
  logger.info("SIGTERM received. Shutting down gracefully...");
  await closeDbConnection();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received. Shutting down gracefully...");
  await closeDbConnection();
  process.exit(0);
});

startServer();
