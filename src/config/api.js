const rawBase = (import.meta.env.VITE_API_URL || "").trim();
const isProd = Boolean(import.meta.env.PROD);

// If someone accidentally sets localhost as API URL in production,
// ignore it so the app uses same-origin `/api/...`.
const normalizedBase = isProd && rawBase && /localhost|127\.0\.0\.1/i.test(rawBase) ? "" : rawBase;

// If VITE_API_URL is empty, use same-origin so `/api/...` works in production.
export const API_BASE_URL = normalizedBase ? normalizedBase.replace(/\/$/, "") : "";

export const apiUrl = (path) => `${API_BASE_URL}${path}`;
