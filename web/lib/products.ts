export const SIZES = ["S", "M", "L", "XL", "XXL"] as const;
/** A size label such as "M". Categories without sizes use "One size". */
export type Size = string;

export type CategoryId = "sarees" | "dresses" | "girls" | "men" | "earrings" | "accessories";

export type Category = {
  id: CategoryId;
  label: string;
  /** Singular word used in headings such as "Photos of this saree". */
  noun: string;
  /** Heading above the size buttons, or `null` when the category has no sizes. */
  sizeLabel: string | null;
  sizes: readonly string[];
  tint: string;
  href: string;
};

// TODO: confirm the size ranges per category (for example age sizes for girls' wear).
export const CATEGORIES: Category[] = [
  { id: "sarees", label: "Sarees", noun: "saree", sizeLabel: "Blouse size", sizes: SIZES, tint: "#ffffff", href: "/sarees" },
  { id: "dresses", label: "Dresses", noun: "dress", sizeLabel: "Size", sizes: SIZES, tint: "#fde4ec", href: "/shop/dresses" },
  { id: "girls", label: "Girls' wear", noun: "outfit", sizeLabel: "Size", sizes: ["S", "M", "L", "XL"], tint: "#ffe9dc", href: "/shop/girls" },
  { id: "men", label: "Men's wear", noun: "outfit", sizeLabel: "Size", sizes: SIZES, tint: "#efe6f7", href: "/shop/men" },
  { id: "earrings", label: "Earrings", noun: "pair", sizeLabel: null, sizes: [], tint: "#e3f0ee", href: "/shop/earrings" },
  { id: "accessories", label: "Accessories", noun: "item", sizeLabel: null, sizes: [], tint: "#fff0c9", href: "/shop/accessories" },
];

// Photos are served from /public. On GitHub Pages the site lives under /<repo>, so image paths need that prefix.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const getCategory = (id: string): Category | undefined => CATEGORIES.find((c) => c.id === id);

