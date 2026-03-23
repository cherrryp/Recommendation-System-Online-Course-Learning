import api from "./api"

// แนะนำคอร์สตาม UserInterest
export const getRecommendations = (userId, limit = 12) => {
  return api.get(`http://localhost:8000/api/recommendations`, {
    params: { userId, limit }
  })
}
// คอร์สที่คล้ายกัน
export const getSimilarCourses = (courseId, limit = 8) => {
  return api.get(`http://localhost:8000/api/similar-courses/${courseId}`, {
    params: { limit }
  })
}