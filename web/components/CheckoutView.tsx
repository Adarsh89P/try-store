"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import { CheckIcon, ChevronLeft } from "./Icons";
import { useAccount } from "@/lib/account";
import { apiEnabled } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { sizeText } from "@/lib/products";
import { formatPrice } from "@/lib/format";

type FieldKey = "name" | "phone" | "addr" | "city" | "state" | "pin";

type FieldDef = {
  key: FieldKey;
  label: string;
  type: "text" | "tel";
  placeholder: string;
  autoComplete: string;
  error: string;
  full?: boolean;
  valid: (v: string) => boolean;
};

// Mobile and pincode follow the Indian formats (10 and 6 digits).
const FIELDS: FieldDef[] = [
  { key: "name", label: "Full name", type: "text", placeholder: "As on your ID", autoComplete: "name", error: "Enter your full name", valid: (v) => v.trim().length > 1 },
  { key: "phone", label: "Mobile number", type: "tel", placeholder: "10-digit number", autoComplete: "tel", error: "Enter a 10-digit mobile number", valid: (v) => /^\d{10}$/.test(v.trim()) },
  { key: "addr", label: "House number and street", type: "text", placeholder: "Flat, building, street", autoComplete: "street-address", error: "Enter your house number and street", full: true, valid: (v) => v.trim().length > 4 },
  { key: "city", label: "City", type: "text", placeholder: "", autoComplete: "address-level2", error: "Enter your city", valid: (v) => v.trim().length > 1 },
  { key: "state", label: "State", type: "text", placeholder: "", autoComplete: "address-level1", error: "Enter your state", valid: (v) => v.trim().length > 1 },
  { key: "pin", label: "Pincode", type: "text", placeholder: "6-digit pincode", autoComplete: "postal-code", error: "Enter a 6-digit pincode", valid: (v) => /^\d{6}$/.test(v.trim()) },
];

// TODO: connect a real payment gateway. These three options are assumptions.
const PAYMENTS = [
  { id: "upi", title: "UPI", sub: "Pay with any UPI app" },
  { id: "card", title: "Credit or debit card", sub: "Visa, Mastercard, RuPay" },
  { id: "cod", title: "Cash on delivery", sub: "Pay when your order arrives" },
] as const;

type Order = { id: string; name: string; phone: string; address: string; payment: string };

const card = "rounded-3xl border border-line bg-white p-7";

