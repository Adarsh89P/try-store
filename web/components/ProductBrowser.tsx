"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Gallery from "./Gallery";
import { BagIcon, HeartIcon } from "./Icons";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { useWishlist } from "@/lib/wishlist";
import { firstAvailableSize, productsIn, THUMB_VIEWS, type Category, type Size } from "@/lib/products";

const labelClass = "mb-3 text-[13px] font-semibold uppercase tracking-[.04em] text-muted";

export default function ProductBrowser({ category }: { category: Category }) {
  const cart = useCart();
  const wishlist = useWishlist();
  const products = productsIn(category.id);
  const [active, setActive] = useState(0);
  const [startIndex, setStartIndex] = useState(0);
  const [colourIndex, setColourIndex] = useState<Record<string, number>>({});
  const [sizeBySlug, setSizeBySlug] = useState<Record<string, Size>>({});
  const [justAdded, setJustAdded] = useState(false);

  const p = products[active];
  const ci = colourIndex[p.slug] ?? 0;
  const colour = p.colours[ci];
  const chosen = sizeBySlug[p.slug];
  const size: Size = chosen && !p.unavailableSizes.includes(chosen) ? chosen : firstAvailableSize(p);
  const isWished = wishlist.has(p.slug);

  // Arriving from search or the wishlist (?p=slug) opens the browser on that product.
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("p");
    const i = products.findIndex((x) => x.slug === slug);
    if (i > 0) {
      setStartIndex(i);
      setActive(i);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!justAdded) return;
    const id = window.setTimeout(() => setJustAdded(false), 2500);
    return () => window.clearTimeout(id);
  }, [justAdded]);

  const addToBag = () => {
    cart.add({ slug: p.slug, colour: colour.name, size });
    setJustAdded(true);
  };

  return (
    <>
      <div className="mx-auto flex w-full max-w-[1360px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 pt-5 sm:px-10">
        <nav aria-label="Breadcrumb" className="text-sm text-muted">
          <Link href="/" className="hover:text-brand">Home</Link> /{" "}
          <strong className="text-plum">{category.label}</strong>
        </nav>
        <p className="m-0 text-sm text-muted">
          <strong className="text-plum">
            {active + 1} of {products.length}
          </strong>{" "}
          · Drag, swipe or use the arrows to bring the next {category.noun} forward.
        </p>
      </div>

      <main className="mx-auto flex w-full max-w-[1360px] flex-1 flex-wrap items-start gap-8 px-5 pb-8 pt-2 sm:px-10">
        <div className="min-w-0 flex-[999_1_600px]">
          <Gallery
            products={products}
            colourIndex={colourIndex}
            startIndex={startIndex}
            onActiveChange={(i) => {
              setActive(i);
              setJustAdded(false);
            }}
          />
          <p className="sr-only" aria-live="polite">
            Showing {p.name}, {active + 1} of {products.length}
          </p>
        </div>

        <section
          aria-label="Product details"
          className="mt-6 flex min-w-0 max-w-[520px] flex-[1_1_440px] flex-col gap-6 rounded-3xl border border-line bg-white p-8"
        >
          <div>
            <h1 className="m-0 text-balance font-display text-[32px] font-medium leading-[1.15]">{p.name}</h1>
            <p className="mt-2 text-xl font-bold text-brand">{formatPrice(p.price)}</p>
          </div>

          <div>
            <p className={labelClass}>
              Colour{" "}
              <span className="ml-1 text-[15px] font-medium normal-case tracking-normal text-plum">{colour.name}</span>
            </p>
            <div className="flex flex-wrap gap-3.5">
              {p.colours.map((c, i) => (
                <button
                  key={c.name}
                  type="button"
                  aria-label={c.name}
                  aria-pressed={i === ci}
                  onClick={() => {
                    setColourIndex((prev) => ({ ...prev, [p.slug]: i }));
                    setJustAdded(false);
                  }}
                  className="h-11 w-11 rounded-full border border-black/20 transition-shadow"
                  style={{
                    background: c.swatch,
                    boxShadow: i === ci ? "0 0 0 3px #fff, 0 0 0 5px #d6196b" : "none",
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <p className={labelClass}>Photos of this {category.noun}</p>
            <div className="flex flex-wrap gap-3">
              {THUMB_VIEWS.map((v, i) => (
                <div
                  key={v.label}
                  role="img"
                  aria-label={v.label}
                  className={`h-[100px] w-20 rounded-xl border-2 bg-white bg-no-repeat ${
                    i === 0 ? "border-brand" : "border-line"
                  }`}
                  style={{
                    backgroundImage: `url(${colour.image})`,
                    backgroundSize: v.size,
                    backgroundPosition: v.position,
                  }}
                />
              ))}
            </div>
          </div>

          {category.sizeLabel && (
          <div>
            <p className={labelClass}>{category.sizeLabel}</p>
            <div className="flex flex-wrap gap-2.5">
              {category.sizes.map((s) => {
                const off = p.unavailableSizes.includes(s);
                const on = s === size;
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={off}
                    aria-pressed={on}
                    aria-label={off ? `Size ${s}, out of stock` : `Size ${s}`}
                    onClick={() => {
                      setSizeBySlug((prev) => ({ ...prev, [p.slug]: s }));
                      setJustAdded(false);
                    }}
                    className={`h-11 min-w-[52px] rounded-full border-[1.5px] px-3.5 text-sm font-semibold ${
                      off
                        ? "cursor-not-allowed border-dashed border-[#cdb8c2] bg-white text-[#7a6270] line-through"
                        : on
                          ? "border-brand bg-brand text-white"
                          : "border-edge bg-white text-plum hover:border-brand"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
          )}

          <div>
            <p className="mb-2 text-[13px] font-semibold uppercase tracking-[.04em] text-muted">Description</p>
            <p className="m-0 text-pretty text-[15px] leading-relaxed">{p.blurb}</p>
          </div>
        </section>
      </main>

      <div className="sticky bottom-0 z-40 border-t border-line bg-white shadow-[0_-8px_24px_rgba(43,18,32,.06)]">
        <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-3.5 sm:px-10">
          <div className="flex min-w-0 items-center gap-3.5">
            <div
              aria-hidden="true"
              className="h-14 w-11 shrink-0 rounded-[10px] border border-line bg-white bg-cover bg-top"
              style={{ backgroundImage: `url(${colour.image})` }}
            />
            <div className="min-w-0">
              <div className="text-[15px] font-bold">{p.name}</div>
              <div className="text-[13px] text-muted">
                {colour.name}{category.sizeLabel ? ` · Size ${size}` : ""}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {justAdded && (
              <Link href="/bag" className="text-sm font-bold text-brand underline">
                View bag
              </Link>
            )}
            <button
              type="button"
              aria-label={isWished ? "Remove from wishlist" : "Add to wishlist"}
              aria-pressed={isWished}
              onClick={() => wishlist.toggle(p.slug)}
              className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-full border-[1.5px] border-brand bg-white text-brand hover:bg-blush"
            >
              <HeartIcon filled={isWished} />
            </button>
            <button
              type="button"
              onClick={addToBag}
              className={`inline-flex h-[52px] min-w-[240px] items-center justify-center gap-2.5 rounded-full px-7 text-base font-bold text-white transition-colors ${
                justAdded ? "bg-plum" : "bg-brand hover:bg-brand-dark"
              }`}
            >
              <BagIcon className="h-5 w-5" />
              <span aria-live="polite">{justAdded ? "Added to bag" : "Add to bag"}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
