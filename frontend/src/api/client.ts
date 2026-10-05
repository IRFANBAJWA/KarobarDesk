import axios, { AxiosError } from 'axios';
import type { ApiErrorBody } from '@/types/auth';

/** Main API client. Talks to Laravel via Vite proxy in dev. */
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

/** Separate instance for /sanctum/csrf-cookie (outside /api). */
export const sanctum = axios.create({
  baseURL: '/',
  withCredentials: true,
  headers: { Accept: 'application/json' },
});

/** Read a cookie value by name. */
function readCookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp('(^|;\\s*)' + name + '=([^;]*)'),
  );
  return match ? decodeURIComponent(match[2]) : null;
}

/** Attach X-XSRF-TOKEN header on every request. */
api.interceptors.request.use((config) => {
  const token = readCookie('XSRF-TOKEN');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers['X-XSRF-TOKEN'] = token;
  }
  return config;
});

/** Global 401 handler. */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    const status = error.response?.status;
    const url = error.config?.url ?? '';

    if (
      status === 401 &&
      !url.includes('/me') &&
      !url.includes('/login')
    ) {
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    return Promise.reject(error);
  },
);

/** Fetch Sanctum CSRF cookie before POST /api/login. */
export async function getCsrfCookie(): Promise<void> {
  await sanctum.get('/sanctum/csrf-cookie');
}

/** Extract a human-readable message from an Axios error. */
export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const body = error.response?.data;
    if (body?.errors) {
      const first = Object.values(body.errors)[0];
      if (first && first.length > 0) return first[0];
    }
    if (body?.message) return body.message;

    if (error.response?.status === 403) return 'Account is disabled.';
    if (error.response?.status === 401) return 'Invalid credentials.';
    if (!error.response) return 'Cannot reach server. Is Laravel running?';
  }
  return 'Something went wrong. Please try again.';
}