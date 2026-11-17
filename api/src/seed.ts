import fs from "node:fs";
import { loadConfig } from "./config.js";
import { connectDb } from "./db.js";
import { Product } from "./models/Product.js";
import mongoose from "mongoose";

// Sample catalogue exported from the website. TODO: replace with real products, prices and photos.
const cfg = loadConfig();
await connectDb(cfg.MONGODB_URI);
const items = JSON.parse(fs.readFileSync(new URL("../data/products.json", import.meta.url), "utf8")) as { slug: string }[];
for (const p of items) await Product.updateOne({ slug: p.slug }, { $setOnInsert: p }, { upsert: true });
console.log(`Seeded ${items.length} products (existing ones left untouched)`);
await mongoose.disconnect();
