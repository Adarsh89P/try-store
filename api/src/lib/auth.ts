import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { RequestHandler } from "express";
import { HttpError } from "./errors.js";

export type AuthUser = { id: string; role: "customer" | "admin" };
declare module "express-serve-static-core" {
  interface Request {
    auth?: AuthUser;
  }
}

export const hashPassword = (p: string) => bcrypt.hash(p, 10);
export const checkPassword = (p: string, hash: string) => bcrypt.compare(p, hash);

export const signToken = (secret: string, u: AuthUser) => jwt.sign(u, secret, { expiresIn: "30d" });

function readToken(secret: string, header: string | undefined): AuthUser | null {
  if (!header?.startsWith("Bearer ")) return null;
  try {
    const p = jwt.verify(header.slice(7), secret) as AuthUser;
    return { id: p.id, role: p.role };
  } catch {
    return null;
  }
}

/** Attaches req.auth when a valid token is sent; never rejects. */
export const optionalAuth = (secret: string): RequestHandler => (req, _res, next) => {
  const u = readToken(secret, req.headers.authorization);
  if (u) req.auth = u;
  next();
};

export const requireAuth: RequestHandler = (req, _res, next) =>
  req.auth ? next() : next(new HttpError(401, "UNAUTHENTICATED", "Please sign in"));

export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (!req.auth) return next(new HttpError(401, "UNAUTHENTICATED", "Please sign in"));
  if (req.auth.role !== "admin") return next(new HttpError(403, "FORBIDDEN", "Admins only"));
  next();
};
