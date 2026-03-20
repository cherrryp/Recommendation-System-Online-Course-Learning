import express from "express"
import { getRecommendedCourses } from "../controllers/recommendationController.js"
import { verifyToken } from "../middleware/auth.js"

const router = express.Router()

router.get("/:userId", verifyToken, getRecommendedCourses)

export default router