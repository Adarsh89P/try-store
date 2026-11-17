import { Router } from "express";
import { z } from "zod";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import { HttpError } from "../lib/errors.js";
import { requireAuth } from "../lib/auth.js";

const address = z.object({
  label: z.string().max(30).default("Home"),
  name: z.string().min(1), phone: z.string().regex(/^[0-9+\- ]{7,15}$/),
  line1: z.string().min(1), line2: z.string().default(""),
  city: z.string().min(1), state: z.string().min(1), pincode: z.string().regex(/^[0-9]{6}$/),
});

/** Wishlist and saved addresses for the signed-in customer. */
export function meRoutes() {
  const r = Router();
  r.use(requireAuth);

  r.get("/wishlist", async (req, res) => {
    const u = await User.findById(req.auth!.id).lean();
    res.json({ slugs: u?.wishlist ?? [] });
  });

  r.put("/wishlist/:slug", async (req, res) => {
    if (!(await Product.exists({ slug: req.params.slug, active: true }))) throw new HttpError(404, "PRODUCT_NOT_FOUND", "Product not found");
    const u = await User.findByIdAndUpdate(req.auth!.id, { $addToSet: { wishlist: req.params.slug } }, { new: true });
    res.json({ slugs: u?.wishlist ?? [] });
  });

  r.delete("/wishlist/:slug", async (req, res) => {
    const u = await User.findByIdAndUpdate(req.auth!.id, { $pull: { wishlist: req.params.slug } }, { new: true });
    res.json({ slugs: u?.wishlist ?? [] });
  });

  r.get("/addresses", async (req, res) => {
    const u = await User.findById(req.auth!.id).lean();
    res.json({ addresses: u?.addresses ?? [] });
  });

  r.post("/addresses", async (req, res) => {
    const b = address.parse(req.body);
    const u = await User.findByIdAndUpdate(req.auth!.id, { $push: { addresses: b } }, { new: true });
    res.status(201).json({ addresses: u?.addresses ?? [] });
  });

  r.delete("/addresses/:id", async (req, res) => {
    const u = await User.findByIdAndUpdate(req.auth!.id, { $pull: { addresses: { _id: req.params.id } } }, { new: true });
    res.json({ addresses: u?.addresses ?? [] });
  });

  return r;
}
