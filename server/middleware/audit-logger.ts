import type { Request, Response, NextFunction } from "express";
import { logger } from "@/utils/logger.ts";
import type { AuthenticatedRequest } from "@/types/express.ts";

export type AuditEvent =
  | "auth.login.success"
  | "auth.login.failed"
  | "auth.login.locked"
  | "auth.signup"
  | "auth.logout"
  | "auth.password_change"
  | "auth.token_refresh"
  | "booking.created"
  | "booking.status_changed"
  | "payment.processed"
  | "payment.failed"
  | "review.posted"
  | "technician.profile_updated"
  | "admin.user_banned"
  | "admin.user_unbanned"
  | "security.suspicious_activity"
  | "access.unauthorized";

export interface AuditLogEntry {
  event: AuditEvent;
  userId: string | null;
  username: string | null;
  ip: string | undefined;
  userAgent: string | undefined;
  resourceId?: string;
  resourceType?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export function securityAudit(event: AuditEvent, req: Request, metadata?: Record<string, unknown>): void {
  const authReq = req as AuthenticatedRequest;
  const entry: AuditLogEntry = {
    event,
    userId: authReq.user?.id ?? null,
    username: authReq.user?.username ?? null,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    metadata,
    timestamp: new Date().toISOString(),
  };

  logger.info("SECURITY_AUDIT", entry);
}

export function auditMiddleware(event: AuditEvent) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    const req = _req as Request;
    res.on("finish", () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        securityAudit(event, req);
      }
    });
    next();
  };
}
