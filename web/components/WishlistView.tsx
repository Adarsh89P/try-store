"use client";

import Link from "next/link";
import Footer from "./Footer";
import Header from "./Header";
import ProductCard from "./ProductCard";
import { useWishlist } from "@/lib/wishlist";

export default function WishlistView() {
  const { ready, items } = useWishlist();
  return (
    <>
      <Header />
      <main className="page-enter mx-auto w-full max-w-[1360px] flex-1 px-5 pb-14 pt-8 sm:px-10">
        <h1 className="mb-7 mt-0 font-display text-[40px] font-medium">Your wishlist</h1>
        {!ready ? (
          <p className="text-muted">Loading your wishlist…</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-line bg-white px-6 py-16 text-center">
            <h2 className="m-0 font-display text-[28px] font-medium">Nothing saved yet</h2>
            <p className="m-0 max-w-[420px] text-[#4a3340]">Tap the heart on any product to keep it here for later.</p>
            <Link href="/sarees" className="inline-flex min-h-14 items-center justify-center rounded-full bg-brand px-8 text-base font-bold text-white hover:bg-brand-dark">
              Browse sarees
            </Link>
          </div>
        ) : (
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(220px,100%),1fr))] gap-6 p-0">
            {items.map((p) => (
              <li key={p.slug}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </>
  );
}
