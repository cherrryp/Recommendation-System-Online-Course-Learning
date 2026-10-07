import express from "express"
import {
  getProfile, updateProfile, changePassword,
  getInterests, updateInterests,
} from "../controllers/userController.js"
import { verifyToken, requireSelfOrAdmin } from "../middleware/auth.js"

const router = express.Router()

router.use(verifyToken)

router.get("/profile/:userId", requireSelfOrAdmin, getProfile)
router.put("/profile/:userId", requireSelfOrAdmin, updateProfile)
router.put("/password/:userId", requireSelfOrAdmin, changePassword)
router.get("/interests/:userId", requireSelfOrAdmin, getInterests)
router.put("/interests/:userId", requireSelfOrAdmin, updateInterests)

export default router
