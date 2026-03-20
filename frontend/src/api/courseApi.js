import api from "./api"

// ดึง course ทั้งหมด
export const getCourses = () => {
  return api.get("/courses")
}

// ดึง course ตาม id
export const getCourseById = (id) => {
  return api.get(`/courses/${id}`)
}

// popular courses
export const getPopularCourses = () => {
  return api.get("/courses/popular")
}