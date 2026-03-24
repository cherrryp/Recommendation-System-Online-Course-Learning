import express from "express"
import {
  getAllCourses,
  getCourseById,
  getCategories,
  getUniversities,
  getPopular,
} from "../controllers/courseController.js"

const router = express.Router()

router.get("/", getAllCourses)
router.get("/categories", getCategories)     // ต้องอยู่ก่อน /:id
router.get("/universities", getUniversities) // ต้องอยู่ก่อน /:id
router.get("/popular", getPopular) // ต้องอยู่ก่อน /:id
router.get("/:id", getCourseById)

export default router