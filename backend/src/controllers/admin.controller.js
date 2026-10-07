import prisma from "../lib/prisma.js"
import { COURSE_ADMIN_SELECT } from "../constants/courseSelect.js"
import { getDashboardStats as fetchDashboardStats } from "../service/admin.service.js"
import asyncHandler from "../utils/asyncHandler.js"
import HttpError from "../utils/HttpError.js"

const USER_LIST_SELECT = {
  id: true, email: true, username: true,
  fname: true, lname: true, role: true, createdAt: true,
}
const ACTIVITY_COUNT = { _count: { select: { interactions: true, bookmarks: true } } }

// GET /api/admin/stats
export const getDashboardStats = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await fetchDashboardStats() })
})

// GET /api/admin/users
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    select: { ...USER_LIST_SELECT, ...ACTIVITY_COUNT },
    orderBy: { createdAt: "desc" },
  })
  res.json({ success: true, data: users })
})

// GET /api/admin/users/:id
export const getUserById = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      ...USER_LIST_SELECT,
      interests: { select: { keyword: true, score: true } },
      ...ACTIVITY_COUNT,
    },
  })
  if (!user) throw new HttpError(404, "User not found")
  res.json({ success: true, data: user })
})

// DELETE /api/admin/users/:id
export const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) {
    throw new HttpError(400, "You cannot delete your own account")
  }
  await prisma.user.delete({ where: { id: req.params.id } })
  res.json({ success: true, message: "User deleted" })
})

// GET /api/admin/courses
export const getAllCourses = asyncHandler(async (req, res) => {
  const courses = await prisma.course.findMany({
    select: { ...COURSE_ADMIN_SELECT, ...ACTIVITY_COUNT },
    orderBy: { createdAt: "desc" },
  })
  res.json({ success: true, data: courses })
})

// GET /api/admin/courses/:id
export const getCourseById = asyncHandler(async (req, res) => {
  const course = await prisma.course.findUnique({
    where: { id: req.params.id },
    include: { keywords: true },
  })
  if (!course) throw new HttpError(404, "Course not found")
  res.json({ success: true, data: course })
})

// PATCH /api/admin/courses/:id
export const updateCourse = asyncHandler(async (req, res) => {
  const { title, description, category, price, status } = req.body
  const course = await prisma.course.update({
    where: { id: req.params.id },
    data: {
      ...(title && { title }),
      ...(description && { description }),
      ...(category && { category }),
      ...(price !== undefined && { price: Number(price) }),
      ...(status && { status }),
    },
  })
  res.json({ success: true, data: course })
})

// DELETE /api/admin/courses/:id
export const deleteCourse = asyncHandler(async (req, res) => {
  await prisma.course.delete({ where: { id: req.params.id } })
  res.json({ success: true, message: "Course deleted" })
})
