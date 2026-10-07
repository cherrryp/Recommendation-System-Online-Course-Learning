import express from "express"
import { verifyToken, verifyAdmin } from "../middleware/auth.js"
import {
  getDashboardStats,
  getAllUsers,
  getUserById,
  deleteUser,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse
} from "../controllers/admin.controller.js"

const router = express.Router()

router.use(verifyToken, verifyAdmin)

router.get("/stats", getDashboardStats)
router.get("/users", getAllUsers)
router.get("/users/:id", getUserById)
router.delete("/users/:id", deleteUser)
router.get("/courses", getAllCourses)
router.get("/courses/:id", getCourseById)
router.patch("/courses/:id", updateCourse)
router.delete("/courses/:id", deleteCourse)

export default router
