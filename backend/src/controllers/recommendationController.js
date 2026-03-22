import {
  getPersonalizedCourses,
  getRecommendedCourses as fetchSimilarCourses,
} from "../service/recommendation.service.js"

// GET /api/recommendations/:userId
// แนะนำคอร์สตาม UserInterest ของ user
export const getRecommendedCourses = async (req, res) => {
  try {
    const { userId } = req.params
    const limit = parseInt(req.query.limit) || 12

    const courses = await getPersonalizedCourses(userId, limit)

    res.json({ success: true, data: courses })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "Error getting recommendations" })
  }
}

// GET /api/recommendations/similar/:courseId
// หาคอร์สที่คล้ายกันด้วย embedding
export const getSimilarCourses = async (req, res) => {
  try {
    const { courseId } = req.params
    const limit = parseInt(req.query.limit) || 8

    const courses = await fetchSimilarCourses(courseId, limit)

    res.json({ success: true, data: courses })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "Error getting similar courses" })
  }
}