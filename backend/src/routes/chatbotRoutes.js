import express from "express"
import { sendMessage, health } from "../controllers/chatbotController.js"
import { verifyToken } from "../middleware/auth.js"

const router = express.Router()

router.post("/", verifyToken, sendMessage)
router.get("/health", health)  // ไม่ต้อง auth เช็คได้เลย

export default router