export default function CheckoutView() {
  const { ready, items, clear } = useCart();
  const account = useAccount();
  const [saveIt, setSaveIt] = useState(true);
  const [values, setValues] = useState<Record<FieldKey, string>>({ name: "", phone: "", addr: "", city: "", state: "", pin: "" });
  const [tried, setTried] = useState(false);
  const [pay, setPay] = useState<(typeof PAYMENTS)[number]["id"]>("upi");
  const [order, setOrder] = useState<Order | null>(null);

  const invalid = (f: FieldDef) => tried && !f.valid(values[f.key]);
  const anyInvalid = FIELDS.some((f) => !f.valid(values[f.key]));

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const needEmail = apiEnabled && !account.user;
  const emailBad = needEmail && !/^\S+@\S+\.\S+$/.test(email.trim());

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    setError("");
    if (anyInvalid || emailBad || items.length === 0 || busy) return;
    const v = (k: FieldKey) => values[k].trim();
    const address = { name: v("name"), phone: v("phone"), addr: v("addr"), city: v("city"), state: v("state"), pin: v("pin") };
    const paymentLabel = PAYMENTS.find((p) => p.id === pay)?.title ?? "";
    setBusy(true);
    const result = await account.placeOrder({
      items: items.map((it) => ({
        slug: it.product.slug,
        colour: it.colour,
        size: it.size,
        qty: it.qty,
        name: it.product.name,
        image: (it.product.colours.find((c) => c.name === it.colour) ?? it.product.colours[0]).image,
      })),
      address,
      email: needEmail ? email.trim() : undefined,
      method: pay === "cod" ? "cod" : "online",
      paymentLabel,
    });
    setBusy(false);
    if (result.error !== undefined) {
      setError(result.error);
      return;
    }
    setOrder({ id: result.id, name: address.name, phone: address.phone, address: [address.addr, address.city, address.state, address.pin].join(", "), payment: paymentLabel });
    if (account.user && saveIt) account.saveAddress(address);
    clear();
  };

  if (order) {
    return (
      <main className="mx-auto w-full max-w-[1360px] flex-1 px-5 pb-14 pt-8 sm:px-10">
        <div className="mx-auto mt-6 flex max-w-[640px] flex-col items-center gap-4 rounded-3xl border border-line bg-white px-8 py-12 text-center">
          <div aria-hidden="true" className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-brand text-white">
            <CheckIcon width={36} height={36} />
          </div>
          <h1 className="m-0 font-display text-4xl font-medium">Order placed</h1>
          <p className="m-0 text-base leading-relaxed text-[#4a3340]">
            Thank you, {order.name.split(/\s+/)[0]}. Your sarees are on the way to the address below.
          </p>
          <div className="mt-2 w-full rounded-2xl bg-ground p-5 text-left text-sm leading-[1.7]">
            <div className="font-bold">Order number: {order.id}</div>
            <div className="text-[#4a3340]">
              {order.name}, {order.phone}
            </div>
            <div className="text-[#4a3340]">{order.address}</div>
            <div className="text-[#4a3340]">Payment: {order.payment}</div>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Link href="/sarees" className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-brand px-7 text-[15px] font-bold text-white hover:bg-brand-dark">
              Continue shopping
            </Link>
            <Link href="/account/orders" className="inline-flex min-h-[52px] items-center justify-center rounded-full border-[1.5px] border-brand px-7 text-[15px] font-bold text-brand hover:bg-blush">
              View my orders
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-3.5 sm:px-10">
          <Link href="/" className="font-display text-[26px] font-semibold text-brand">[YOUR STORE]</Link>
          <span className="text-[15px] font-bold">Secure checkout</span>
          <Link href="/bag" className="inline-flex min-h-11 items-center gap-1.5 text-[15px] font-semibold hover:text-brand">
            <ChevronLeft className="h-[18px] w-[18px]" />
            Back to bag
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1360px] flex-1 px-5 pb-14 pt-8 sm:px-10">
        <h1 className="mb-7 mt-0 font-display text-[40px] font-medium">Checkout</h1>

        {ready && items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-line bg-white px-6 py-16 text-center">
            <h2 className="m-0 font-display text-[28px] font-medium">Your bag is empty</h2>
            <Link href="/sarees" className="inline-flex min-h-14 items-center justify-center rounded-full bg-brand px-8 text-base font-bold text-white hover:bg-brand-dark">
              Browse sarees
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="flex flex-wrap items-start gap-8">
            <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-6">
              <section aria-labelledby="addr-h" className={card}>
                <h2 id="addr-h" className="mb-5 mt-0 font-display text-2xl font-medium">Delivery address</h2>
                {account.addresses.length > 0 && (
                  <div className="mb-5">
                    <label htmlFor="saved-addr" className="mb-2 block text-sm font-semibold">Use a saved address</label>
                    <select
                      id="saved-addr"
                      defaultValue=""
                      onChange={(e) => {
                        const a = account.addresses.find((x) => x.id === e.target.value);
                        if (a) setValues({ name: a.name, phone: a.phone, addr: a.addr, city: a.city, state: a.state, pin: a.pin });
                      }}
                      className="h-12 w-full rounded-[14px] border-[1.5px] border-edge bg-white px-4 text-[15px] focus:border-brand"
                    >
                      <option value="">Choose…</option>
                      {account.addresses.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}, {a.addr}, {a.city} {a.pin}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-[18px]">
                  {FIELDS.map((f) => {
                    const bad = invalid(f);
                    return (
                      <div key={f.key} className={f.full ? "col-span-full" : ""}>
                        <label htmlFor={`f-${f.key}`} className="mb-2 block text-sm font-semibold">{f.label}</label>
                        <input
                          id={`f-${f.key}`}
                          name={f.key}
                          type={f.type}
                          value={values[f.key]}
                          onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                          placeholder={f.placeholder}
                          autoComplete={f.autoComplete}
                          aria-invalid={bad}
                          aria-describedby={bad ? `e-${f.key}` : undefined}
                          className={`h-12 w-full rounded-[14px] border-[1.5px] bg-white px-4 text-[15px] focus:border-brand ${bad ? "border-danger" : "border-edge"}`}
                        />
                        {bad && (
                          <div id={`e-${f.key}`} role="alert" className="mt-1.5 text-[13px] font-semibold text-danger">
                            {f.error}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {account.user && (
                  <label className="mt-5 flex min-h-11 items-center gap-3 text-sm font-semibold">
                    <input type="checkbox" checked={saveIt} onChange={(e) => setSaveIt(e.target.checked)} className="h-5 w-5 accent-brand" />
                    Save this address to my account
                  </label>
                )}
              </section>

              <section aria-labelledby="pay-h" className={card}>
                <h2 id="pay-h" className="mb-5 mt-0 font-display text-2xl font-medium">Payment</h2>
                <div role="radiogroup" aria-labelledby="pay-h" className="flex flex-col gap-3">
                  {PAYMENTS.map((o) => (
                    <label
                      key={o.id}
                      className={`flex min-h-16 cursor-pointer items-center gap-3.5 rounded-2xl border-[1.5px] px-[18px] py-3 ${
                        pay === o.id ? "border-brand bg-blush" : "border-edge bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="pay"
                        value={o.id}
                        checked={pay === o.id}
                        onChange={() => setPay(o.id)}
                        className="m-0 h-[22px] w-[22px] accent-brand"
                      />
                      <span>
                        <span className="block text-[15px] font-bold">{o.title}</span>
                        <span className="mt-0.5 block text-[13px] text-muted">{o.sub}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </section>
            </div>

            <aside aria-label="Order summary" className="flex min-w-0 max-w-[440px] flex-[1_1_340px] flex-col gap-[18px] rounded-3xl border border-line bg-white p-7">
              <h2 className="m-0 font-display text-2xl font-medium">Order summary</h2>
              <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
                {items.map((it) => {
                  const colour = it.product.colours.find((c) => c.name === it.colour) ?? it.product.colours[0];
                  return (
                    <li key={it.key} className="flex items-center gap-3.5">
                      <div className="h-[72px] w-14 shrink-0 overflow-hidden rounded-[10px] border border-line bg-white">
                        <img src={colour.image} alt="" className="block h-full w-full object-cover object-top" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold">{it.product.name}</div>
                        <div className="mt-0.5 text-[13px] text-muted">
                          {[it.colour, sizeText(it.product, it.size), `Qty ${it.qty}`].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <div className="text-sm font-bold text-brand">{formatPrice(it.product.price)}</div>
                    </li>
                  );
                })}
              </ul>
              {/* TODO: subtotal, delivery and total need real prices and delivery rules. */}
              <div className="flex justify-between gap-3 border-t border-line pt-[18px] text-[15px]">
                <span className="text-muted">Subtotal</span>
                <span className="font-semibold">₹[SUBTOTAL]</span>
              </div>
              <div className="flex justify-between gap-3 text-[15px]">
                <span className="text-muted">Delivery</span>
                <span className="font-semibold">₹[DELIVERY CHARGE]</span>
              </div>
              <div className="flex justify-between gap-3 border-t border-line pt-[18px] text-lg font-bold">
                <span>Total</span>
                <span className="text-brand">₹[TOTAL]</span>
              </div>
              {tried && anyInvalid && (
                <div role="alert" className="rounded-xl bg-[#fdecef] px-3.5 py-3 text-sm font-semibold text-[#8c0f2f]">
                  Please fix the fields marked above.
                </div>
              )}
              {needEmail && (
                <div>
                  <label htmlFor="co-email" className="mb-2 block text-sm font-semibold">Email for your order updates</label>
                  <input id="co-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="h-12 w-full rounded-[14px] border-[1.5px] border-edge bg-white px-4 text-[15px] focus:border-brand" />
                  {tried && emailBad && <div role="alert" className="mt-1.5 text-[13px] font-semibold text-danger">Enter a valid email address</div>}
                </div>
              )}
              {error && <div role="alert" className="text-[13px] font-semibold text-danger">{error}</div>}
              <button
                type="submit"
                disabled={busy}
                className="min-h-14 rounded-full bg-brand text-base font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
              >
                {busy ? "Placing your order…" : "Place order"}
              </button>
            </aside>
          </form>
        )}
      </main>
    </>
  );
}
