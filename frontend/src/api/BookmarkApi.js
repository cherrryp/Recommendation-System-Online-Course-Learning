import api from "./api"

// toggle bookmark
export const toggleBookmark = (userId, courseId) => {
  return api.post("/bookmarks/toggle", { userId, courseId })
}

// ดึง bookmark ทั้งหมดของ user
export const getBookmarks = (userId) => {
  return api.get(`/bookmarks/${userId}`)
}

// เช็คว่า bookmark ไหม
export const checkBookmark = (userId, courseId) => {
  return api.get(`/bookmarks/check/${userId}/${courseId}`)
}