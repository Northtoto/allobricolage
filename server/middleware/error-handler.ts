import type { Request, Response, NextFunction } from "express";
import { AppError, ValidationError, isAppError } from "@/utils/errors.ts";
import { errorResponse } from "@/utils/response.ts";
import { logger } from "@/utils/logger.ts";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ValidationError) {
    res.status(400).json(
      errorResponse("VALIDATION_ERROR", err.message, { fields: err.fields })
    );
    return;
  }

  if (isAppError(err)) {
    if (!err.isOperational) {
      logger.error("Non-operational error:", {
        message: err.message,
        stack: err.stack,
        code: err.code,
      });
    }

    res.status(err.statusCode).json(
      errorResponse(err.code, err.message)
    );
    return;
  }

  // Full detail is logged server-side only. The client NEVER receives the raw
  // error message or stack for an unhandled (non-operational) error — that would
  // leak DB schema, file paths, and internals (information disclosure). This holds
  // regardless of NODE_ENV so a misconfigured environment can't open the leak.
  logger.error("Unhandled error:", {
    message: err.message,
    stack: err.stack,
  });

  res.status(500).json(
    errorResponse("INTERNAL_ERROR", "An unexpected error occurred")
  );
}

export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  res.status(404).json(
    errorResponse("NOT_FOUND", `Route ${req.method} ${req.path} not found`)
  );
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
