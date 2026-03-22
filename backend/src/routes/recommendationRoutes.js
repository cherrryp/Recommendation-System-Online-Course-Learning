import express from "express"
import { getRecommendedCourses, getSimilarCourses } from "../controllers/recommendationController.js"
import { verifyToken } from "../middleware/auth.js"

const router = express.Router()

router.get("/:userId", verifyToken, getRecommendedCourses)         // แนะนำตาม interest
router.get("/similar/:courseId", verifyToken, getSimilarCourses)   // คอร์สที่คล้ายกัน

export default router