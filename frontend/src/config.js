// Backend origin, set via VITE_API_URL in frontend/.env
export const API_ORIGIN = import.meta.env.VITE_API_URL || "http://localhost:3000"
export const API_BASE_URL = `${API_ORIGIN}/api`
