import express from "express"
import { toggle, getBookmarks } from "../controllers/bookmarkController.js"
import { verifyToken, requireSelfOrAdmin } from "../middleware/auth.js"

const router = express.Router()

router.post("/toggle", verifyToken, toggle)
router.get("/:userId", verifyToken, requireSelfOrAdmin, getBookmarks)

export default router
