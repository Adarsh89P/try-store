import { Router } from "express";
import { z } from "zod";
import { Product } from "../models/Product.js";
import { CATEGORY_IDS } from "../lib/catalog.js";
import { HttpError } from "../lib/errors.js";
import { requireAdmin } from "../lib/auth.js";

const colour = z.object({
  name: z.string().min(1),
  swatch: z.string().default("#cccccc"),
  image: z.string().min(1),
  fit: z.string().default("cover"),
});
const productBody = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  category: z.enum(CATEGORY_IDS),
  name: z.string().min(1),
  blurb: z.string().default(""),
  priceInr: z.number().int().min(0).nullable().default(null),
  unavailableSizes: z.array(z.string()).default([]),
  colours: z.array(colour).min(1),
  active: z.boolean().default(true),
});

const listQuery = z.object({
  category: z.enum(CATEGORY_IDS).optional(),
  q: z.string().trim().max(60).optional(),
  colour: z.string().optional(),
  size: z.string().optional(),
  sort: z.enum(["new", "name"]).default("new"),
});

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function productRoutes() {
  const r = Router();

  r.get("/", async (req, res) => {
    const q = listQuery.parse(req.query);
    const filter: Record<string, unknown> = { active: true };
    if (q.category) filter.category = q.category;
    if (q.q) filter.$or = [{ name: new RegExp(escapeRe(q.q), "i") }, { blurb: new RegExp(escapeRe(q.q), "i") }];
    if (q.colour) filter["colours.name"] = q.colour;
    if (q.size) filter.unavailableSizes = { $ne: q.size };
    const items = await Product.find(filter).sort(q.sort === "name" ? { name: 1 } : { createdAt: -1 }).lean();
    res.json({ items });
  });

  r.get("/:slug", async (req, res) => {
    const p = await Product.findOne({ slug: req.params.slug, active: true }).lean();
    if (!p) throw new HttpError(404, "PRODUCT_NOT_FOUND", "Product not found");
    res.json({ product: p });
  });

  r.post("/", requireAdmin, async (req, res) => {
    const b = productBody.parse(req.body);
    if (await Product.exists({ slug: b.slug })) throw new HttpError(409, "SLUG_TAKEN", "That slug is already used");
    res.status(201).json({ product: await Product.create(b) });
  });

  r.patch("/:slug", requireAdmin, async (req, res) => {
    const b = productBody.partial().omit({ slug: true }).parse(req.body);
    const p = await Product.findOneAndUpdate({ slug: req.params.slug }, b, { new: true });
    if (!p) throw new HttpError(404, "PRODUCT_NOT_FOUND", "Product not found");
    res.json({ product: p });
  });

  // Soft delete keeps old orders readable.
  r.delete("/:slug", requireAdmin, async (req, res) => {
    const p = await Product.findOneAndUpdate({ slug: req.params.slug }, { active: false }, { new: true });
    if (!p) throw new HttpError(404, "PRODUCT_NOT_FOUND", "Product not found");
    res.status(204).end();
  });

  return r;
}
