import prisma from "../lib/prisma.js"

export const getDashboardStats = async (req, res) => {
  try {
    const [users, courses, interactions, bookmarks] = await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.userInteraction.count(),
      prisma.bookmark.count(),
    ])

    // interaction แยกตาม action
    const interactionsByAction = await prisma.userInteraction.groupBy({
      by: ["action"],
      _count: { action: true },
    })

    // top 5 คอร์สที่ถูกกดมากที่สุด
    const topInteracted = await prisma.userInteraction.groupBy({
      by: ["courseId"],
      _count: { courseId: true },
      orderBy: { _count: { courseId: "desc" } },
      take: 5,
    })

    const topCourses = await Promise.all(
      topInteracted.map(async (e) => {
        const course = await prisma.course.findUnique({
          where: { id: e.courseId },
          select: { title: true, university: true },
        })
        return { title: course?.title, university: course?.university, count: e._count.courseId }
      })
    )

    // top 5 คอร์สที่ถูก bookmark มากที่สุด
    const topBookmarked = await prisma.bookmark.groupBy({
      by: ["courseId"],
      _count: { courseId: true },
      orderBy: { _count: { courseId: "desc" } },
      take: 5,
    })

    const topBookmarkedCourses = await Promise.all(
      topBookmarked.map(async (e) => {
        const course = await prisma.course.findUnique({
          where: { id: e.courseId },
          select: { title: true, university: true },
        })
        return { title: course?.title, university: course?.university, count: e._count.courseId }
      })
    )

    // user ล่าสุด
    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, email: true, username: true, role: true, createdAt: true },
    })

    // category distribution
    const categoryStats = await prisma.course.groupBy({
      by: ["category"],
      _count: { category: true },
      orderBy: { _count: { category: "desc" } },
      take: 8,
    })

    res.json({
      success: true,
      data: {
        users,
        courses,
        interactions,
        bookmarks,
        interactionsByAction,
        topCourses,
        topBookmarkedCourses,
        recentUsers,
        categoryStats,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: "Failed to fetch stats" })
  }
}

export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, email: true, username: true,
        fname: true, lname: true, role: true, createdAt: true,
        _count: { select: { interactions: true, bookmarks: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    res.json({ success: true, data: users })
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch users" })
  }
}

export const getUserById = async (req, res) => {
  const { id } = req.params
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, username: true,
        fname: true, lname: true, role: true, createdAt: true,
        interests: { select: { keyword: true, score: true } },
        _count: { select: { interactions: true, bookmarks: true } },
      },
    })
    if (!user) return res.status(404).json({ success: false, error: "User not found" })
    res.json({ success: true, data: user })
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch user" })
  }
}

export const deleteUser = async (req, res) => {
  const { id } = req.params
  try {
    await prisma.user.delete({ where: { id } })
    res.json({ success: true, message: "User deleted" })
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to delete user" })
  }
}

export const getAllCourses = async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      select: {
        id: true, title: true, category: true,
        university: true, price: true, status: true, createdAt: true,
        _count: { select: { interactions: true, bookmarks: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    res.json({ success: true, data: courses })
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch courses" })
  }
}

export const getCourseById = async (req, res) => {
  const { id } = req.params
  try {
    const course = await prisma.course.findUnique({
      where: { id },
      include: { keywords: true },
    })
    if (!course) return res.status(404).json({ success: false, error: "Course not found" })
    res.json({ success: true, data: course })
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch course" })
  }
}

export const updateCourse = async (req, res) => {
  const { id } = req.params
  const { title, description, category, price, status } = req.body
  try {
    const course = await prisma.course.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(category && { category }),
        ...(price !== undefined && { price: Number(price) }),
        ...(status && { status }),
      },
    })
    res.json({ success: true, data: course })
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to update course" })
  }
}

export const deleteCourse = async (req, res) => {
  const { id } = req.params
  try {
    await prisma.course.delete({ where: { id } })
    res.json({ success: true, message: "Course deleted" })
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to delete course" })
  }
}
