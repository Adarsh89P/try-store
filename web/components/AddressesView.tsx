"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import AccountShell from "./AccountShell";
import { useAccount } from "@/lib/account";

const FIELDS = [
  { key: "name", label: "Full name", error: "Enter the full name", valid: (v: string) => v.trim().length > 1 },
  { key: "phone", label: "Mobile number", error: "Enter a 10-digit mobile number", valid: (v: string) => /^\d{10}$/.test(v.trim()) },
  { key: "addr", label: "House number and street", error: "Enter the house number and street", valid: (v: string) => v.trim().length > 4 },
  { key: "city", label: "City", error: "Enter the city", valid: (v: string) => v.trim().length > 1 },
  { key: "state", label: "State", error: "Enter the state", valid: (v: string) => v.trim().length > 1 },
  { key: "pin", label: "Pincode", error: "Enter a 6-digit pincode", valid: (v: string) => /^\d{6}$/.test(v.trim()) },
] as const;
type K = (typeof FIELDS)[number]["key"];
const BLANK: Record<K, string> = { name: "", phone: "", addr: "", city: "", state: "", pin: "" };

export default function AddressesView() {
  const { ready, addresses, saveAddress, removeAddress } = useAccount();
  const [v, setV] = useState(BLANK);
  const [tried, setTried] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (FIELDS.some((f) => !f.valid(v[f.key]))) return;
    saveAddress({ name: v.name.trim(), phone: v.phone.trim(), addr: v.addr.trim(), city: v.city.trim(), state: v.state.trim(), pin: v.pin.trim() });
    setV(BLANK);
    setTried(false);
  };

  return (
    <AccountShell title="Saved addresses">
      <div className="flex flex-wrap items-start gap-8">
        <section aria-label="Saved addresses" className="min-w-0 flex-[1_1_360px]">
          {!ready ? (
            <p className="text-muted">Loading…</p>
          ) : addresses.length === 0 ? (
            <p className="rounded-3xl border border-line bg-white p-6 text-[#4a3340]">No saved addresses yet. Add one with the form.</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-4 p-0">
              {addresses.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-4 rounded-3xl border border-line bg-white p-5">
                  <div className="text-sm leading-relaxed">
                    <div className="font-bold">{a.name} · {a.phone}</div>
                    <div className="text-[#4a3340]">{a.addr}, {a.city}, {a.state}, {a.pin}</div>
                  </div>
                  <button type="button" onClick={() => removeAddress(a.id)} aria-label={`Remove address ${a.addr}`} className="min-h-11 px-2 text-sm font-bold text-danger">
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <form onSubmit={submit} noValidate aria-label="Add an address" className="flex min-w-0 max-w-[480px] flex-[1_1_340px] flex-col gap-4 rounded-3xl border border-line bg-white p-7">
          <h2 className="m-0 font-display text-2xl font-medium">Add an address</h2>
          {FIELDS.map((f) => {
            const bad = tried && !f.valid(v[f.key]);
            return (
              <div key={f.key}>
                <label htmlFor={`ad-${f.key}`} className="mb-2 block text-sm font-semibold">{f.label}</label>
                <input
                  id={`ad-${f.key}`}
                  value={v[f.key]}
                  onChange={(e) => setV((p) => ({ ...p, [f.key]: e.target.value }))}
                  aria-invalid={bad}
                  className={`h-12 w-full rounded-[14px] border-[1.5px] bg-white px-4 text-[15px] focus:border-brand ${bad ? "border-danger" : "border-edge"}`}
                />
                {bad && <div role="alert" className="mt-1.5 text-[13px] font-semibold text-danger">{f.error}</div>}
              </div>
            );
          })}
          <button type="submit" className="mt-1 min-h-14 rounded-full bg-brand text-base font-bold text-white hover:bg-brand-dark">Save address</button>
        </form>
      </div>
    </AccountShell>
  );
}
