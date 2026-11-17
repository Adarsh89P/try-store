export const CATEGORY_IDS = ["sarees", "dresses", "girls", "men", "earrings", "accessories"] as const;
export type CategoryId = (typeof CATEGORY_IDS)[number];

const STANDARD = ["S", "M", "L", "XL", "XXL"];

// TODO: confirm size ranges per category (for example age sizes for girls' wear). Mirrors the website and app.
export const SIZES_BY_CATEGORY: Record<CategoryId, string[]> = {
  sarees: STANDARD,
  dresses: STANDARD,
  girls: ["S", "M", "L", "XL"],
  men: STANDARD,
  earrings: [],
  accessories: [],
};

export const ONE_SIZE = "One size";

/** Sizes a customer may order for a category; categories without sizes use "One size". */
export function validSizes(category: CategoryId): string[] {
  const s = SIZES_BY_CATEGORY[category];
  return s.length ? s : [ONE_SIZE];
}
