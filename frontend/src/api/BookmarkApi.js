import api from "./api"

// toggle bookmark
export const toggleBookmark = (userId, courseId) => {
  return api.post("/bookmarks/toggle", { userId, courseId })
}

// ดึง bookmark ทั้งหมดของ user
export const getBookmarks = (userId) => {
  return api.get(`/bookmarks/${userId}`)
}
