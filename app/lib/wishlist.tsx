import { createContext, useCallback, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { usePersisted } from "./store";
import { getProduct, type Product } from "./products";

type Ctx = { ready: boolean; items: Product[]; count: number; has: (slug: string) => boolean; toggle: (slug: string) => void };
const WishlistContext = createContext<Ctx | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [slugs, setSlugs, ready] = usePersisted<string[]>("saree-app:wishlist:v1", [], (v): v is string[] => Array.isArray(v) && v.every((s) => typeof s === "string"));
  const toggle = useCallback((slug: string) => setSlugs((p) => (p.includes(slug) ? p.filter((s) => s !== slug) : [...p, slug])), [setSlugs]);
  const value = useMemo<Ctx>(() => {
    const items = slugs.map(getProduct).filter((p): p is Product => !!p);
    return { ready, items, count: items.length, has: (s) => slugs.includes(s), toggle };
  }, [slugs, ready, toggle]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): Ctx {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return ctx;
}
