import express from "express"
import { getRecommendedCourses, getSimilarCourses } from "../controllers/recommendationController.js"
import { verifyToken, requireSelfOrAdmin } from "../middleware/auth.js"

const router = express.Router()

router.get("/similar/:courseId", verifyToken, getSimilarCourses)               // คอร์สที่คล้ายกัน (ต้องอยู่ก่อน /:userId)
router.get("/:userId", verifyToken, requireSelfOrAdmin, getRecommendedCourses) // แนะนำตาม interest

export default router
