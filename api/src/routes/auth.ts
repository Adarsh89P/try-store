import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { User } from "../models/User.js";
import { HttpError } from "../lib/errors.js";
import { checkPassword, hashPassword, requireAuth, signToken } from "../lib/auth.js";
import type { Config } from "../config.js";

const creds = z.object({ email: z.string().email().toLowerCase(), password: z.string().min(8).max(128) });
const registerBody = creds.extend({ name: z.string().trim().min(1).max(80) });

export const publicUser = (u: { _id: unknown; name: string; email: string; role: string }) => ({
  id: String(u._id), name: u.name, email: u.email, role: u.role,
});

export function authRoutes(cfg: Config) {
  const r = Router();
  const limiter = rateLimit({ windowMs: 15 * 60_000, limit: 30, standardHeaders: true, legacyHeaders: false });

  r.post("/register", limiter, async (req, res) => {
    const b = registerBody.parse(req.body);
    if (await User.exists({ email: b.email })) throw new HttpError(409, "EMAIL_TAKEN", "An account with this email already exists");
    const role = cfg.adminEmails.includes(b.email) ? "admin" : "customer";
    const u = await User.create({ name: b.name, email: b.email, passwordHash: await hashPassword(b.password), role });
    res.status(201).json({ token: signToken(cfg.JWT_SECRET, { id: String(u._id), role }), user: publicUser(u) });
  });

  r.post("/login", limiter, async (req, res) => {
    const b = creds.parse(req.body);
    const u = await User.findOne({ email: b.email });
    // Same message for unknown email and wrong password.
    if (!u || !(await checkPassword(b.password, u.passwordHash))) throw new HttpError(401, "BAD_CREDENTIALS", "Email or password is wrong");
    res.json({ token: signToken(cfg.JWT_SECRET, { id: String(u._id), role: u.role }), user: publicUser(u) });
  });

  r.get("/me", requireAuth, async (req, res) => {
    const u = await User.findById(req.auth!.id);
    if (!u) throw new HttpError(401, "UNAUTHENTICATED", "Please sign in");
    res.json({ user: publicUser(u) });
  });

  return r;
}
