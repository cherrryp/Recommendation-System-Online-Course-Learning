import prisma from "../lib/prisma.js"
import { COURSE_CARD_SELECT } from "../constants/courseSelect.js"
import { weightOf } from "../constants/interaction.js"
import { dedupeCourses } from "../utils/courseKey.js"
import { getPopularCourses } from "./course.service.js"
import { getUserProfile } from "./userProfile.js"
import { toVectorLiteral } from "./embedding.service.js"

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
  if (result.length) return result

  // คอร์สนี้ยังไม่มี embedding → fallback เป็นคอร์สหมวดเดียวกัน
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { category: true } })
  if (!course) return []
  return prisma.course.findMany({
    where: { category: course.category, id: { not: courseId } },
    select: COURSE_CARD_SELECT,
    take: limit,
    orderBy: { createdAt: "desc" },
  })
}

// ─── Personalised recommendations ──────────────────────────────────────────
// ผสม 2 สัญญาณ: (1) keyword ที่ user สนใจ  (2) ความคล้ายของ embedding กับโปรไฟล์ของ user
// ทั้งสองสร้างจากกิจกรรมที่ถ่วงน้ำหนักตามเวลา (ดู userProfile.js)

const KEYWORD_WEIGHT = 0.45
const SIMILARITY_WEIGHT = 0.55
const MAX_CATEGORY_SHARE = 0.5 // ไม่ให้หมวดเดียวเกินครึ่งของผลลัพธ์

const minMax = (values) => {
  const nums = values.filter((v) => v !== undefined)
  return nums.length ? [Math.min(...nums), Math.max(...nums)] : [0, 0]
}

const normalise = (value, [min, max]) =>
  value === undefined ? 0 : max === min ? 1 : (value - min) / (max - min)

// เลือกผลลัพธ์ตามลำดับคะแนน แต่จำกัดจำนวนต่อหมวด เพื่อให้ผลลัพธ์หลากหลาย
const diversify = (ranked, limit) => {
  const cap = Math.max(1, Math.ceil(limit * MAX_CATEGORY_SHARE))
  const perCategory = {}
  const picked = []
  const skipped = []

  for (const course of ranked) {
    const n = perCategory[course.category] || 0
    if (n < cap) {
      perCategory[course.category] = n + 1
      picked.push(course)
    } else {
      skipped.push(course)
    }
    if (picked.length === limit) return picked
  }
  return [...picked, ...skipped].slice(0, limit)
}

// pure function (ทดสอบง่าย)
// interests: [{ keyword, score }]
// keywordCourses: [{ ...course, keywords: string[] }]
// similarCourses: [{ ...course, similarity }]  (จาก embedding profile ของ user)
// seenKeys: courseGroupKey ของคอร์สที่ user เคยเห็นแล้ว (กันแนะนำซ้ำ รวมถึงเวอร์ชันชั่วโมงอื่นของคอร์สเดิม)
export const rankPersonalized = ({ interests, keywordCourses, similarCourses, limit, seenKeys = [] }) => {
  const interestScore = Object.fromEntries(interests.map((i) => [i.keyword, i.score]))

  const candidates = new Map()
  for (const c of keywordCourses) {
    const keywordScore = c.keywords.reduce((sum, k) => sum + (interestScore[k] || 0), 0)
    candidates.set(c.id, { ...c, keywordScore })
  }
  for (const c of similarCourses) {
    const existing = candidates.get(c.id)
    if (existing) existing.similarity = c.similarity
    else candidates.set(c.id, { ...c, keywords: [], keywordScore: 0, similarity: c.similarity })
  }

  const all = [...candidates.values()]
  const hasSimilarity = similarCourses.length > 0
  const kwRange = minMax(all.map((c) => c.keywordScore))
  const simRange = minMax(all.map((c) => c.similarity))
  const kwWeight = hasSimilarity ? KEYWORD_WEIGHT : 1
  const simWeight = hasSimilarity ? SIMILARITY_WEIGHT : 0

  const ranked = all
    .map((c) => ({
      ...c,
      _score: kwWeight * normalise(c.keywordScore, kwRange) + simWeight * normalise(c.similarity, simRange),
    }))
    .sort((a, b) => b._score - a._score)

  return diversify(dedupeCourses(ranked, seenKeys), limit).map(
    ({ _score, keywordScore, similarity, ...course }) => course
  )
}

// คอร์สที่ใกล้กับเวกเตอร์ความสนใจของ user ที่สุด (ไม่รวมคอร์สที่เคยเห็น)
const findSimilarToVector = async (embedding, excludeIds, limit) => {
  const vector = toVectorLiteral(embedding)
  return prisma.$queryRaw`
    SELECT c.id, c.title, c.category, c.university, c.price, c.status,
           c."thumbnailUrl", c.url,
           1 - (ce.embedding <=> ${vector}::vector) AS similarity
    FROM "CourseEmbedding" ce
    JOIN "Course" c ON c.id = ce."courseId"
    WHERE c.id <> ALL(${excludeIds}::text[])
    ORDER BY ce.embedding <=> ${vector}::vector
    LIMIT ${limit}
  `
}

const findCoursesByKeywords = (keywords, excludeIds) =>
  prisma.course.findMany({
    where: {
      id: { notIn: excludeIds },
      keywords: { some: { keyword: { in: keywords } } },
    },
    select: { ...COURSE_CARD_SELECT, keywords: { select: { keyword: true } } },
    take: 500,
  })

// แนะนำคอร์สตามพฤติกรรมของ user (ถ่วงน้ำหนักตามเวลา)
export const getPersonalizedCourses = async (userId, limit = 12) => {
  const profile = await getUserProfile(userId)

  const [keywordCourses, similarCourses] = await Promise.all([
    profile.keywordScores.length
      ? findCoursesByKeywords(profile.keywordScores.map((k) => k.keyword), profile.seenIds)
      : [],
    profile.embedding ? findSimilarToVector(profile.embedding, profile.seenIds, 60) : [],
  ])

  // user ใหม่ที่ยังไม่มีสัญญาณอะไรเลย → คอร์สยอดนิยม
  if (!keywordCourses.length && !similarCourses.length) {
    return getPopularCourses(limit)
  }

  return rankPersonalized({
    interests: profile.keywordScores,
    keywordCourses: keywordCourses.map((c) => ({ ...c, keywords: c.keywords.map((k) => k.keyword) })),
    similarCourses: similarCourses.map((c) => ({ ...c, similarity: Number(c.similarity) })),
    limit,
    seenKeys: profile.seenKeys,
  })
}

// อัปเดต UserInterest เมื่อ user interact กับคอร์ส
// น้ำหนักของแต่ละ action ดู constants/interaction.js
export const updateUserInterest = async (userId, courseId, action, searchKeyword) => {
  const score = weightOf(action)

  let keywords = []

  if (searchKeyword) {
    keywords = [{ keyword: searchKeyword }]
  } else {
    keywords = await prisma.courseKeyword.findMany({
      where: { courseId },
      select: { keyword: true },
    })
  }

  if (!keywords.length) return

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