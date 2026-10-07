import {
  getPersonalizedCourses,
  getRecommendedCourses as fetchSimilarCourses,
} from "../service/recommendation.service.js"
import asyncHandler from "../utils/asyncHandler.js"

// GET /api/recommendations/:userId
// แนะนำคอร์สตาม UserInterest ของ user
export const getRecommendedCourses = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 12
  const courses = await getPersonalizedCourses(req.params.userId, limit)
  res.json({ success: true, data: courses })
})

// GET /api/recommendations/similar/:courseId
// หาคอร์สที่คล้ายกันด้วย embedding
export const getSimilarCourses = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 8
  const courses = await fetchSimilarCourses(req.params.courseId, limit)
  res.json({ success: true, data: courses })
})
