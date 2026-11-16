const BASE: string = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') ?? '';
const TOKEN_KEY = 'tk_token';

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
export const setToken = (t: string | null): void => {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
};

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
  /** שגיאות לפי שדה (מ-VALIDATION_ERROR) */
  fieldErrors(): Record<string, string> {
    const out: Record<string, string> = {};
    if (Array.isArray(this.details)) {
      for (const d of this.details as { field?: string; message?: string }[]) {
        if (d.field) out[d.field] = d.message ?? '';
      }
    }
    return out;
  }
}

interface Opts {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  form?: FormData;
  auth?: boolean;
}

export const apiUrl = (path: string): string => `${BASE}${path}`;

export async function api<T>(path: string, opts: Opts = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (opts.auth && token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(apiUrl(path), {
      method: opts.method ?? (opts.body !== undefined || opts.form ? 'POST' : 'GET'),
      headers,
      body: opts.form ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Network error');
  }

  if (res.status === 204) return undefined as T;
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (data as { error?: { code?: string; message?: string; details?: unknown } } | null)?.error;
    if (res.status === 401 && opts.auth) window.dispatchEvent(new Event('tk:unauthorized'));
    throw new ApiError(res.status, err?.code ?? 'ERROR', err?.message ?? res.statusText, err?.details);
  }
  return data as T;
}

export const qs = (params: Record<string, string | number | boolean | undefined | null>): string => {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  const s = sp.toString();
  return s ? `?${s}` : '';
};
