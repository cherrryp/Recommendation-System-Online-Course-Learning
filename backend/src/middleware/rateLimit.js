import rateLimit from "express-rate-limit"

const limiter = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) =>
      res.status(429).json({ success: false, message }),
  })

// login / register: slow down brute force
export const authLimiter = limiter(15 * 60 * 1000, 30, "Too many attempts, please try again later")

// chatbot calls the local LLM, which is expensive
export const chatLimiter = limiter(60 * 1000, 20, "Too many messages, please slow down")
