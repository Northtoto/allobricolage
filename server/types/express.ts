import type { Request } from "express";
import type { User } from "@/db/schema.ts";

declare module "express" {
  interface Request {
    id?: string;
  }
}

export interface AuthenticatedRequest extends Request {
  user?: Omit<User, "password" | "googleId">;
  token?: string;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  sort?: string;
  order?: "asc" | "desc";
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}
