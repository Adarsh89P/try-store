"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { api, apiEnabled, ApiError, getToken, setToken } from "./api";
import { payWithRazorpay } from "./razorpay-client";

// With NEXT_PUBLIC_API_URL set, account, addresses and orders live on the server.
// Without it they stay in this browser (localStorage) so the site still works on its own.
const KEY = "saree-store:account:v1";

export type User = { name: string; email: string };
export type Address = { id: string; name: string; phone: string; addr: string; city: string; state: string; pin: string };
export type OrderItem = { name: string; colour: string; size: string; qty: number; image: string };
export type Order = {
  id: string;
  placedAt: string;
  items: OrderItem[];
  name: string;
  phone: string;
  address: string;
  payment: string;
  status: string;
};

type State = { user: User | null; addresses: Address[]; orders: Order[] };
const EMPTY: State = { user: null, addresses: [], orders: [] };

export type OrderInput = {
  items: { slug: string; colour: string; size: string; qty: number; name: string; image: string }[];
  address: Omit<Address, "id">;
  email?: string;
  method: "cod" | "online";
  paymentLabel: string;
};

type AccountValue = State & {
  ready: boolean;
  /** Return an error message, or "" on success. */
  login: (email: string, password: string) => Promise<string>;
  register: (name: string, email: string, password: string) => Promise<string>;
  signOut: () => void;
  saveAddress: (a: Omit<Address, "id">) => void;
  removeAddress: (id: string) => void;
  /** Places the order (and takes payment when online). Returns the order id, or an error message. */
  placeOrder: (o: OrderInput) => Promise<{ id: string; error?: undefined } | { id?: undefined; error: string }>;
};

const AccountContext = createContext<AccountValue | null>(null);

type ApiAddress = { _id: string; name: string; phone: string; line1: string; line2?: string; city: string; state: string; pincode: string };
type ApiOrder = {
  orderId: string; createdAt: string; status: string;
  items: { name: string; colour: string; size: string; qty: number; image: string }[];
  address: { name: string; phone: string; line1: string; city: string; state: string; pincode: string };
  payment: { method: "cod" | "online"; status: string };
};
const fromApiAddress = (a: ApiAddress): Address => ({ id: a._id, name: a.name, phone: a.phone, addr: a.line1, city: a.city, state: a.state, pin: a.pincode });
const toApiAddress = (a: Omit<Address, "id">) => ({ name: a.name, phone: a.phone, line1: a.addr, city: a.city, state: a.state, pincode: a.pin });
const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const fromApiOrder = (o: ApiOrder): Order => ({
  id: o.orderId,
  placedAt: o.createdAt,
  items: o.items,
  name: o.address.name,
  phone: o.address.phone,
  address: [o.address.line1, o.address.city, o.address.state, o.address.pincode].join(", "),
  payment: o.payment.method === "cod" ? "Cash on delivery" : o.payment.status === "paid" ? "Paid online" : "Online payment pending",
  status: label(o.status),
});

