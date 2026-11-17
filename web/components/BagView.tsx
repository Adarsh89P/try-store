"use client";

import { sizeText } from "@/lib/products";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatPrice, sumPrices } from "@/lib/format";

export default function BagView() {
  const { ready, items, count, setQty, remove } = useCart();
  const label = `(${count} ${count === 1 ? "item" : "items"})`;
  const subtotal = sumPrices(items.map((i) => (i.product.price === null ? null : i.product.price * i.qty)));

  return (
    <main className="mx-auto w-full max-w-[1360px] flex-1 px-5 pb-14 pt-8 sm:px-10">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/" className="hover:text-brand">Home</Link> / <strong className="text-plum">Bag</strong>
      </nav>
      <h1 className="mb-7 mt-3 font-display text-[40px] font-medium">
        Your bag{" "}
        {ready && count > 0 && (
          <span className="font-sans text-base font-medium text-muted">{label}</span>
        )}
      </h1>

      {!ready && <p className="text-muted">Loading your bag…</p>}

      {ready && items.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-line bg-white px-6 py-16 text-center">
          <h2 className="m-0 font-display text-[28px] font-medium">Your bag is empty</h2>
          <p className="m-0 text-base text-muted">Pick a saree and it will wait for you here.</p>
          <Link
            href="/sarees"
            className="inline-flex min-h-14 items-center justify-center rounded-full bg-brand px-8 text-base font-bold text-white hover:bg-brand-dark"
          >
            Browse sarees
          </Link>
        </div>
      )}

      {ready && items.length > 0 && (
        <div className="flex flex-wrap items-start gap-8">
          <ul className="m-0 flex min-w-0 flex-[999_1_520px] list-none flex-col gap-4 p-0">
            {items.map((it) => {
              const colour = it.product.colours.find((c) => c.name === it.colour) ?? it.product.colours[0];
              return (
                <li key={it.key} className="flex flex-wrap gap-5 rounded-[20px] border border-line bg-white p-5">
                  <Link
                    href="/sarees"
                    className="block h-[156px] w-[120px] shrink-0 overflow-hidden rounded-xl border border-line bg-white"
                  >
                    <img
                      src={colour.image}
                      alt={`${it.product.name}, worn by a model`}
                      className="block h-full w-full object-cover object-top"
                    />
                  </Link>
                  <div className="flex min-w-0 flex-[1_1_260px] flex-col justify-between gap-4">
                    <div className="flex flex-wrap justify-between gap-x-4 gap-y-2">
                      <div>
                        <div className="font-display text-[22px] font-medium">{it.product.name}</div>
                        <div className="mt-1.5 text-sm text-muted">
                          {[it.colour, sizeText(it.product, it.size)].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <div className="text-lg font-bold text-brand">{formatPrice(it.product.price)}</div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="inline-flex items-center rounded-full border-[1.5px] border-edge bg-white">
                        <button
                          type="button"
                          onClick={() => setQty(it.key, it.qty - 1)}
                          disabled={it.qty <= 1}
                          aria-label={`Decrease quantity of ${it.product.name}`}
                          className="h-11 w-11 rounded-full text-xl disabled:cursor-not-allowed disabled:text-[#7a6270]"
                        >
                          −
                        </button>
                        <span aria-live="polite" data-testid="qty" className="min-w-8 text-center text-base font-bold">
                          {it.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQty(it.key, it.qty + 1)}
                          aria-label={`Increase quantity of ${it.product.name}`}
                          className="h-11 w-11 rounded-full text-xl"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(it.key)}
                        aria-label={`Remove ${it.product.name} from bag`}
                        className="min-h-11 px-2 text-sm font-semibold text-muted underline hover:text-brand"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <aside
            aria-label="Order summary"
            className="flex min-w-0 max-w-[440px] flex-[1_1_340px] flex-col gap-[18px] rounded-3xl border border-line bg-white p-7"
          >
            <h2 className="m-0 font-display text-2xl font-medium">Order summary</h2>
            <div className="flex justify-between gap-3 text-[15px]">
              <span className="text-muted">Items {label}</span>
              <span className="font-semibold">{subtotal === null ? "₹[SUBTOTAL]" : formatPrice(subtotal)}</span>
            </div>
            {/* TODO: delivery charge and total need your delivery rules. */}
            <div className="flex justify-between gap-3 text-[15px]">
              <span className="text-muted">Delivery</span>
              <span className="font-semibold">₹[DELIVERY CHARGE]</span>
            </div>
            <div className="flex justify-between gap-3 border-t border-line pt-[18px] text-lg font-bold">
              <span>Total</span>
              <span className="text-brand">₹[TOTAL]</span>
            </div>
            <Link
              href="/tryon"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-plum text-base font-bold text-white transition-colors hover:bg-black"
            >
              <span aria-hidden="true">✦</span> Try on with AI
            </Link>
            <Link
              href="/checkout"
              className="inline-flex min-h-14 items-center justify-center rounded-full bg-brand text-base font-bold text-white transition-colors hover:bg-brand-dark"
            >
              Proceed to checkout
            </Link>
            <Link
              href="/sarees"
              className="inline-flex min-h-[52px] items-center justify-center rounded-full border-[1.5px] border-brand text-[15px] font-bold text-brand hover:bg-blush"
            >
              Continue shopping
            </Link>
          </aside>
        </div>
      )}
    </main>
  );
}
