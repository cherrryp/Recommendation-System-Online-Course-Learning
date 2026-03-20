import express from "express"
import { getAllCourses, getCourseById, getCoursesWithRating } from "../controllers/courseController.js"

const router = express.Router()

router.get("/", getAllCourses);
router.get("/popular", getCoursesWithRating)
router.get("/:id", getCourseById);

export default router



