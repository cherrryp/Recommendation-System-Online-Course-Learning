import {
  getAllCourses as fetchAllCourses,
  getCourseById as fetchCourseById,
  getAllCategories,
  getAllUniversities,
  getPopularCourses,
  getTrendingCourses,
} from "../service/course.service.js"
import asyncHandler from "../utils/asyncHandler.js"
import HttpError from "../utils/HttpError.js"

// GET /api/courses
export const getAllCourses = asyncHandler(async (req, res) => {
  const { search, category, university, page, limit, minPrice, maxPrice } = req.query

  const result = await fetchAllCourses({
    search,
    category,
    university,
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    minPrice: minPrice !== undefined ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice !== undefined ? parseFloat(maxPrice) : undefined,
  })

  res.json({ success: true, ...result })
})

// GET /api/courses/categories
export const getCategories = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await getAllCategories() })
})

// GET /api/courses/universities
export const getUniversities = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await getAllUniversities() })
})

// GET /api/courses/:id
export const getCourseById = asyncHandler(async (req, res) => {
  const course = await fetchCourseById(req.params.id)
  if (!course) throw new HttpError(404, "Course not found")
  res.json({ success: true, data: course })
})

// GET /api/courses/trending
export const getTrending = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 8
  res.json({ success: true, data: await getTrendingCourses(limit) })
})

// GET /api/courses/popular
export const getPopular = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 8
  res.json({ success: true, data: await getPopularCourses(limit) })
})
