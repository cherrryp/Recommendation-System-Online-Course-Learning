import prisma from "../lib/prisma.js"

// ดึงคอร์สทั้งหมด พร้อม filter และ search
export const getAllCourses = async ({ search, category, university, page = 1, limit = 20 }) => {
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
    ...(university && { university: { equals: university, mode: "insensitive" } })
  }

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      select: {
        id: true,
        title: true,
        category: true,
        university: true,
        instructor: true,
        price: true,
        status: true,
        thumbnailUrl: true,
        url: true,
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
      id: true,
      title: true,
      description: true,
      category: true,
      university: true,
      instructor: true,
      price: true,
      status: true,
      thumbnailUrl: true,
      url: true,
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

// ดึงคอร์ยอดนิยมจาก UserInteraction
export const getPopularCourses = async (limit = 8) => {
  const WEIGHT = { click: 1, bookmark: 3, search: 1 }

  // รวม score จาก interaction
  const interactions = await prisma.userInteraction.groupBy({
    by: ["courseId", "action"],
    _count: { action: true },
  })

  // คำนวณ score แต่ละคอร์ส
  const scoreMap = {}
  interactions.forEach((i) => {
    const w = WEIGHT[i.action] || 1
    scoreMap[i.courseId] = (scoreMap[i.courseId] || 0) + i._count.action * w
  })

  // ถ้ายังไม่มี interaction → fallback ใช้ bookmark
  if (Object.keys(scoreMap).length === 0) {
    const bookmarks = await prisma.bookmark.groupBy({
      by: ["courseId"],
      _count: { courseId: true },
      orderBy: { _count: { courseId: "desc" } },
      take: limit,
    })

    const courseIds = bookmarks.map((b) => b.courseId)
    if (courseIds.length === 0) {
      // fallback สุดท้าย → คอร์สล่าสุด
      return await prisma.course.findMany({
        select: {
          id: true, title: true, category: true,
          university: true, thumbnailUrl: true,
          url: true, price: true, status: true,
        },
        take: limit,
        orderBy: { createdAt: "desc" },
      })
    }

    return await prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: {
        id: true, title: true, category: true,
        university: true, thumbnailUrl: true,
        url: true, price: true, status: true,
      },
    })
  }

  // เรียง courseId ตาม score
  const sorted = Object.entries(scoreMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([courseId]) => courseId)

  const courses = await prisma.course.findMany({
    where: { id: { in: sorted } },
    select: {
      id: true, title: true, category: true,
      university: true, thumbnailUrl: true,
      url: true, price: true, status: true,
    },
  })

  // sort ตาม score อีกครั้ง เพราะ findMany ไม่ได้เรียงตาม in
  return sorted.map((id) => courses.find((c) => c.id === id)).filter(Boolean)
}