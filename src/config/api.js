const rawBase = (import.meta.env.VITE_API_URL || "").trim();

// If VITE_API_URL is empty, use same-origin so `/api/...` works in production.
export const API_BASE_URL = rawBase ? rawBase.replace(/\/$/, "") : "";

export const apiUrl = (path) => `${API_BASE_URL}${path}`;
