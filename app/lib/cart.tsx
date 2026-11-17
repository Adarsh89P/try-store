import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { getProduct, type Product, type Size } from "./products";

export type CartLine = { slug: string; colour: string; size: Size; qty: number };
export type CartItem = CartLine & { key: string; product: Product };

const STORAGE_KEY = "saree-app:cart:v1";
export const lineKey = (l: Pick<CartLine, "slug" | "colour" | "size">) => `${l.slug}|${l.colour}|${l.size}`;

type Ctx = {
  ready: boolean;
  items: CartItem[];
  count: number;
  add: (line: Omit<CartLine, "qty">) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<Ctx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) {
          setLines(parsed.filter((l): l is CartLine => !!l && typeof l.slug === "string" && typeof l.colour === "string" && typeof l.size === "string" && Number.isInteger(l.qty) && l.qty > 0));
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lines)).catch(() => {});
  }, [lines, ready]);

  const add = useCallback((line: Omit<CartLine, "qty">) => {
    setLines((prev) => {
      const key = lineKey(line);
      return prev.some((l) => lineKey(l) === key)
        ? prev.map((l) => (lineKey(l) === key ? { ...l, qty: l.qty + 1 } : l))
        : [...prev, { ...line, qty: 1 }];
    });
  }, []);
  const setQty = useCallback((key: string, qty: number) => setLines((p) => p.map((l) => (lineKey(l) === key ? { ...l, qty: Math.max(1, qty) } : l))), []);
  const remove = useCallback((key: string) => setLines((p) => p.filter((l) => lineKey(l) !== key)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<Ctx>(() => {
    const items: CartItem[] = [];
    for (const l of lines) {
      const product = getProduct(l.slug);
      if (product) items.push({ ...l, key: lineKey(l), product });
    }
    return { ready, items, count: items.reduce((n, i) => n + i.qty, 0), add, setQty, remove, clear };
  }, [lines, ready, add, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): Ctx {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
