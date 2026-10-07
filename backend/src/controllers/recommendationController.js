import {
  getPersonalizedCourses,
  getRecommendedCourses as fetchSimilarCourses,
} from "../service/recommendation.service.js"
import { getHomeRows } from "../service/home.service.js"
import asyncHandler from "../utils/asyncHandler.js"

// GET /api/recommendations/:userId
// แนะนำคอร์สตาม UserInterest ของ user
export const getRecommendedCourses = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 12
  const courses = await getPersonalizedCourses(req.params.userId, limit)
  res.json({ success: true, data: courses })
})

// GET /api/recommendations/:userId/home
// แถวหน้าแรกแบบ Netflix: [{ id, title, courses }]
export const getHome = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await getHomeRows(req.params.userId) })
})

// GET /api/recommendations/similar/:courseId
// หาคอร์สที่คล้ายกันด้วย embedding
export const getSimilarCourses = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 8
  const courses = await fetchSimilarCourses(req.params.courseId, limit)
  res.json({ success: true, data: courses })
})