export type Colour = {
  name: string;
  /** Any CSS background value (a hex colour or a gradient) used for the swatch. */
  swatch: string;
  /** Model photo for this colour. */
  image: string;
  fit: "cover" | "contain";
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

// Sample catalogue. Replace names, copy, prices and photos with your real products.
// TODO: the photos currently come from stock sites and still carry watermarks. Use your own.
export const products: Product[] = [
  {
    slug: "ombre-net-saree",
    category: "sarees",
    name: "Ombré Net Saree",
    blurb:
      "Soft net that fades from orange to magenta, finished with a jewelled border and pallu. Made for weddings and festive nights.",
    price: null,
    unavailableSizes: ["XXL"],
    colours: [
      {
        name: "Orange & magenta",
        swatch: "linear-gradient(135deg, #F08A2A 0 50%, #C2187D 50% 100%)",
        image: `${BASE}/products/saree-1.jpg`,
        fit: "cover",
      },
    ],
  },
  {
    slug: "banarasi-silk-saree",
    category: "sarees",
    name: "Banarasi Silk Saree",
    blurb: "Cream silk with a woven pattern and a deep green border. A classic for pujas and weddings.",
    price: null,
    unavailableSizes: ["S"],
    colours: [
      {
        name: "Cream & green",
        swatch: "linear-gradient(135deg, #E9DDB8 0 50%, #1E9B50 50% 100%)",
        image: `${BASE}/products/saree-2.jpg`,
        fit: "cover",
      },
    ],
  },
  {
    slug: "olive-silk-saree",
    category: "sarees",
    name: "Olive Silk Saree",
    blurb:
      "Olive green saree with a gold paisley pallu and a beaded maroon border. Traditional and easy to wear.",
    price: null,
    unavailableSizes: [],
    colours: [
      {
        name: "Olive & gold",
        swatch: "linear-gradient(135deg, #6B6A2C 0 50%, #D6A233 50% 100%)",
        image: `${BASE}/products/saree-3.jpg`,
        fit: "cover",
      },
    ],
  },
  {
    slug: "embroidered-georgette-saree",
    category: "sarees",
    name: "Embroidered Georgette Saree",
    blurb: "Gold georgette with floral embroidery, a black border and an orange net trail.",
    price: null,
    unavailableSizes: ["XL", "XXL"],
    colours: [
      {
        name: "Gold & black",
        swatch: "linear-gradient(135deg, #E3C27A 0 50%, #1D1A1A 50% 100%)",
        image: `${BASE}/products/saree-4.jpg`,
        fit: "contain",
      },
    ],
  },
  {
    slug: "ivory-georgette-saree",
    category: "sarees",
    name: "Ivory Georgette Saree",
    blurb: "Soft ivory georgette with a fine gold border and a flowing pallu. Light and graceful.",
    price: null,
    unavailableSizes: ["S"],
    colours: [
      {
        name: "Ivory",
        swatch: "#F3EBDD",
        image: `${BASE}/products/saree-5.jpg`,
        fit: "cover",
      },
    ],
  },
];


// Sample items so every category page works. TODO: replace names, descriptions, prices and photos.
function sample(category: CategoryId, label: string, n: number, colours: [string, string][], unavailable: string[] = []): Product[] {
  return Array.from({ length: n }, (_, i) => ({
    slug: `sample-${category}-${i + 1}`,
    category,
    name: `Sample ${label} ${i + 1}`,
    blurb: "[DESCRIPTION] Replace this text with the real product description.",
    price: null,
    unavailableSizes: i === 0 ? unavailable : [],
    colours: colours.map(([name, swatch]) => ({
      name,
      swatch,
      image: `${BASE}/products/placeholder-${category}.svg`,
      fit: "cover" as const,
    })),
  }));
}

products.push(
  ...sample("dresses", "Dress", 3, [["Rose", "#E58AA8"], ["Navy", "#1F2A5A"]], ["XXL"]),
  ...sample("girls", "Girls' outfit", 3, [["Peach", "#F6B79A"], ["Sky", "#9CC9EA"]]),
  ...sample("men", "Men's outfit", 3, [["Charcoal", "#3A3A3F"], ["Cream", "#EFE5CF"]], ["S"]),
  ...sample("earrings", "Earrings", 3, [["Gold", "#D6A233"], ["Silver", "#C0C4C9"]]),
  ...sample("accessories", "Accessory", 3, [["Maroon", "#7A1F3D"], ["Teal", "#1F7A6D"]]),
);

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export const productsIn = (category: CategoryId) => products.filter((p) => p.category === category);

/** Link that opens a category's browse page on the given product. */
export function browseHref(p: Product): string {
  const cat = getCategory(p.category);
  return `${cat?.href ?? "/sarees"}?p=${p.slug}`;
}

/** The size to preselect: the first one in stock, or "One size" for categories without sizes. */
export function firstAvailableSize(p: Product): Size {
  const cat = getCategory(p.category);
  const sizes = cat?.sizes ?? SIZES;
  if (sizes.length === 0) return "One size";
  return sizes.find((s) => !p.unavailableSizes.includes(s)) ?? sizes[0];
}

/** Crops of the single photo used as stand-ins for extra photos of the same product. */
export const THUMB_VIEWS = [
  { label: "Full view", size: "cover", position: "center top" },
  { label: "Border detail", size: "300%", position: "50% 96%" },
  { label: "Fabric detail", size: "300%", position: "45% 62%" },
  { label: "Blouse and neckline", size: "260%", position: "50% 22%" },
] as const;

/** Text such as "Blouse size L" or "Size M" for a bag line; empty for products without sizes. */
export function sizeText(p: Product, size: string): string {
  const label = getCategory(p.category)?.sizeLabel;
  return label ? `${label} ${size}` : "";
}
