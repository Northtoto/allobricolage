import type { Request, Response, NextFunction } from "express";
import { requestLogger } from "@/utils/logger.ts";

export function requestLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    requestLogger.info("HTTP Request", {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userId: ((req as unknown) as Record<string, unknown> & { user?: { id?: string } }).user?.id,
    });
  });

  next();
}
