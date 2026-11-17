import { Router } from "express";
import multer from "multer";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { Product } from "../models/Product.js";
import { HttpError } from "../lib/errors.js";
import { sniffImage, type TryOnProvider } from "../lib/tryon/index.js";
import type { Config } from "../config.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
const body = z.object({ slug: z.string(), colour: z.string().optional() });

/** The customer's photo stays in memory for the request and is never written to disk or the database. */
export function tryonRoutes(cfg: Config, provider: TryOnProvider) {
  const r = Router();
  const limiter = rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: true, legacyHeaders: false });

  r.post("/", limiter, upload.single("photo"), async (req, res) => {
    const b = body.parse(req.body);
    if (!req.file) throw new HttpError(400, "PHOTO_REQUIRED", "Add a photo to try on");
    const mime = sniffImage(req.file.buffer);
    if (!mime) throw new HttpError(415, "PHOTO_TYPE", "Use a JPG, PNG or WebP photo");
    const p = await Product.findOne({ slug: b.slug, active: true }).lean();
    if (!p) throw new HttpError(404, "PRODUCT_NOT_FOUND", "Product not found");
    const colour = p.colours.find((c) => c.name === b.colour) ?? p.colours[0]!;
    // TODO: garment image URLs must be publicly reachable for hosted models; set ASSET_BASE_URL to your CDN/site.
    const garmentUrl = /^https?:/.test(colour.image) ? colour.image : `${cfg.ASSET_BASE_URL}${colour.image}`;
    const out = await provider.run({ photo: req.file.buffer, photoMime: mime, garmentUrl, garmentName: p.name });
    res.json({ provider: provider.name, product: p.slug, colour: colour.name, ...out });
  });
  return r;
}
