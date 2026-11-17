"use client";

import Link from "next/link";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "./Icons";
import { formatPrice } from "@/lib/format";
import { browseHref, productsIn } from "@/lib/products";

/** Horizontal row of sarees. Scrolls by hand (drag, swipe, scrollbar) or with the two buttons. */
export default function TrendingRail() {
  const rail = useRef<HTMLDivElement>(null);
  const slide = (dir: 1 | -1) => rail.current?.scrollBy({ left: dir * 560, behavior: "smooth" });

  return (
    <section aria-label="Trending sarees" className="mx-auto w-full max-w-[1360px] px-5 pb-14 pt-6 sm:px-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <h2 className="m-0 font-display text-4xl font-medium">Trending sarees</h2>
        <div className="flex items-center gap-3">
          <Link href="/sarees" className="inline-flex min-h-11 items-center text-[15px] font-bold text-brand">
            View all
          </Link>
          <button
            type="button"
            onClick={() => slide(-1)}
            aria-label="Scroll left"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => slide(1)}
            aria-label="Scroll right"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div
        ref={rail}
        tabIndex={0}
        aria-label="Trending sarees, scroll sideways"
        className="flex snap-x snap-proximity gap-5 overflow-x-auto pb-5 [scrollbar-color:#d6196b_#f0dde4] [scrollbar-width:thin]"
      >
        {productsIn("sarees").map((p) => (
          <Link key={p.slug} href={browseHref(p)} className="group block w-[260px] shrink-0 snap-start">
            <div className="h-[340px] overflow-hidden rounded-[18px] border border-line bg-white">
              {/* TODO: swap to next/image once the photos are your own and sized. */}
              <img
                src={p.colours[0].image}
                alt={`${p.name}, worn by a model`}
                loading="lazy"
                className="block h-full w-full object-top"
                style={{ objectFit: p.colours[0].fit }}
              />
            </div>
            <div className="mt-3 font-display text-[19px] font-medium group-hover:text-brand">{p.name}</div>
            <div className="mt-1 text-[15px] font-bold text-brand">{formatPrice(p.price)}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
