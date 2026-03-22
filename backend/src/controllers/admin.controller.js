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

    // top 5 bookmark
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

    // recent users
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
    })

    // ── ใหม่ ──

    // university distribution
    const universityStats = await prisma.course.groupBy({
      by: ["university"],
      _count: { university: true },
      orderBy: { _count: { university: "desc" } },
    })

    // free vs paid
    const freeCourses = await prisma.course.count({ where: { price: 0 } })
    const paidCourses = await prisma.course.count({ where: { price: { gt: 0 } } })

    // top interest keywords
    const topKeywords = await prisma.userInterest.groupBy({
      by: ["keyword"],
      _sum: { score: true },
      orderBy: { _sum: { score: "desc" } },
      take: 20,
    })

    // active users ใน 7 วัน
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const activeUsers = await prisma.userInteraction.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { userId: true },
      distinct: ["userId"],
    })

    // interaction trend 7 วัน (groupBy วัน)
    const recentInteractions = await prisma.userInteraction.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true, action: true },
      orderBy: { createdAt: "asc" },
    })

    // group by date
    const trendMap = {}
    recentInteractions.forEach((i) => {
      const date = i.createdAt.toISOString().split("T")[0]
      trendMap[date] = (trendMap[date] || 0) + 1
    })
    const interactionTrend = Object.entries(trendMap).map(([date, count]) => ({ date, count }))

    // embedding coverage
    const embeddingCount = await prisma.courseEmbedding.count()

    res.json({
      success: true,
      data: {
        users, courses, interactions, bookmarks,
        interactionsByAction,
        topCourses, topBookmarkedCourses,
        recentUsers, categoryStats,
        universityStats,
        freeCourses, paidCourses,
        topKeywords,
        activeUsers: activeUsers.length,
        interactionTrend,
        embeddingCoverage: { total: courses, covered: embeddingCount },
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