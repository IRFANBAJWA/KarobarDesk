/**
 * Wrapper around fetch that:
 *  - sends cookies (credentials: 'include')
 *  - sends the X-XSRF-TOKEN header on unsafe methods so Laravel/Sanctum accepts the request
 *  - normalizes JSON error shape
 */

function readCookie(name: string): string | null {
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.split('=').slice(1).join('='));
}

async function ensureCsrfCookie(): Promise<void> {
  // Laravel sets XSRF-TOKEN via this endpoint. Calling it once per session is enough;
  // after that the cookie persists until it expires.
  if (readCookie('XSRF-TOKEN')) return;
  await fetch('/sanctum/csrf-cookie', {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
}

export interface ApiFetchOptions extends RequestInit {
  /** If true, skips the automatic /sanctum/csrf-cookie prefetch */
  skipCsrf?: boolean;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const needsCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  if (needsCsrf && !options.skipCsrf) {
    await ensureCsrfCookie();
  }

  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (needsCsrf) {
    const token = readCookie('XSRF-TOKEN');
    if (token) headers.set('X-XSRF-TOKEN', token);
  }

  const res = await fetch(path, {
    ...options,
    method,
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    let body: any = null;
    try {
      body = await res.json();
    } catch {
      // non-JSON error
    }

    const message =
      body?.message ||
      (body?.errors && Object.values(body.errors).flat()[0]) ||
      `Request failed (${res.status})`;

    const err: any = new Error(message as string);
    err.status = res.status;
    err.errors = body?.errors;
    throw err;
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}