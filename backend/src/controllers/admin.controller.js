import prisma from "../lib/prisma.js"

export const getDashboardStats = async (req, res) => {
  try {
    const [users, courses, enrollments, certificates, avgRatingResult] = await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.enrollment.count(),
      prisma.certificate.count(),
      prisma.feedback.aggregate({ _avg: { rating: true } })
    ])

    const enrollmentsByStatus = await prisma.enrollment.groupBy({
      by: ["status"],
      _count: { status: true }
    })

    const topCoursesRaw = await prisma.enrollment.groupBy({
      by: ["courseId"],
      _count: { courseId: true },
      orderBy: { _count: { courseId: "desc" } },
      take: 5
    })

    const topCourses = await Promise.all(
      topCoursesRaw.map(async (e) => {
        const course = await prisma.course.findUnique({
          where: { id: e.courseId },
          select: { courseName: true }
        })
        return { courseName: course?.courseName, enrollments: e._count.courseId }
      })
    )

    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, email: true, createdAt: true, role: true }
    })

    res.json({
      users,
      courses,
      enrollments,
      certificates,
      averageRating: Number((avgRatingResult._avg.rating ?? 0).toFixed(1)),
      enrollmentsByStatus,
      topCourses,
      recentUsers
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to fetch stats" })
  }
}

export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, createdAt: true }
    })
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" })
  }
}

export const deleteUser = async (req, res) => {
  const { id } = req.params
  try {
    await prisma.user.delete({ where: { id } })
    res.json({ message: "User deleted" })
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" })
  }
}

export const getAllCourses = async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" }
    })
    res.json(courses)
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch courses" })
  }
}

export const deleteCourse = async (req, res) => {
  const { id } = req.params
  try {
    await prisma.course.delete({ where: { id } })
    res.json({ message: "Course deleted" })
  } catch (error) {
    res.status(500).json({ error: "Failed to delete course" })
  }
}

export const getUserById = async (req, res) => {
  const { id } = req.params
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        fname: true,
        lname: true,
        role: true,
        educationLevel: true,
        birthDate: true,
        createdAt: true,
        interests: {
          select: { keyword: true }
        }
      }
    })
    if (!user) return res.status(404).json({ error: "User not found" })
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" })
  }
}

export const getCourseById = async (req, res) => {
  const { id } = req.params
  try {
    const course = await prisma.course.findUnique({
      where: { id },
      include: { category: true }
    })
    if (!course) return res.status(404).json({ error: "Course not found" })
    res.json(course)
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch course" })
  }
}

export const updateCourse = async (req, res) => {
  const { id } = req.params
  const { courseName, level, price, categoryId, courseDescription } = req.body
  try {
    const course = await prisma.course.update({
      where: { id },
      data: { courseName, level, price: price ? Number(price) : null, categoryId, courseDescription }
    })
    res.json(course)
  } catch (error) {
    res.status(500).json({ error: "Failed to update course" })
  }
}