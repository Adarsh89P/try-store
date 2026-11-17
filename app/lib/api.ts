import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Backend client. Set EXPO_PUBLIC_API_URL (for example http://192.168.1.5:4000 — a phone cannot reach "localhost")
 * to use the API. When it is empty the app keeps working on this phone only.
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");
export const apiEnabled = API_URL !== "";

const TOKEN_KEY = "saree-app:token:v1";
let token: string | null = null;
export const loadToken = async () => { try { token = await AsyncStorage.getItem(TOKEN_KEY); } catch { token = null; } return token; };
export const hasToken = () => token !== null;
export const setToken = async (t: string | null) => {
  token = t;
  try { t ? await AsyncStorage.setItem(TOKEN_KEY, t) : await AsyncStorage.removeItem(TOKEN_KEY); } catch { /* storage unavailable */ }
};

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

export async function api<T>(path: string, init: { method?: string; body?: unknown; form?: FormData; headers?: Record<string, string> } = {}): Promise<T> {
  const headers: Record<string, string> = { ...init.headers };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: init.method ?? (init.body !== undefined || init.form ? "POST" : "GET"),
      headers,
      body: init.form ?? (init.body !== undefined ? JSON.stringify(init.body) : undefined),
    });
  } catch {
    throw new ApiError(0, "NETWORK", "Could not reach the store server. Check your connection and try again.");
  }
  if (res.status === 204) return undefined as T;
  const json = (await res.json().catch(() => null)) as { error?: { code: string; message: string } } | null;
  if (!res.ok) throw new ApiError(res.status, json?.error?.code ?? "ERROR", json?.error?.message ?? "Something went wrong");
  return json as T;
}
