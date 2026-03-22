import express from "express"
import { recordInteraction } from "../controllers/interactionController.js"
import { verifyToken } from "../middleware/auth.js"

const router = express.Router()

router.post("/", verifyToken, recordInteraction)

export default router