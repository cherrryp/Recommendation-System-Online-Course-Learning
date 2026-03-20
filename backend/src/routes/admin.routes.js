import express from "express"
import { verifyToken, verifyAdmin } from "../middleware/auth.js"

import {
  getDashboardStats,
  getAllUsers,
  deleteUser,
  getAllCourses,
  deleteCourse
} from "../controllers/admin.controller.js"

const router = express.Router()

router.get("/stats", verifyToken, verifyAdmin, getDashboardStats)
router.get("/users", verifyToken, verifyAdmin, getAllUsers)
router.delete("/users/:id", verifyToken, verifyAdmin, deleteUser)
router.get("/courses", verifyToken, verifyAdmin, getAllCourses)
router.delete("/courses/:id", verifyToken, verifyAdmin, deleteCourse)

export default router