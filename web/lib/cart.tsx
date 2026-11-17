"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { getProduct, type Product, type Size } from "./products";

export type CartLine = { slug: string; colour: string; size: Size; qty: number };
export type CartItem = CartLine & { key: string; product: Product };

const STORAGE_KEY = "saree-store:cart:v1";

export const lineKey = (l: Pick<CartLine, "slug" | "colour" | "size">) => `${l.slug}|${l.colour}|${l.size}`;

type CartContextValue = {
  /** False until the saved bag has been read from the browser. */
  ready: boolean;
  items: CartItem[];
  count: number;
  add: (line: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function load(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (l): l is CartLine =>
        typeof l === "object" &&
        l !== null &&
        typeof (l as CartLine).slug === "string" &&
        typeof (l as CartLine).colour === "string" &&
        typeof (l as CartLine).size === "string" &&
        Number.isInteger((l as CartLine).qty) &&
        (l as CartLine).qty > 0,
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLines(load());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* storage may be unavailable (private mode); the bag then lives for this visit only */
    }
  }, [lines, ready]);

  const add = useCallback((line: Omit<CartLine, "qty">, qty = 1) => {
    setLines((prev) => {
      const key = lineKey(line);
      const found = prev.find((l) => lineKey(l) === key);
      if (found) return prev.map((l) => (lineKey(l) === key ? { ...l, qty: l.qty + qty } : l));
      return [...prev, { ...line, qty }];
    });
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setLines((prev) => prev.map((l) => (lineKey(l) === key ? { ...l, qty: Math.max(1, qty) } : l)));
  }, []);

  const remove = useCallback((key: string) => {
    setLines((prev) => prev.filter((l) => lineKey(l) !== key));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const items: CartItem[] = [];
    for (const l of lines) {
      const product = getProduct(l.slug);
      if (product) items.push({ ...l, key: lineKey(l), product });
    }
    return {
      ready,
      items,
      count: items.reduce((n, i) => n + i.qty, 0),
      add,
      setQty,
      remove,
      clear,
    };
  }, [lines, ready, add, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
