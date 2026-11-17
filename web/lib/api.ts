/**
 * Backend client. Set NEXT_PUBLIC_API_URL (for example http://localhost:4000) to use the API.
 * When it is empty the site keeps working on this browser only (cart, account and orders in localStorage).
 */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
export const apiEnabled = API_URL !== "";

const TOKEN_KEY = "saree-store:token:v1";
export const getToken = (): string | null => {
  try { return window.localStorage.getItem(TOKEN_KEY); } catch { return null; }
};
export const setToken = (t: string | null) => {
  try { t ? window.localStorage.setItem(TOKEN_KEY, t) : window.localStorage.removeItem(TOKEN_KEY); } catch { /* storage unavailable */ }
};

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

export async function api<T>(path: string, init: { method?: string; body?: unknown; form?: FormData; headers?: Record<string, string> } = {}): Promise<T> {
  const headers: Record<string, string> = { ...init.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { method: init.method ?? (init.body || init.form ? "POST" : "GET"), headers, body: init.form ?? (init.body !== undefined ? JSON.stringify(init.body) : undefined) });
  } catch {
    throw new ApiError(0, "NETWORK", "Could not reach the store server. Check your connection and try again.");
  }
  if (res.status === 204) return undefined as T;
  const json = (await res.json().catch(() => null)) as { error?: { code: string; message: string } } | null;
  if (!res.ok) throw new ApiError(res.status, json?.error?.code ?? "ERROR", json?.error?.message ?? "Something went wrong");
  return json as T;
}
