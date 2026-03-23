import express from "express"
import { toggle, getBookmarks } from "../controllers/bookmarkController.js"
import { verifyToken } from "../middleware/auth.js"

const router = express.Router()

router.post("/toggle", verifyToken, toggle)
router.get("/:userId", verifyToken, getBookmarks)

export default router

