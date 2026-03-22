import { chat, checkOllamaHealth } from "../service/chatbot.service.js"

// POST /api/chatbot
// body: { userId, message, history: [{role, content}] }
export const sendMessage = async (req, res) => {
  try {
    const { userId, message, history = [] } = req.body

    if (!userId || !message) {
      return res.status(400).json({ success: false, message: "userId และ message required" })
    }

    const result = await chat(userId, message, history)
    res.json({ success: true, ...result })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: error.message || "Chatbot error" })
  }
}

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
