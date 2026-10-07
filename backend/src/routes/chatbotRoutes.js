import express from "express"
import { sendMessage, health } from "../controllers/chatbotController.js"
import { verifyToken } from "../middleware/auth.js"
import { validate } from "../middleware/validate.js"
import { chatLimiter } from "../middleware/rateLimit.js"
import { chatSchema } from "../validation/schemas.js"

const router = express.Router()

router.post("/", verifyToken, chatLimiter, validate(chatSchema), sendMessage)
router.get("/health", health)  // ไม่ต้อง auth เช็คได้เลย

export default router