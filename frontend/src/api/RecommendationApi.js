import api from "./api"

// แนะนำคอร์สตาม UserInterest
export const getRecommendations = (userId, limit = 12) => {
  return api.get(`/recommendations/${userId}`, { params: { limit } })
}

// คอร์สที่คล้ายกัน
export const getSimilarCourses = (courseId, limit = 8) => {
  return api.get(`/recommendations/similar/${courseId}`, { params: { limit } })
}