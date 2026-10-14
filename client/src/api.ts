/**
 * Shared API configuration and resilient fetch utilities for Vehicle Rental Graph Intelligence System.
 * Connects frontend to Express backend (local development or deployed on Render).
 */

const envApiUrl = import.meta.env.VITE_API_URL;

export const DEFAULT_PROD_API_URL = 'https://vehicle-rental-management-system39.onrender.com';

/**
 * Shared API Base URL.
 * - Uses `VITE_API_URL` if defined.
 * - In production mode (e.g. Vercel deployment), falls back to the deployed Render backend URL.
 * - In development mode, falls back to empty string `''` to utilize Vite's dev server proxy to localhost:5000.
 */
export const API_BASE_URL: string = (
  envApiUrl && envApiUrl.trim() !== ''
    ? envApiUrl.trim()
    : import.meta.env.DEV
      ? ''
      : DEFAULT_PROD_API_URL
).replace(/\/+$/, '');

/**
 * Resolves a full API URL given a relative endpoint path.
 * Correctly preserves paths and query parameters.
 */
export function apiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

export interface ApiFetchResult<T = any> {
  ok: boolean;
  status: number;
  data: T;
}

/**
 * Robust fetch wrapper for backend API calls.
 * - Handles CORS & base URL routing across local dev and production on Render.
 * - Preserves methods, headers, request bodies, and query strings.
 * - Intercepts non-JSON responses (e.g. Render wake-up 502/503 HTML pages, 404s, Cloudflare pages).
 * - Formats human-friendly error messages instead of raw `SyntaxError: Unexpected token '<'`.
 */
export async function apiFetch<T = any>(
  endpoint: string,
  init?: RequestInit
): Promise<ApiFetchResult<T>> {
  const url = apiUrl(endpoint);

  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (err: any) {
    const isNetworkError =
      err?.name === 'TypeError' ||
      err?.message?.includes('Failed to fetch') ||
      err?.message?.includes('NetworkError');

    if (isNetworkError) {
      throw new Error(
        `Unable to connect to backend server at ${API_BASE_URL || window.location.origin}. ` +
        `The backend instance on Render may be sleeping or starting up (Render free tier sleeps after 15 min of inactivity). Please wait a moment and retry.`
      );
    }
    throw err;
  }

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.toLowerCase().includes('application/json');

  let rawText = '';
  try {
    rawText = await res.text();
  } catch {
    rawText = '';
  }

  let parsedData: T | null = null;
  const trimmed = rawText.trim();
  if (isJson || trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      parsedData = JSON.parse(rawText) as T;
    } catch {
      parsedData = null;
    }
  }

  // If valid JSON was returned, return standard response object
  if (parsedData !== null) {
    return {
      ok: res.ok,
      status: res.status,
      data: parsedData,
    };
  }

  // Gracefully handle non-JSON responses
  if (res.status === 502 || res.status === 503 || res.status === 504) {
    throw new Error(
      `Backend service on Render is currently waking up or temporarily unavailable (HTTP ${res.status}). Free-tier instances take ~30–60 seconds to spin up. Please wait a moment and try again.`
    );
  }

  if (res.status === 404) {
    throw new Error(`API endpoint not found (HTTP 404): ${endpoint}`);
  }

  if (trimmed.toLowerCase().includes('<html') || trimmed.toLowerCase().includes('<!doctype')) {
    const titleMatch = trimmed.match(/<title>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : `HTTP ${res.status} Error`;
    throw new Error(`Backend returned HTML error page (${title}) instead of JSON data (HTTP ${res.status}).`);
  }

  if (trimmed.length > 0) {
    throw new Error(`Backend returned non-JSON error (HTTP ${res.status}): ${trimmed.slice(0, 160)}`);
  }

  throw new Error(`Backend returned empty response with status ${res.status}.`);
}
