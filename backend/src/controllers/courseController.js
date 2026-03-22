import {
  getAllCourses as fetchAllCourses,
  getCourseById as fetchCourseById,
  getAllCategories,
  getAllUniversities,
} from "../service/course.service.js"

// GET /api/courses
export const getAllCourses = async (req, res) => {
  try {
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
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "Error fetching courses" })
  }
}

// GET /api/courses/categories
export const getCategories = async (req, res) => {
  try {
    const categories = await getAllCategories()
    res.json({ success: true, data: categories })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "Error fetching categories" })
  }
}

// GET /api/courses/universities
export const getUniversities = async (req, res) => {
  try {
    const universities = await getAllUniversities()
    res.json({ success: true, data: universities })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "Error fetching universities" })
  }
}

// GET /api/courses/:id
export const getCourseById = async (req, res) => {
  try {
    const course = await fetchCourseById(req.params.id)
    if (!course) return res.status(404).json({ success: false, message: "Course not found" })
    res.json({ success: true, data: course })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "Error fetching course" })
  }
}