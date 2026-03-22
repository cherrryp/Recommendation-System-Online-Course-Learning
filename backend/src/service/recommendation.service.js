import prisma from "../lib/prisma.js"

// แนะนำคอร์สโดยใช้ embedding similarity
// รับ courseId → หาคอร์สที่ใกล้เคียงที่สุด
export const getRecommendedCourses = async (courseId, limit = 8) => {
  const result = await prisma.$queryRaw`
    SELECT
      c.id,
      c.title,
      c.category,
      c.university,
      c.instructor,
      c.price,
      c.status,
      c."thumbnailUrl",
      c.url,
      1 - (ce.embedding <=> (
        SELECT embedding FROM "CourseEmbedding" WHERE "courseId" = ${courseId}
      )) AS similarity
    FROM "Course" c
    JOIN "CourseEmbedding" ce ON ce."courseId" = c.id
    WHERE c.id != ${courseId}
      AND EXISTS (SELECT 1 FROM "CourseEmbedding" WHERE "courseId" = ${courseId})
    ORDER BY ce.embedding <=> (
      SELECT embedding FROM "CourseEmbedding" WHERE "courseId" = ${courseId}
    )
    LIMIT ${limit}
  `
  return result
}

// แนะนำคอร์สตาม UserInterest ของ user
// ดู keyword ที่ user สนใจ → หาคอร์สที่ตรง
export const getPersonalizedCourses = async (userId, limit = 12) => {
  // 1. ดึง interest ของ user เรียงตาม score
  const interests = await prisma.userInterest.findMany({
    where: { userId },
    orderBy: { score: "desc" },
    take: 10,
  })

  if (!interests.length) {
    // ถ้าไม่มี interest → แนะนำคอร์สล่าสุด
    return await prisma.course.findMany({
      select: {
        id: true, title: true, category: true,
        university: true, thumbnailUrl: true, url: true, price: true, status: true,
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    })
  }

  // 2. หาคอร์สที่ keyword ตรงกับ interest
  const keywords = interests.map((i) => i.keyword)

  const courses = await prisma.course.findMany({
    where: {
      keywords: {
        some: { keyword: { in: keywords } },
      },
    },
    select: {
      id: true, title: true, category: true,
      university: true, thumbnailUrl: true, url: true, price: true, status: true,
      keywords: { select: { keyword: true } },
    },
    take: limit * 2, // ดึงมาเยอะกว่าแล้วค่อย sort
  })

  // 3. sort ตาม score รวมของ keyword ที่ match
  const keywordScore = Object.fromEntries(interests.map((i) => [i.keyword, i.score]))

  const scored = courses.map((c) => {
    const score = c.keywords.reduce((sum, k) => sum + (keywordScore[k.keyword] || 0), 0)
    return { ...c, keywords: c.keywords.map((k) => k.keyword), _score: score }
  })

  scored.sort((a, b) => b._score - a._score)

  return scored.slice(0, limit).map(({ _score, ...c }) => c)
}

// อัปเดต UserInterest เมื่อ user interact กับคอร์ส
// weight: bookmark = 3, click = 1, search = 1
export const updateUserInterest = async (userId, courseId, action) => {
  const WEIGHT = { bookmark: 3, click: 1, search: 1 }
  const score = WEIGHT[action] || 1

  // ดึง keyword ของคอร์สนั้น
  const keywords = await prisma.courseKeyword.findMany({
    where: { courseId },
    select: { keyword: true },
  })

  if (!keywords.length) return

  // upsert UserInterest ทีละ keyword
  await Promise.all(
    keywords.map((k) =>
      prisma.userInterest.upsert({
        where: { userId_keyword: { userId, keyword: k.keyword } },
        update: { score: { increment: score } },
        create: { userId, keyword: k.keyword, score },
      })
    )
  )
}
