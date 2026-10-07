import prisma from "../lib/prisma.js"
import { COURSE_CARD_SELECT } from "../constants/courseSelect.js"
import { INTERACTION_WEIGHT, weightOf } from "../constants/interaction.js"
import { getPopularCourses } from "./course.service.js"

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
// ผสม 2 สัญญาณ: (1) keyword ที่ user สนใจ  (2) ความคล้ายของ embedding กับคอร์สที่ user เคยกด/bookmark

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

const titleKey = (title) => title.trim().toLowerCase()

// pure function (ทดสอบง่าย)
// interests: [{ keyword, score }]
// keywordCourses: [{ ...course, keywords: string[] }]
// similarCourses: [{ ...course, similarity }]  (จาก embedding profile ของ user)
export const rankPersonalized = ({ interests, keywordCourses, similarCourses, limit, seenTitles = [] }) => {
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

  // ข้อมูลมีคอร์สชื่อซ้ำกันหลาย id → เก็บอันดับแรกเท่านั้น และตัดชื่อที่ user เคยเห็นแล้ว
  const taken = new Set(seenTitles.map(titleKey))
  const unique = ranked.filter((c) => {
    const key = titleKey(c.title)
    if (taken.has(key)) return false
    taken.add(key)
    return true
  })

  return diversify(unique, limit).map(
    ({ _score, keywordScore, similarity, ...course }) => course
  )
}

// embedding เฉลี่ยของคอร์สที่ user เคยกด (x1) และ bookmark (x3) → หาคอร์สที่ใกล้ที่สุด
// ไม่รวมคอร์สที่ user เคยเห็นแล้ว
const findSimilarToUserHistory = async (userId, limit) => {
  const click = INTERACTION_WEIGHT.click
  const bookmark = INTERACTION_WEIGHT.bookmark

  return prisma.$queryRaw`
    WITH events AS (
      SELECT "courseId", ${bookmark}::int AS w FROM "Bookmark" WHERE "userId" = ${userId}
      UNION ALL
      SELECT "courseId", ${click}::int AS w FROM "UserInteraction"
      WHERE "userId" = ${userId} AND "courseId" IS NOT NULL AND action = 'click'
    ),
    profile AS (
      SELECT AVG(ce.embedding) AS v
      FROM events e
      JOIN "CourseEmbedding" ce ON ce."courseId" = e."courseId"
      CROSS JOIN LATERAL generate_series(1, e.w)
    )
    SELECT c.id, c.title, c.category, c.university, c.price, c.status,
           c."thumbnailUrl", c.url,
           1 - (ce.embedding <=> profile.v) AS similarity
    FROM profile
    JOIN "CourseEmbedding" ce ON profile.v IS NOT NULL
    JOIN "Course" c ON c.id = ce."courseId"
    WHERE c.id NOT IN (SELECT "courseId" FROM events)
    ORDER BY ce.embedding <=> profile.v
    LIMIT ${limit}
  `
}

// คอร์สที่ user เคย bookmark / กด → { ids, titles }
const findSeenCourses = async (userId) => {
  const course = { select: { id: true, title: true } }
  const [bookmarks, clicks] = await Promise.all([
    prisma.bookmark.findMany({ where: { userId }, select: { course } }),
    prisma.userInteraction.findMany({
      where: { userId, courseId: { not: null } },
      select: { course },
      distinct: ["courseId"],
    }),
  ])
  const seen = [...bookmarks, ...clicks].map((r) => r.course).filter(Boolean)
  return { ids: seen.map((c) => c.id), titles: seen.map((c) => c.title) }
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

// แนะนำคอร์สตาม UserInterest + พฤติกรรมของ user
export const getPersonalizedCourses = async (userId, limit = 12) => {
  const [interests, seen] = await Promise.all([
    prisma.userInterest.findMany({
      where: { userId },
      orderBy: { score: "desc" },
      take: 10,
    }),
    findSeenCourses(userId),
  ])
  const seenIds = seen.ids

  const [keywordCourses, similarCourses] = await Promise.all([
    interests.length
      ? findCoursesByKeywords(interests.map((i) => i.keyword), seenIds)
      : [],
    seenIds.length ? findSimilarToUserHistory(userId, 50) : [],
  ])

  // user ใหม่ที่ยังไม่มีสัญญาณอะไรเลย → คอร์สยอดนิยม
  if (!keywordCourses.length && !similarCourses.length) {
    return getPopularCourses(limit)
  }

  return rankPersonalized({
    interests,
    keywordCourses: keywordCourses.map((c) => ({ ...c, keywords: c.keywords.map((k) => k.keyword) })),
    similarCourses: similarCourses.map((c) => ({ ...c, similarity: Number(c.similarity) })),
    limit,
    seenTitles: seen.titles,
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