export function AccountProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(EMPTY);
  const [ready, setReady] = useState(false);

  const loadFromApi = useCallback(async () => {
    const [me, orders, addr] = await Promise.all([
      api<{ user: { name: string; email: string } }>("/api/auth/me"),
      api<{ orders: ApiOrder[] }>("/api/orders/mine"),
      api<{ addresses: ApiAddress[] }>("/api/me/addresses"),
    ]);
    setState({ user: { name: me.user.name, email: me.user.email }, orders: orders.orders.map(fromApiOrder), addresses: addr.addresses.map(fromApiAddress) });
  }, []);

  useEffect(() => {
    (async () => {
      if (apiEnabled) {
        if (getToken()) {
          try { await loadFromApi(); } catch (e) { if (e instanceof ApiError && e.status === 401) setToken(null); }
        }
      } else {
        try {
          const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "null") as Partial<State> | null;
          if (parsed && typeof parsed === "object") {
            setState({
              user: parsed.user && typeof parsed.user.email === "string" ? parsed.user : null,
              addresses: Array.isArray(parsed.addresses) ? parsed.addresses : [],
              orders: Array.isArray(parsed.orders) ? parsed.orders : [],
            });
          }
        } catch { /* ignore corrupt data */ }
      }
      setReady(true);
    })();
  }, [loadFromApi]);

  useEffect(() => {
    if (!ready || apiEnabled) return;
    try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
  }, [state, ready]);

  const authenticate = useCallback(async (path: string, body: object): Promise<string> => {
    try {
      const r = await api<{ token: string }>(path, { body });
      setToken(r.token);
      await loadFromApi();
      return "";
    } catch (e) {
      return e instanceof Error ? e.message : "Something went wrong";
    }
  }, [loadFromApi]);

  const login = useCallback(async (email: string, password: string) => {
    if (apiEnabled) return authenticate("/api/auth/login", { email, password });
    // No server: sign in locally. The password is never stored.
    setState((s) => ({ ...s, user: { name: email.split("@")[0]!, email } }));
    return "";
  }, [authenticate]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    if (apiEnabled) return authenticate("/api/auth/register", { name, email, password });
    setState((s) => ({ ...s, user: { name, email } }));
    return "";
  }, [authenticate]);

  const signOut = useCallback(() => {
    setToken(null);
    setState((s) => (apiEnabled ? EMPTY : { ...s, user: null }));
  }, []);

  const saveAddress = useCallback((a: Omit<Address, "id">) => {
    if (apiEnabled) {
      void api<{ addresses: ApiAddress[] }>("/api/me/addresses", { body: toApiAddress(a) })
        .then((r) => setState((s) => ({ ...s, addresses: r.addresses.map(fromApiAddress) })))
        .catch(() => { /* saving an address is optional; the order itself is already placed */ });
      return;
    }
    setState((s) => {
      const dup = s.addresses.some((x) => x.addr === a.addr && x.pin === a.pin && x.name === a.name);
      return dup ? s : { ...s, addresses: [...s.addresses, { ...a, id: `a-${Date.now().toString(36)}` }] };
    });
  }, []);

  const removeAddress = useCallback((id: string) => {
    setState((s) => ({ ...s, addresses: s.addresses.filter((a) => a.id !== id) }));
    if (apiEnabled) void api(`/api/me/addresses/${id}`, { method: "DELETE" }).catch(() => undefined);
  }, []);

  const placeOrder = useCallback<AccountValue["placeOrder"]>(async (o) => {
    if (!apiEnabled) {
      const id = `SS-${Date.now().toString(36).toUpperCase()}`;
      setState((s) => ({
        ...s,
        orders: [{
          id, placedAt: new Date().toISOString(),
          items: o.items.map(({ name, colour, size, qty, image }) => ({ name, colour, size, qty, image })),
          name: o.address.name, phone: o.address.phone,
          address: [o.address.addr, o.address.city, o.address.state, o.address.pin].join(", "),
          payment: o.paymentLabel, status: "Placed",
        }, ...s.orders],
      }));
      return { id };
    }
    try {
      const email = state.user?.email ?? o.email;
      const r = await api<{
        order: { orderId: string; guestToken?: string };
        payment?: { keyId: string; razorpayOrderId: string; amountPaise: number };
      }>("/api/orders", {
        body: {
          items: o.items.map(({ slug, colour, size, qty }) => ({ slug, colour, size, qty })),
          address: toApiAddress(o.address), email, paymentMethod: o.method,
        },
      });
      if (r.payment) {
        const paid = await payWithRazorpay({ ...r.payment, name: o.address.name, email: email ?? "", phone: o.address.phone });
        await api(`/api/orders/${r.order.orderId}/verify`, {
          body: paid,
          headers: r.order.guestToken ? { "x-order-token": r.order.guestToken } : {},
        });
      }
      if (getToken()) await loadFromApi().catch(() => undefined);
      return { id: r.order.orderId };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Something went wrong" };
    }
  }, [state.user, loadFromApi]);

  const value = useMemo<AccountValue>(
    () => ({ ...state, ready, login, register, signOut, saveAddress, removeAddress, placeOrder }),
    [state, ready, login, register, signOut, saveAddress, removeAddress, placeOrder],
  );
  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount(): AccountValue {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used inside <AccountProvider>");
  return ctx;
}
