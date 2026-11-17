import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export const notFound: RequestHandler = (_req, _res, next) => next(new HttpError(404, "NOT_FOUND", "Route not found"));

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({ error: { code: "VALIDATION", message: "Invalid request", issues: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })) } });
    return;
  }
  if (err && typeof err === "object" && (err as { code?: string }).code === "LIMIT_FILE_SIZE") {
    res.status(413).json({ error: { code: "FILE_TOO_LARGE", message: "The photo is too large (5 MB maximum)" } });
    return;
  }
  if (err && typeof err === "object" && (err as { type?: string }).type === "entity.parse.failed") {
    res.status(400).json({ error: { code: "BAD_JSON", message: "Request body is not valid JSON" } });
    return;
  }
  console.error(err);
  res.status(500).json({ error: { code: "INTERNAL", message: "Something went wrong" } });
};
