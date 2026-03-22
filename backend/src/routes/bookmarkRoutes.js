import express from "express"
import { toggle, getBookmarks, checkBookmark } from "../controllers/bookmarkController.js"
import { verifyToken } from "../middleware/auth.js"

const router = express.Router()

router.post("/toggle", verifyToken, toggle)
router.get("/:userId", verifyToken, getBookmarks)
router.get("/check/:userId/:courseId", verifyToken, checkBookmark)

export default router