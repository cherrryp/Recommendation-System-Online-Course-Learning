import prisma from "../lib/prisma.js"

const DAY_MS = 24 * 60 * 60 * 1000
const TOP_LIMIT = 5

// groupBy rows ({ courseId, _count }) → [{ title, university, count }]
// โหลดข้อมูลคอร์สครั้งเดียวด้วย `in` แทนที่จะ query ทีละคอร์ส
const attachCourseInfo = async (rows) => {
  const courses = await prisma.course.findMany({
    where: { id: { in: rows.map((r) => r.courseId).filter(Boolean) } },
    select: { id: true, title: true, university: true },
  })
  const byId = new Map(courses.map((c) => [c.id, c]))

  return rows.map((r) => {
    const course = byId.get(r.courseId)
    return { title: course?.title, university: course?.university, count: r._count.courseId }
  })
}

const topCoursesBy = async (model, where = {}) => {
  const rows = await prisma[model].groupBy({
    by: ["courseId"],
    where,
    _count: { courseId: true },
    orderBy: { _count: { courseId: "desc" } },
    take: TOP_LIMIT,
  })
  return attachCourseInfo(rows)
}

const countByDate = (rows) => {
  const counts = {}
  for (const { createdAt } of rows) {
    const date = createdAt.toISOString().split("T")[0]
    counts[date] = (counts[date] || 0) + 1
  }
  return Object.entries(counts).map(([date, count]) => ({ date, count }))
}

// รัน query เป็นกลุ่มเล็ก ๆ เพราะ connection pool ของ DB จำกัด (pool_size 15)
export const getDashboardStats = async () => {
  const sevenDaysAgo = new Date(Date.now() - 7 * DAY_MS)

  const [users, courses, interactions, bookmarks, embeddingCount] = await Promise.all([
    prisma.user.count(),
    prisma.course.count(),
    prisma.userInteraction.count(),
    prisma.bookmark.count(),
    prisma.courseEmbedding.count(),
  ])

  const [interactionsByAction, topCourses, topBookmarkedCourses, recentUsers] = await Promise.all([
    prisma.userInteraction.groupBy({ by: ["action"], _count: { action: true } }),
    topCoursesBy("userInteraction", { courseId: { not: null } }),
    topCoursesBy("bookmark"),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, email: true, username: true, role: true, createdAt: true },
    }),
  ])

  const [categoryStats, universityStats, freeCourses, paidCourses] = await Promise.all([
    prisma.course.groupBy({
      by: ["category"],
      _count: { category: true },
      orderBy: { _count: { category: "desc" } },
    }),
    prisma.course.groupBy({
      by: ["university"],
      _count: { university: true },
      orderBy: { _count: { university: "desc" } },
    }),
    prisma.course.count({ where: { price: 0 } }),
    prisma.course.count({ where: { price: { gt: 0 } } }),
  ])

  const [topKeywords, activeUsers, recentInteractions] = await Promise.all([
    prisma.userInterest.groupBy({
      by: ["keyword"],
      _sum: { score: true },
      orderBy: { _sum: { score: "desc" } },
      take: 20,
    }),
    prisma.userInteraction.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.userInteraction.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ])

  return {
    users, courses, interactions, bookmarks,
    interactionsByAction,
    topCourses, topBookmarkedCourses,
    recentUsers, categoryStats, universityStats,
    freeCourses, paidCourses,
    topKeywords,
    activeUsers: activeUsers.length,
    interactionTrend: countByDate(recentInteractions),
    embeddingCoverage: { total: courses, covered: embeddingCount },
  }
}
