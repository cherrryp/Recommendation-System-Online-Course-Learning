import express from "express"
import {
  getProfile, updateProfile, changePassword,
  getInterests, updateInterests,
} from "../controllers/userController.js"
import { verifyToken } from "../middleware/auth.js"

const router = express.Router()

router.get("/profile/:userId", verifyToken, getProfile)
router.put("/profile/:userId", verifyToken, updateProfile)
router.put("/password/:userId", verifyToken, changePassword)
router.get("/interests/:userId", verifyToken, getInterests)
router.put("/interests/:userId", verifyToken, updateInterests)

export default router