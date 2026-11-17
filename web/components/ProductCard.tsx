"use client";

import Link from "next/link";
import { HeartIcon } from "./Icons";
import { formatPrice } from "@/lib/format";
import { browseHref, getCategory, type Product } from "@/lib/products";
import { useWishlist } from "@/lib/wishlist";

/** Product tile that opens the category browser on this product. Has its own wishlist heart. */
export default function ProductCard({ product: p }: { product: Product }) {
  const wishlist = useWishlist();
  const wished = wishlist.has(p.slug);
  const colour = p.colours[0];

  return (
    <div className="group relative">
      <Link href={browseHref(p)} className="block">
        <div className="aspect-[3/4] overflow-hidden rounded-[18px] border border-line bg-white">
          {/* TODO: swap to next/image once the photos are your own and sized. */}
          <img
            src={colour.image}
            alt={`${p.name}, ${colour.name}`}
            loading="lazy"
            className="block h-full w-full object-top"
            style={{ objectFit: colour.fit }}
          />
        </div>
        <div className="mt-3 text-xs font-semibold uppercase tracking-[.04em] text-muted">
          {getCategory(p.category)?.label}
        </div>
        <div className="mt-0.5 font-display text-lg font-medium group-hover:text-brand">{p.name}</div>
        <div className="mt-1 text-[15px] font-bold text-brand">{formatPrice(p.price)}</div>
      </Link>
      <button
        type="button"
        onClick={() => wishlist.toggle(p.slug)}
        aria-label={wished ? `Remove ${p.name} from wishlist` : `Add ${p.name} to wishlist`}
        aria-pressed={wished}
        className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-brand shadow-[0_4px_14px_rgba(43,18,32,.15)] hover:bg-blush"
      >
        <HeartIcon filled={wished} />
      </button>
    </div>
  );
}
