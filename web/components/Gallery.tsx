"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, MouseEvent, PointerEvent } from "react";
import { ChevronLeft, ChevronRight } from "./Icons";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/products";

type Props = {
  products: Product[];
  /** Index of the chosen colour per product slug. */
  colourIndex: Record<string, number>;
  onActiveChange: (index: number) => void;
  /** Jump straight to this product (no animation), for example when arriving from search or the wishlist. */
  startIndex?: number;
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

function lerp(k: number, table: number[]): number {
  const a = clamp(k, 0, table.length - 1);
  const lo = Math.floor(a);
  const hi = Math.min(lo + 1, table.length - 1);
  return table[lo] + (table[hi] - table[lo]) * (a - lo);
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Scroll-linked gallery. A transparent native scroller (scroll-snap, one product per screen width)
 * sits on top of the cards and drives `t`, the fractional index of the product in the main slot.
 * Upcoming products wait small and blurred on the left and slide right into the main slot as you
 * move forward; the one you leave slides out to the right. There is no mouse-wheel hijacking:
 * move with drag, swipe, the arrow buttons, arrow keys, or by clicking a small saree.
 */
export default function Gallery({ products, colourIndex, onActiveChange, startIndex = 0 }: Props) {
  const N = products.length;
  const stageRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const lastIndex = useRef(0);
  const drag = useRef<{ x: number; left: number } | null>(null);
  const moved = useRef(false);

  const [t, setT] = useState(0);
  const [width, setWidth] = useState(760);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    setWidth(el.clientWidth || 760);
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width || 760));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || startIndex <= 0) return;
    el.scrollTo({ left: clamp(startIndex, 0, N - 1) * el.clientWidth, behavior: "auto" });
  }, [startIndex, N]);

  const goTo = useCallback(
    (index: number) => {
      const el = scrollerRef.current;
      if (!el) return;
      el.scrollTo({
        left: clamp(index, 0, N - 1) * el.clientWidth,
        behavior: prefersReducedMotion() ? "auto" : "smooth",
      });
    },
    [N],
  );

  const currentIndex = () => {
    const el = scrollerRef.current;
    return el ? Math.round(el.scrollLeft / (el.clientWidth || 1)) : 0;
  };

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const tt = clamp(el.scrollLeft / (el.clientWidth || 1), 0, N - 1);
    setT(tt);
    const i = Math.round(tt);
    if (i !== lastIndex.current) {
      lastIndex.current = i;
      onActiveChange(i);
    }
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const el = e.currentTarget;
    drag.current = { x: e.clientX, left: el.scrollLeft };
    moved.current = false;
    el.style.scrollSnapType = "none";
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 5) moved.current = true;
    e.currentTarget.scrollLeft = d.left - dx * 1.6;
  };

  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    drag.current = null;
    e.currentTarget.style.scrollSnapType = "";
    goTo(Math.round(e.currentTarget.scrollLeft / (e.currentTarget.clientWidth || 1)));
    window.setTimeout(() => {
      moved.current = false;
    }, 0);
  };

  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    if (moved.current) return;
    const hit = document
      .elementsFromPoint(e.clientX, e.clientY)
      .map((n) => n.closest<HTMLElement>("[data-index]"))
      .find((n): n is HTMLElement => n !== null);
    if (!hit) return;
    const idx = Number(hit.dataset.index);
    if (Number.isInteger(idx)) goTo(idx);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(currentIndex() + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(currentIndex() - 1);
    }
  };

  // Layout metrics follow the stage width so the same motion works on phones and desktops.
  const cardW = clamp(width * 0.44, 220, 340);
  const f = cardW / 340;
  const artH = Math.round((cardW * 520) / 340);
  const TOP = 24;
  const META_H = 72;
  const CONTROLS_H = 72;
  const stageH = TOP + artH + META_H + CONTROLS_H;
  const mainCx = width < 560 ? width * 0.6 : width * 0.62;

  function cardStyle(k: number): { style: CSSProperties; meta: number; hidden: boolean } {
    let dx: number;
    let scale: number;
    let blur: number;
    let opacity: number;
    if (k >= 0) {
      dx = -lerp(k, [0, 288, 410, 480, 520]) * f;
      scale = lerp(k, [1, 0.6, 0.42, 0.3, 0.25]);
      blur = lerp(k, [0, 3, 5, 7, 8]);
      opacity = lerp(k, [1, 0.88, 0.6, 0.3, 0]);
    } else {
      const m = Math.min(-k, 1);
      dx = 260 * f * m;
      scale = 1 - 0.1 * m;
      blur = 4 * m;
      opacity = 1 - m;
    }
    const zIndex = k >= 0 ? Math.max(1, Math.round(100 - k * 12)) : 5;
    return {
      style: {
        top: TOP,
        width: cardW,
        left: mainCx + dx - cardW / 2,
        transform: `scale(${scale.toFixed(3)})`,
        filter: `blur(${blur.toFixed(1)}px)`,
        opacity: Number(opacity.toFixed(2)),
        zIndex,
        pointerEvents: opacity < 0.04 ? "none" : undefined,
      },
      meta: Math.max(0, 1 - Math.abs(k) * 2),
      hidden: Math.abs(k) > 0.5,
    };
  }

  return (
    <div ref={stageRef} className="relative min-w-0 overflow-hidden" style={{ height: stageH }}>
      {products.map((p, i) => {
        const colour = p.colours[colourIndex[p.slug] ?? 0];
        const { style, meta, hidden } = cardStyle(i - t);
        return (
          <div
            key={p.slug}
            data-index={i}
            aria-hidden={hidden}
            className="absolute will-change-transform"
            style={style}
          >
            <div
              className="overflow-hidden rounded-[20px] bg-white shadow-[0_18px_40px_rgba(43,18,32,.18)]"
              style={{ height: artH }}
            >
              {/* TODO: swap to next/image once the photos are your own and sized. */}
              <img
                src={colour.image}
                alt={`${p.name}, worn by a model`}
                draggable={false}
                loading={i < 3 ? "eager" : "lazy"}
                className="block h-full w-full object-top"
                style={{ objectFit: colour.fit }}
              />
            </div>
            <div className="px-1 pt-3.5" style={{ opacity: meta }}>
              <div className="font-display text-xl font-medium">{p.name}</div>
              <div className="mt-1 text-[15px] font-bold text-brand">{formatPrice(p.price)}</div>
            </div>
          </div>
        );
      })}

      <div
        ref={scrollerRef}
        role="group"
        aria-roledescription="carousel"
        aria-label="Saree gallery. Drag, swipe or use the arrow buttons."
        tabIndex={0}
        data-testid="gallery-scroller"
        className="no-scrollbar absolute inset-0 z-[200] cursor-grab snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain"
        onScroll={onScroll}
        onClick={onClick}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div className="flex h-full" style={{ width: `${N * 100}%` }}>
          {products.map((p) => (
            <div key={p.slug} className="h-full shrink-0 snap-start snap-always" style={{ flex: `0 0 ${100 / N}%` }} />
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 z-[300] flex items-center gap-3">
        <button
          type="button"
          onClick={() => goTo(currentIndex() - 1)}
          disabled={Math.round(t) === 0}
          aria-label="Previous saree"
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-line bg-white shadow-[0_6px_18px_rgba(43,18,32,.12)] disabled:opacity-40"
        >
          <ChevronLeft />
        </button>
        <button
          type="button"
          onClick={() => goTo(currentIndex() + 1)}
          disabled={Math.round(t) === N - 1}
          aria-label="Next saree"
          className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white shadow-[0_6px_18px_rgba(214,25,107,.3)] disabled:opacity-40"
        >
          <ChevronRight />
        </button>
        <div aria-hidden="true" className="ml-2 h-1 w-[140px] overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-brand" style={{ width: `${(t / (N - 1)) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
