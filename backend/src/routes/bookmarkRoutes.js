import express from "express"
import { toggle, getBookmarks } from "../controllers/bookmarkController.js"
import { verifyToken, requireSelfOrAdmin } from "../middleware/auth.js"
import { validate } from "../middleware/validate.js"
import { toggleBookmarkSchema } from "../validation/schemas.js"

const router = express.Router()

router.post("/toggle", verifyToken, validate(toggleBookmarkSchema), toggle)
router.get("/:userId", verifyToken, requireSelfOrAdmin, getBookmarks)

export default router
