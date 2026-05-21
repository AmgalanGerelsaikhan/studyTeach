/**
 * Where the @studyteach/api server lives. In dev defaults to :4000 (matches
 * apps/api/.env API_PORT). In production this is wired by env; we never bake
 * a real URL into the bundle.
 *
 * All API calls go through `apiFetch` so that
 *   - the session cookie (HttpOnly, SameSite=Strict) travels via
 *     credentials: 'include' (CLAUDE.md constraint #8)
 *   - errors surface as typed ApiError instances callers can pattern on
 */
const DEFAULT_BASE = 'http://localhost:4000';

export function apiBase(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_BASE ?? DEFAULT_BASE;
  }
  return (window as { __ST_API_BASE__?: string }).__ST_API_BASE__ ?? DEFAULT_BASE;
}

export interface ApiErrorBody {
  statusCode?: number;
  message?: string | string[];
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: ApiErrorBody | string | null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  /** Header override map. Authorization is not used — sessions ride on cookies. */
  headers?: Record<string, string>;
}

export async function apiFetch<T>(path: string, opts: ApiFetchOptions = {}): Promise<T> {
  const init: RequestInit = {
    method: opts.method ?? 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...opts.headers,
    },
    ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
    ...(opts.signal ? { signal: opts.signal } : {}),
  };
  const res = await fetch(`${apiBase()}${path}`, init);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let parsed: ApiErrorBody | string | null = null;
    try {
      parsed = text ? (JSON.parse(text) as ApiErrorBody) : null;
    } catch {
      parsed = text || null;
    }
    const message =
      (parsed && typeof parsed === 'object' && parsed.message
        ? Array.isArray(parsed.message)
          ? parsed.message.join('; ')
          : parsed.message
        : `HTTP ${res.status}`) ?? `HTTP ${res.status}`;
    throw new ApiError(String(message), res.status, parsed);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
