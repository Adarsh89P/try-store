import type { ImageSourcePropType } from "react-native";

export const SIZES = ["S", "M", "L", "XL", "XXL"] as const;
/** A size label such as "M". Categories without sizes use "One size". */
export type Size = string;

export type CategoryId = "sarees" | "dresses" | "girls" | "men" | "earrings" | "accessories";

export type Category = {
  id: CategoryId;
  label: string;
  noun: string;
  /** Heading above the size buttons, or `null` when the category has no sizes. */
  sizeLabel: string | null;
  sizes: readonly string[];
  tint: string;
};

// TODO: confirm the size ranges per category (for example age sizes for girls' wear).
export const CATEGORIES: Category[] = [
  { id: "sarees", label: "Sarees", noun: "saree", sizeLabel: "Blouse size", sizes: SIZES, tint: "#ffffff" },
  { id: "dresses", label: "Dresses", noun: "dress", sizeLabel: "Size", sizes: SIZES, tint: "#fde4ec" },
  { id: "girls", label: "Girls' wear", noun: "outfit", sizeLabel: "Size", sizes: ["S", "M", "L", "XL"], tint: "#ffe9dc" },
  { id: "men", label: "Men's wear", noun: "outfit", sizeLabel: "Size", sizes: SIZES, tint: "#efe6f7" },
  { id: "earrings", label: "Earrings", noun: "pair", sizeLabel: null, sizes: [], tint: "#e3f0ee" },
  { id: "accessories", label: "Accessories", noun: "item", sizeLabel: null, sizes: [], tint: "#fff0c9" },
];

export const getCategory = (id: string): Category | undefined => CATEGORIES.find((c) => c.id === id);

export type Colour = {
  name: string;
  /** One colour, or two colours shown as a split swatch. */
  swatch: [string] | [string, string];
  image: ImageSourcePropType;
  fit: "cover" | "contain";
  /** Photo height divided by width, used to crop thumbnails. */
  aspect: number;
};

export type Product = {
  slug: string;
  category: CategoryId;
  name: string;
  blurb: string;
  /** TODO: set real prices in rupees. `null` renders as the placeholder "₹[PRICE]". */
  price: number | null;
  unavailableSizes: string[];
  /** TODO: add one entry per colour once there is a photo for each colour. */
  colours: Colour[];
};

// Same sample catalogue as the website. TODO: replace with real products and your own photos.
export const products: Product[] = [
  {
    slug: "ombre-net-saree",
    category: "sarees",
    name: "Ombré Net Saree",
    blurb: "Soft net that fades from orange to magenta, finished with a jewelled border and pallu. Made for weddings and festive nights.",
    price: null,
    unavailableSizes: ["XXL"],
    colours: [{ name: "Orange & magenta", swatch: ["#F08A2A", "#C2187D"], image: require("../assets/products/saree-1.jpg"), fit: "cover", aspect: 1.487 }],
  },
  {
    slug: "banarasi-silk-saree",
    category: "sarees",
    name: "Banarasi Silk Saree",
    blurb: "Cream silk with a woven pattern and a deep green border. A classic for pujas and weddings.",
    price: null,
    unavailableSizes: ["S"],
    colours: [{ name: "Cream & green", swatch: ["#E9DDB8", "#1E9B50"], image: require("../assets/products/saree-2.jpg"), fit: "cover", aspect: 1.0 }],
  },
  {
    slug: "olive-silk-saree",
    category: "sarees",
    name: "Olive Silk Saree",
    blurb: "Olive green saree with a gold paisley pallu and a beaded maroon border. Traditional and easy to wear.",
    price: null,
    unavailableSizes: [],
    colours: [{ name: "Olive & gold", swatch: ["#6B6A2C", "#D6A233"], image: require("../assets/products/saree-3.jpg"), fit: "cover", aspect: 1.499 }],
  },
  {
    slug: "embroidered-georgette-saree",
    category: "sarees",
    name: "Embroidered Georgette Saree",
    blurb: "Gold georgette with floral embroidery, a black border and an orange net trail.",
    price: null,
    unavailableSizes: ["XL", "XXL"],
    colours: [{ name: "Gold & black", swatch: ["#E3C27A", "#1D1A1A"], image: require("../assets/products/saree-4.jpg"), fit: "contain", aspect: 1.0 }],
  },
  {
    slug: "ivory-georgette-saree",
    category: "sarees",
    name: "Ivory Georgette Saree",
    blurb: "Soft ivory georgette with a fine gold border and a flowing pallu. Light and graceful.",
    price: null,
    unavailableSizes: ["S"],
    colours: [{ name: "Ivory", swatch: ["#F3EBDD"], image: require("../assets/products/saree-5.jpg"), fit: "cover", aspect: 1.0 }],
  },
];


const PLACEHOLDERS = {
  dresses: require("../assets/products/placeholder-dresses.png"),
  girls: require("../assets/products/placeholder-girls.png"),
  men: require("../assets/products/placeholder-men.png"),
  earrings: require("../assets/products/placeholder-earrings.png"),
  accessories: require("../assets/products/placeholder-accessories.png"),
};

// Sample items so every category works. TODO: replace names, descriptions, prices and photos.
function sample(category: Exclude<CategoryId, "sarees">, label: string, colours: [string, string][], unavailable: string[] = []): Product[] {
  return [1, 2, 3].map((n) => ({
    slug: `sample-${category}-${n}`,
    category,
    name: `Sample ${label} ${n}`,
    blurb: "[DESCRIPTION] Replace this text with the real product description.",
    price: null,
    unavailableSizes: n === 1 ? unavailable : [],
    colours: colours.map(([name, hex]) => ({ name, swatch: [hex] as [string], image: PLACEHOLDERS[category], fit: "cover" as const, aspect: 4 / 3 })),
  }));
}

products.push(
  ...sample("dresses", "Dress", [["Rose", "#E58AA8"], ["Navy", "#1F2A5A"]], ["XXL"]),
  ...sample("girls", "Girls' outfit", [["Peach", "#F6B79A"], ["Sky", "#9CC9EA"]]),
  ...sample("men", "Men's outfit", [["Charcoal", "#3A3A3F"], ["Cream", "#EFE5CF"]], ["S"]),
  ...sample("earrings", "Earrings", [["Gold", "#D6A233"], ["Silver", "#C0C4C9"]]),
  ...sample("accessories", "Accessory", [["Maroon", "#7A1F3D"], ["Teal", "#1F7A6D"]]),
);

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const productsIn = (category: CategoryId) => products.filter((p) => p.category === category);

/** The size to preselect: the first one in stock, or "One size" for categories without sizes. */
export function firstAvailableSize(p: Product): Size {
  const sizes = getCategory(p.category)?.sizes ?? SIZES;
  if (sizes.length === 0) return "One size";
  return sizes.find((s) => !p.unavailableSizes.includes(s)) ?? sizes[0];
}

/** Text such as "Blouse size L" for a bag line; empty for products without sizes. */
export function sizeText(p: Product, size: string): string {
  const label = getCategory(p.category)?.sizeLabel;
  return label ? `${label} ${size}` : "";
}

/** Crops of the one photo, standing in for extra photos. zoom 1 = fill the box; px/py are 0..1 offsets. */
export const THUMB_VIEWS = [
  { label: "Full view", zoom: 1, px: 0.5, py: 0 },
  { label: "Border detail", zoom: 3, px: 0.5, py: 0.96 },
  { label: "Fabric detail", zoom: 3, px: 0.45, py: 0.62 },
  { label: "Blouse and neckline", zoom: 2.6, px: 0.5, py: 0.22 },
] as const;
