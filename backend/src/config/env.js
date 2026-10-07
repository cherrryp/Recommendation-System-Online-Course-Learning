// Fails fast at startup if required configuration is missing
const REQUIRED = ["DATABASE_URL", "JWT_SECRET"]

export const assertEnv = () => {
  const missing = REQUIRED.filter((key) => !process.env[key])
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`)
  }
}

export const PORT = Number(process.env.PORT) || 3000

// Comma-separated list, e.g. "http://localhost:5173,https://app.example.com"
// Unset = allow any origin (development default)
export const CORS_ORIGINS = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : true
