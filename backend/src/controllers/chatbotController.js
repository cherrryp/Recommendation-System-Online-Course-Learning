import { chat, checkOllamaHealth } from "../service/chatbot.service.js"
import asyncHandler from "../utils/asyncHandler.js"
import HttpError from "../utils/HttpError.js"

// POST /api/chatbot
// body: { message, page }
export const sendMessage = asyncHandler(async (req, res) => {
  const { message, page = 1 } = req.body
  if (!message) throw new HttpError(400, "message required")

  const result = await chat(req.user.id, message, page)
  res.json({ success: true, ...result })
})

// GET /api/chatbot/health
// เช็คว่า Ollama รันอยู่ไหม
export const health = async (req, res) => {
  try {
    const status = await checkOllamaHealth()
    res.json({ success: true, ...status })
  } catch (error) {
    res.status(500).json({ success: false, running: false })
  }
}
