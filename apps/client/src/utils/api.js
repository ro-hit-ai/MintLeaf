// apps/client/src/utils/api.js
const API_BASE =
  import.meta.env.MODE === "development"
    ? "http://localhost:5004/api" // 👈 Always backend in dev
    : import.meta.env.VITE_BACKEND_URL; // 👈 For prod, from .env

export const apiUrl = (path) => `${API_BASE}${path}`;
