import dotenv from "dotenv"
import express from "express"
import cors from "cors"

import authRoutes from "./routes/authRoutes.js"
import courseRoutes from "./routes/courseRoutes.js"
import recommendationRoutes from "./routes/recommendationRoutes.js"
import userRoutes from "./routes/userRoutes.js"
import interactionRoutes from "./routes/interactionRoutes.js"
import bookmarkRoutes from "./routes/bookmarkRoutes.js"
import chatbotRoutes from "./routes/chatbotRoutes.js"
import adminRoutes from "./routes/admin.routes.js"

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

// routes
app.use("/api/auth", authRoutes)
app.use("/api/courses", courseRoutes)
app.use("/api/recommendations", recommendationRoutes)
app.use("/api/users", userRoutes)
app.use("/api/interactions", interactionRoutes)
app.use("/api/bookmarks", bookmarkRoutes)
app.use("/api/chatbot", chatbotRoutes)
app.use("/api/admin", adminRoutes)

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }))
app.get("/", (req, res) => res.send("API running"))

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" })
})

// Global error handler
app.use((err, req, res, next) => {
  const status = err.status || 500
  if (status >= 500) console.error(err.stack)
  res.status(status).json({
    success: false,
    message: status >= 500 ? "Internal Server Error" : err.message,
  })
})

export default app
