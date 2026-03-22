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
    ...(university && { university: { equals: university, mode: "insensitive" } }),
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
