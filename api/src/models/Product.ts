import { Schema, model } from "mongoose";
import { CATEGORY_IDS } from "../lib/catalog.js";

const colourSchema = new Schema(
  {
    name: { type: String, required: true },
    swatch: { type: String, default: "#cccccc" },
    image: { type: String, required: true },
    fit: { type: String, default: "cover" },
  },
  { _id: false },
);

const productSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    category: { type: String, enum: CATEGORY_IDS, required: true, index: true },
    name: { type: String, required: true },
    blurb: { type: String, default: "" },
    // TODO: prices are not decided yet; null means "not set" and blocks ordering.
    priceInr: { type: Number, default: null, min: 0 },
    unavailableSizes: { type: [String], default: [] },
    colours: { type: [colourSchema], validate: (v: unknown[]) => v.length > 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Product = model("Product", productSchema);
