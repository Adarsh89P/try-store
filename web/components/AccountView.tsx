"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import AccountShell from "./AccountShell";
import { useAccount } from "@/lib/account";

const input = "h-12 w-full rounded-[14px] border-[1.5px] bg-white px-4 text-[15px] focus:border-brand";
const card = "rounded-3xl border border-line bg-white p-7";

export default function AccountView() {
  const { ready, user, login, register, signOut, orders, addresses } = useAccount();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tried, setTried] = useState(false);
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);

  const errors = {
    name: mode === "up" && name.trim().length < 2 ? "Enter your name" : "",
    email: /^\S+@\S+\.\S+$/.test(email.trim()) ? "" : "Enter a valid email address",
    password: password.length >= 8 ? "" : "Use at least 8 characters",
  };
  const invalid = Object.values(errors).some(Boolean);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    setServerError("");
    if (invalid) return;
    setBusy(true);
    const e1 = email.trim();
    const err = mode === "up" ? await register(name.trim(), e1, password) : await login(e1, password);
    setBusy(false);
    if (err) setServerError(err);
    else setPassword("");
  };

  if (!ready) return <AccountShell title="Your account"><p className="text-muted">Loading…</p></AccountShell>;

  if (user) {
    return (
      <AccountShell title="Your account">
        <section aria-label="Profile" className={`${card} max-w-[640px]`}>
          <h2 className="mb-1 mt-0 font-display text-2xl font-medium">Hello, {user.name}</h2>
          <p className="m-0 text-muted">{user.email}</p>
          <p className="mb-0 mt-5 text-[15px] text-[#4a3340]">
            {orders.length} {orders.length === 1 ? "order" : "orders"} · {addresses.length} saved {addresses.length === 1 ? "address" : "addresses"}
          </p>
          <button type="button" onClick={signOut} className="mt-6 inline-flex min-h-12 items-center rounded-full border-[1.5px] border-brand px-6 text-[15px] font-bold text-brand hover:bg-blush">
            Sign out
          </button>
        </section>
      </AccountShell>
    );
  }

  return (
    <AccountShell title="Your account">
      <section aria-label="Sign in or create an account" className={`${card} max-w-[480px]`}>
        <div role="tablist" aria-label="Account form" className="mb-6 flex gap-2">
          {(["in", "up"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => {
                setMode(m);
                setTried(false);
              }}
              className={`min-h-11 flex-1 rounded-full border-[1.5px] text-sm font-bold ${mode === m ? "border-brand bg-brand text-white" : "border-edge bg-white"}`}
            >
              {m === "in" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          {mode === "up" && (
            <Field id="acc-name" label="Full name" error={tried ? errors.name : ""}>
              <input id="acc-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={`${input} ${tried && errors.name ? "border-danger" : "border-edge"}`} />
            </Field>
          )}
          <Field id="acc-email" label="Email" error={tried ? errors.email : ""}>
            <input id="acc-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={`${input} ${tried && errors.email ? "border-danger" : "border-edge"}`} />
          </Field>
          <Field id="acc-password" label="Password" error={tried ? errors.password : ""}>
            <input id="acc-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "up" ? "new-password" : "current-password"} className={`${input} ${tried && errors.password ? "border-danger" : "border-edge"}`} />
          </Field>
          {serverError && <div role="alert" className="text-[13px] font-semibold text-danger">{serverError}</div>}
          <button type="submit" disabled={busy} className="mt-2 min-h-14 rounded-full bg-brand text-base font-bold text-white hover:bg-brand-dark disabled:opacity-60">
            {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
          </button>
        </form>
      </section>
    </AccountShell>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold">{label}</label>
      {children}
      {error && <div role="alert" className="mt-1.5 text-[13px] font-semibold text-danger">{error}</div>}
    </div>
  );
}
