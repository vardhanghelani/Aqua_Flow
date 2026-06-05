import type { CorsOptions } from 'cors';

/** Normalize URL origins — browsers never send a trailing slash. */
function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/$/, '');
}

/** Comma-separated list in CORS_ORIGIN, e.g. http://localhost:5173,https://app.example.com */
export function getAllowedOrigins(): string[] {
  const raw = process.env.CORS_ORIGIN || 'http://localhost:5173';
  return raw
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);
}

export function buildCorsOptions(): CorsOptions {
  const allowed = getAllowedOrigins();

  return {
    origin(origin, callback) {
      // Same-origin or non-browser requests (curl, Postman)
      if (!origin) {
        callback(null, true);
        return;
      }

      const requestOrigin = normalizeOrigin(origin);
      if (allowed.includes(requestOrigin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  };
}
