import prisma from "../lib/prisma.js"
import { COURSE_CARD_SELECT } from "../constants/courseSelect.js"
import { weightOf } from "../constants/interaction.js"
import { dedupeCourses } from "../utils/courseKey.js"
import { memo } from "../utils/ttlCache.js"

// ดึงคอร์สทั้งหมด พร้อม filter และ search
export const getAllCourses = async ({ search, category, university, minPrice, maxPrice, page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit

  const where = {
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { keywords: { some: { keyword: { contains: search, mode: "insensitive" } } } },
      ],
    }),
    ...(category && { category: { equals: category, mode: "insensitive" } }),
    ...(university && { university: { equals: university, mode: "insensitive" } }),
    ...((minPrice !== undefined || maxPrice !== undefined) && {
      price: {
        ...(minPrice !== undefined && { gte: minPrice }),
        ...(maxPrice !== undefined && { lte: maxPrice }),
      },
    }),
  }

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      select: {
        ...COURSE_CARD_SELECT,
        instructor: true,
        keywords: { select: { keyword: true } },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.course.count({ where }),
  ])

  return {
    courses: courses.map((c) => ({
      ...c,
      keywords: c.keywords.map((k) => k.keyword),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}

// ดึงคอร์สตาม id
export const getCourseById = async (id) => {
  const course = await prisma.course.findUnique({
    where: { id },
    select: {
      ...COURSE_CARD_SELECT,
      description: true,
      instructor: true,
      keywords: { select: { keyword: true } },
    },
  })

  if (!course) return null

  return {
    ...course,
    keywords: course.keywords.map((k) => k.keyword),
  }
}

// ดึง category ทั้งหมด (สำหรับ filter dropdown)
export const getAllCategories = async () => {
  const result = await prisma.course.findMany({
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  })
  return result.map((r) => r.category).filter(Boolean)
}

// ดึง university ทั้งหมด (สำหรับ filter dropdown)
export const getAllUniversities = async () => {
  const result = await prisma.course.findMany({
    select: { university: true },
    distinct: ["university"],
    orderBy: { university: "asc" },
  })
  return result.map((r) => r.university).filter(Boolean)
}

// คะแนน popularity ของแต่ละคอร์สจาก UserInteraction → [courseId เรียงตาม score]
const rankCourseIdsByInteraction = async (limit) => {
  const interactions = await prisma.userInteraction.groupBy({
    by: ["courseId", "action"],
    _count: { action: true },
    where: { courseId: { not: null } },
  })

  const scores = {}
  for (const i of interactions) {
    scores[i.courseId] = (scores[i.courseId] || 0) + i._count.action * weightOf(i.action)
  }

  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([courseId]) => courseId)
}

// fallback เมื่อยังไม่มี interaction → จัดอันดับตามจำนวน bookmark
const rankCourseIdsByBookmark = async (limit) => {
  const bookmarks = await prisma.bookmark.groupBy({
    by: ["courseId"],
    _count: { courseId: true },
    orderBy: { _count: { courseId: "desc" } },
    take: limit,
  })
  return bookmarks.map((b) => b.courseId)
}

// ดึงคอร์สตามลำดับ id ที่ให้มา (findMany ไม่รักษาลำดับของ `in`)
const findCoursesInOrder = async (ids) => {
  const courses = await prisma.course.findMany({
    where: { id: { in: ids } },
    select: COURSE_CARD_SELECT,
  })
  const byId = new Map(courses.map((c) => [c.id, c]))
  return ids.map((id) => byId.get(id)).filter(Boolean)
}

// ดึงคอร์สยอดนิยม: interaction → bookmark → คอร์สล่าสุด
export const getPopularCourses = async (limit = 8) => {
  let ids = await rankCourseIdsByInteraction(limit)
  if (!ids.length) ids = await rankCourseIdsByBookmark(limit)

  if (!ids.length) {
    return prisma.course.findMany({
      select: COURSE_CARD_SELECT,
      take: limit,
      orderBy: { createdAt: "desc" },
    })
  }

  return findCoursesInOrder(ids)
}

// ─── Trending / Explore ────────────────────────────────────────────────────

const TRENDING_DAYS = 14
const TRENDING_TTL_MS = 5 * 60 * 1000

// กำลังมาแรง: นับเฉพาะกิจกรรมในช่วง N วันล่าสุด (ต่างจาก popular ที่นับตลอดกาล)
export const getTrendingCourses = (limit = 8) =>
  memo(`trending:${limit}`, TRENDING_TTL_MS, async () => {
    const since = new Date(Date.now() - TRENDING_DAYS * 24 * 60 * 60 * 1000)

    const [interactions, bookmarks] = await Promise.all([
      prisma.userInteraction.groupBy({
        by: ["courseId", "action"],
        where: { courseId: { not: null }, createdAt: { gte: since } },
        _count: { action: true },
      }),
      prisma.bookmark.groupBy({
        by: ["courseId"],
        where: { createdAt: { gte: since } },
        _count: { courseId: true },
      }),
    ])

    const scores = {}
    for (const i of interactions) {
      // bookmark ถูกนับจากตาราง Bookmark แล้ว (กัน toggle ซ้ำ) จึงข้าม action นี้
      if (i.action === "bookmark") continue
      scores[i.courseId] = (scores[i.courseId] || 0) + i._count.action * weightOf(i.action)
    }
    for (const b of bookmarks) {
      scores[b.courseId] = (scores[b.courseId] || 0) + b._count.courseId * weightOf("bookmark")
    }

    const ids = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit * 3) // เผื่อตัดคอร์สซ้ำ
      .map(([id]) => id)

    // ยังไม่มีกิจกรรมในช่วงนี้ → ถอยกลับไปใช้ยอดนิยมตลอดกาล
    if (!ids.length) return getPopularCourses(limit)
    return dedupeCourses(await findCoursesInOrder(ids)).slice(0, limit)
  })

// สำรวจสิ่งใหม่: คอร์สยอดนิยมจากหมวดที่ user ยังไม่เคยแตะ (ลด filter bubble)
export const getExploreCourses = async (touchedCategories, limit = 8) => {
  const courses = await prisma.course.findMany({
    where: { category: { notIn: touchedCategories } },
    select: COURSE_CARD_SELECT,
    orderBy: [
      { bookmarks: { _count: "desc" } },
      { interactions: { _count: "desc" } },
      { createdAt: "desc" },
    ],
    take: limit * 4,
  })
  return dedupeCourses(courses).slice(0, limit)
}
