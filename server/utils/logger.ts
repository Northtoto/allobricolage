import winston from "winston";
import { isDev } from "@/config/index.ts";

const { combine, timestamp, json, errors, printf, colorize } = winston.format;

const devFormat = printf(({ level, message, timestamp: ts, stack, ...metadata }) => {
  let msg = `${ts} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  if (stack) {
    msg += `\n${stack}`;
  }
  return msg;
});

export const logger = winston.createLogger({
  level: isDev ? "debug" : "info",
  defaultMeta: { service: "allobricolage-api" },
  transports: [
    new winston.transports.Console({
      format: isDev
        ? combine(
            colorize(),
            timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
            errors({ stack: true }),
            devFormat
          )
        : combine(
            timestamp(),
            errors({ stack: true }),
            json()
          ),
    }),
  ],
});

export const requestLogger = winston.createLogger({
  level: "info",
  defaultMeta: { service: "allobricolage-api" },
  transports: [
    new winston.transports.Console({
      format: combine(
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        printf(({ timestamp: ts, level, message, method, path, statusCode, duration, userId, ip }) => {
          return `${ts} [${level}]: ${method} ${path} ${statusCode} ${duration}ms ${ip ?? ""} ${userId ?? ""}`;
        })
      ),
    }),
  ],
});
