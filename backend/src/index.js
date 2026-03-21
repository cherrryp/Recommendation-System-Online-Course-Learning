import dotenv from "dotenv"
import express from "express"
import cors from "cors"

import courseRoutes from "./routes/courseRoutes.js"
import recommendationRoutes from "./routes/recommendationRoutes.js"
import authRoutes from "./routes/authRoutes.js"
import userRoutes from "./routes/userRoutes.js"
import enrollmentRoutes from "./routes/enrollmentRoutes.js"
import adminRoutes from "./routes/admin.routes.js"
import interactionRoutes from "./routes/interactionRoutes.js"

// โหลด .env
dotenv.config()

// สร้าง express app ก่อน
const app = express()

app.use(cors())
app.use(express.json())

// routes
app.use("/api/auth", authRoutes)
app.use("/api/courses", courseRoutes)
app.use("/api/recommendations", recommendationRoutes)
app.use("/api/user", userRoutes)
app.use("/api/enrollments", enrollmentRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/interactions", interactionRoutes);

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }))

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error"
  })
})

app.get("/", (req, res) => {
  res.send("API running")
})

app.listen(3000, () => {
  console.log("Server running on port 3000")
})

console.log("start server")

export default app