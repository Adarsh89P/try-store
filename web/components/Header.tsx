"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { BagIcon, HeartIcon, SearchIcon, UserIcon } from "./Icons";
import { useAccount } from "@/lib/account";
import { useCart } from "@/lib/cart";
import { CATEGORIES } from "@/lib/products";
import { useWishlist } from "@/lib/wishlist";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, count } = useCart();
  const wishlist = useWishlist();
  const { user } = useAccount();
  const [query, setQuery] = useState("");

  const search = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-[1360px] flex-wrap items-center gap-x-10 gap-y-3 px-5 py-3.5 sm:px-10">
        <Link href="/" className="font-display text-[26px] font-semibold text-brand">
          [YOUR STORE]
        </Link>

        <nav aria-label="Categories" className="flex flex-1 flex-wrap gap-x-7 gap-y-2">
          {CATEGORIES.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 items-center border-b-[3px] text-[15px] hover:text-brand ${
                  active ? "border-brand font-bold text-brand" : "border-transparent font-semibold"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <form role="search" onSubmit={search} className="relative min-w-[200px] flex-[0_1_300px]">
          <SearchIcon className="pointer-events-none absolute left-4 top-3 h-[18px] w-[18px] text-muted" />
          <input
            type="search"
            aria-label="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sarees, dresses, earrings"
            className="h-11 w-full rounded-full border border-transparent bg-blush pl-11 pr-4 text-sm text-plum placeholder:text-muted focus:border-brand"
          />
        </form>

        <div className="flex gap-1">
          <Link
            href="/wishlist"
            aria-label={wishlist.ready && wishlist.count > 0 ? `Wishlist, ${wishlist.count} items` : "Wishlist"}
            className={`relative inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-blush ${
              pathname === "/wishlist" ? "bg-blush text-brand" : ""
            }`}
          >
            <HeartIcon />
            {wishlist.ready && wishlist.count > 0 && (
              <span
                data-testid="wishlist-count"
                className="absolute right-0 top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold text-white"
              >
                {wishlist.count}
              </span>
            )}
          </Link>
          <Link
            href="/account"
            aria-label={user ? `Account, ${user.name}` : "Sign in"}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-blush ${
              pathname.startsWith("/account") ? "bg-blush text-brand" : ""
            }`}
          >
            <UserIcon />
          </Link>
          <Link
            href="/bag"
            aria-label={ready && count > 0 ? `Bag, ${count} items` : "Bag"}
            className={`relative inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-blush ${
              pathname === "/bag" ? "bg-blush text-brand" : ""
            }`}
          >
            <BagIcon />
            {ready && count > 0 && (
              <span
                data-testid="bag-count"
                className="absolute right-0 top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold text-white"
              >
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
