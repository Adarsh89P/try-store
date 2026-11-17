"use client";

import Link from "next/link";
import AccountShell from "./AccountShell";
import { useAccount } from "@/lib/account";

export default function OrdersView() {
  const { ready, orders } = useAccount();
  return (
    <AccountShell title="Your orders">
      {!ready ? (
        <p className="text-muted">Loading…</p>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-line bg-white px-6 py-16 text-center">
          <h2 className="m-0 font-display text-[28px] font-medium">No orders yet</h2>
          <Link href="/sarees" className="inline-flex min-h-14 items-center justify-center rounded-full bg-brand px-8 text-base font-bold text-white hover:bg-brand-dark">
            Browse sarees
          </Link>
        </div>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-5 p-0">
          {orders.map((o) => (
            <li key={o.id} className="rounded-3xl border border-line bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-bold">Order {o.id}</div>
                  <div className="text-sm text-muted">{new Date(o.placedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                </div>
                <span className="rounded-full bg-blush px-3.5 py-1.5 text-[13px] font-bold text-brand-dark">{o.status}</span>
              </div>
              <ul className="m-0 mt-4 flex list-none flex-col gap-3 p-0">
                {o.items.map((it, i) => (
                  <li key={i} className="flex items-center gap-3.5">
                    <img src={it.image} alt="" className="h-[72px] w-14 rounded-[10px] border border-line object-cover object-top" />
                    <div className="text-sm">
                      <div className="font-bold">{it.name}</div>
                      <div className="text-muted">{it.colour} · {it.size} · Qty {it.qty}</div>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mb-0 mt-4 text-sm text-[#4a3340]">Deliver to {o.name}, {o.address} · {o.payment}</p>
            </li>
          ))}
        </ul>
      )}
    </AccountShell>
  );
}
