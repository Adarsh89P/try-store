import { HttpError } from "./errors.js";
import { validSizes, type CategoryId } from "./catalog.js";

export type ProductLike = {
  slug: string;
  name: string;
  category: CategoryId;
  priceInr?: number | null;
  unavailableSizes: string[];
  colours: { name: string; image: string }[];
  active: boolean;
};

export type LineInput = { slug: string; colour: string; size: string; qty: number };
export type PricedLine = { slug: string; name: string; colour: string; size: string; qty: number; unitPriceInr: number; image: string };
export type Priced = { lines: PricedLine[]; subtotalInr: number; deliveryInr: number; totalInr: number };

/**
 * Prices a bag from the catalogue. The browser's prices are never trusted: only slug, colour, size and
 * quantity come from the customer. Throws an HttpError that the API returns as-is.
 */
export function priceBag(inputs: LineInput[], catalogue: ProductLike[], deliveryInr: number): Priced {
  const bySlug = new Map(catalogue.map((p) => [p.slug, p]));
  const lines: PricedLine[] = inputs.map((it) => {
    const p = bySlug.get(it.slug);
    if (!p || !p.active) throw new HttpError(404, "PRODUCT_NOT_FOUND", `Product not found: ${it.slug}`);
    const colour = p.colours.find((c) => c.name === it.colour);
    if (!colour) throw new HttpError(400, "COLOUR_NOT_FOUND", `${p.name} is not available in ${it.colour}`);
    if (!validSizes(p.category).includes(it.size)) throw new HttpError(400, "SIZE_INVALID", `${it.size} is not a size for ${p.name}`);
    if (p.unavailableSizes.includes(it.size)) throw new HttpError(409, "OUT_OF_STOCK", `${p.name} is out of stock in size ${it.size}`);
    if (p.priceInr == null) throw new HttpError(409, "PRICE_NOT_SET", `${p.name} has no price yet`);
    return { slug: p.slug, name: p.name, colour: colour.name, size: it.size, qty: it.qty, unitPriceInr: p.priceInr, image: colour.image };
  });
  const subtotalInr = lines.reduce((n, l) => n + l.unitPriceInr * l.qty, 0);
  return { lines, subtotalInr, deliveryInr, totalInr: subtotalInr + deliveryInr };
}
