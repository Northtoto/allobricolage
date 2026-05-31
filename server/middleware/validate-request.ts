import type { Request, Response, NextFunction } from "express";
import { z, type ZodSchema, type ZodError } from "zod";
import { ValidationError } from "@/utils/errors.ts";

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      next(new ValidationError("Invalid request body", formatZodError(result.error)));
      return;
    }

    req.body = result.data;
    next();
  };
}

export function validateQuery<T extends ZodSchema>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      next(new ValidationError("Invalid query parameters", formatZodError(result.error)));
      return;
    }

    req.query = result.data as unknown as typeof req.query;
    next();
  };
}

export function validateParams<T extends ZodSchema>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      next(new ValidationError("Invalid URL parameters", formatZodError(result.error)));
      return;
    }

    req.params = result.data as Record<string, string>;
    next();
  };
}

function formatZodError(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};

  for (const issue of error.issues) {
    const path = issue.path.join(".");
    fields[path || "root"] = issue.message;
  }

  return fields;
}

export const paginationQuerySchema = z.object({
  page: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().min(1)).optional(),
  limit: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().min(1).max(100)).optional(),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).optional(),
});
