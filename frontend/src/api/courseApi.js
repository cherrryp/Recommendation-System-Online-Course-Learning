import api from "./api"

// ดึงคอร์สทั้งหมด พร้อม filter และ search
export const getCourses = (params = {}) => {
  return api.get("/courses", { params })
  // params: { search, category, university, page, limit }
}

// ดึง category ทั้งหมด
export const getCategories = () => {
  return api.get("/courses/categories")
}

// ดึง university ทั้งหมด
export const getUniversities = () => {
  return api.get("/courses/universities")
}

// ดึง Popular Course
export const getPopularCourses = (limit = 8) => {
  return api.get("/courses/popular", { params: { limit } })
}