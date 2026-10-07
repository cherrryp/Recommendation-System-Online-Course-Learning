import pkg from "@prisma/client"
import prisma from "../../lib/prisma.js"
import { COURSE_CARD_SELECT } from "../../constants/courseSelect.js"
import { getPersonalizedCourses } from "../recommendation.service.js"
import { getPopularCourses } from "../course.service.js"
import { translateToEng } from "../translate.service.js"
import { embedText, toVectorLiteral } from "../embedding.service.js"
import { dedupeCourses } from "../../utils/courseKey.js"

const { Prisma } = pkg

const CANDIDATE_LIMIT = 150
const SEMANTIC_LIMIT = 30
const SEMANTIC_MIN_SIMILARITY = 0.35 // ต่ำกว่านี้มักไม่เกี่ยวกัน
const SEMANTIC_BONUS = 6             // similarity 0.5 ≈ ตรงกับชื่อคอร์ส 1 ครั้ง
const PAGE_SIZE = 3

const priceWhere = (price) =>
  price === "free" ? { price: 0 } : price === "paid" ? { price: { gt: 0 } } : {}

const priceMatches = (price, course) =>
  price === "free" ? !course.price : price === "paid" ? course.price > 0 : true

const translations = new Map()

// หัวข้อ → คำค้นที่ใช้จริง (ไทยเดิม + อังกฤษ) เพราะ keyword ใน DB เป็นภาษาอังกฤษ
export const expandTopic = async (topic) => {
  const base = topic.trim().toLowerCase()
  if (!base) return []
  if (!translations.has(base)) translations.set(base, await translateToEng(base))
  return [...new Set([base, translations.get(base)].filter(Boolean))]
}

// pure function: ให้คะแนนความตรงของคอร์สกับคำค้น (ทดสอบง่าย)
export const scoreCourse = (course, terms, group) => {
  const title = course.title.toLowerCase()
  const keywords = (course.keywords || []).map((k) => k.toLowerCase())
  let score = 0.5 // อย่างน้อยต้องเจอใน description (ตอน query)

  for (const term of terms) {
    if (title.includes(term)) score += 3
    if (keywords.includes(term)) score += 2.5
    else if (keywords.some((k) => k.includes(term) || term.includes(k))) score += 1.5
  }
  if (group?.categories.includes(course.category)) score += 1.5
  if (course.similarity) score += course.similarity * SEMANTIC_BONUS
  return score
}

// คอร์สที่ความหมายใกล้กับหัวข้อ (ค้นด้วย embedding) — ค้นด้วยภาษาไทยก็เจอคอร์สที่ชื่อเป็นอังกฤษได้
const findSemanticMatches = async (topic, price) => {
  const embedding = await embedText(topic)
  if (!embedding) return []

  const vector = toVectorLiteral(embedding)
  const priceSql =
    price === "free" ? Prisma.sql`AND c.price = 0` : price === "paid" ? Prisma.sql`AND c.price > 0` : Prisma.empty

  const rows = await prisma.$queryRaw`
    SELECT c.id, c.title, c.category, c.university, c.price, c.status, c."thumbnailUrl", c.url,
           1 - (ce.embedding <=> ${vector}::vector) AS similarity
    FROM "CourseEmbedding" ce
    JOIN "Course" c ON c.id = ce."courseId"
    WHERE true ${priceSql}
    ORDER BY ce.embedding <=> ${vector}::vector
    LIMIT ${SEMANTIC_LIMIT}
  `
  return rows
    .map((r) => ({ ...r, similarity: Number(r.similarity) }))
    .filter((r) => r.similarity >= SEMANTIC_MIN_SIMILARITY)
}

const findKeywordMatches = async (terms, price) => {
  const matchTerm = (t) => [
    { title: { contains: t, mode: "insensitive" } },
    { description: { contains: t, mode: "insensitive" } },
    { keywords: { some: { keyword: { contains: t, mode: "insensitive" } } } },
  ]
  const courses = await prisma.course.findMany({
    where: { ...priceWhere(price), OR: terms.flatMap(matchTerm) },
    select: { ...COURSE_CARD_SELECT, keywords: { select: { keyword: true } } },
    take: CANDIDATE_LIMIT,
  })
  return courses.map((c) => ({ ...c, keywords: c.keywords.map((k) => k.keyword) }))
}

// รวมผล keyword + semantic แล้วจัดอันดับด้วย scoreCourse
// (pure ส่วนการรวม แยกไว้ให้ทดสอบได้)
export const mergeMatches = ({ keywordMatches, semanticMatches, terms, group }) => {
  const merged = new Map(keywordMatches.map((c) => [c.id, c]))
  for (const m of semanticMatches) {
    const existing = merged.get(m.id)
    if (existing) existing.similarity = m.similarity
    else merged.set(m.id, { ...m, keywords: [] })
  }
  const ranked = [...merged.values()]
    .map((c) => ({ course: c, score: scoreCourse(c, terms, group) }))
    .sort((a, b) => b.score - a.score)
    .map(({ course: { similarity, ...course } }) => course)
  return dedupeCourses(ranked)
}

const searchByTopic = async ({ topic, terms, group, price }) => {
  const [keywordMatches, semanticMatches] = await Promise.all([
    findKeywordMatches(terms, price),
    findSemanticMatches(topic, price).catch((e) => {
      console.error("semantic search failed:", e.message)
      return []
    }),
  ])
  return mergeMatches({ keywordMatches, semanticMatches, terms, group })
}

const browseGroup = async ({ group, price, page }) => {
  const where = { ...priceWhere(price), category: { in: group.categories } }
  const skip = (page - 1) * PAGE_SIZE
  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      select: COURSE_CARD_SELECT,
      skip,
      take: PAGE_SIZE,
      // ยอดนิยมก่อน (bookmark > interaction) แล้วค่อยเรียงตามใหม่สุด
      orderBy: [
        { bookmarks: { _count: "desc" } },
        { interactions: { _count: "desc" } },
        { createdAt: "desc" },
      ],
    }),
    prisma.course.count({ where }),
  ])
  return { courses, hasMore: skip + PAGE_SIZE < total }
}

const paginate = (list, page) => ({
  courses: list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
  hasMore: list.length > page * PAGE_SIZE,
})

// คืน { courses, hasMore, mode } — mode บอกว่าหามาจากไหน เพื่อให้ตอบข้อความได้เหมาะสม
export const searchCourses = async ({ userId, topic, group, price, page = 1 }) => {
  const terms = await expandTopic(topic)

  if (terms.length) {
    const ranked = await searchByTopic({ topic, terms, group, price })
    return { ...paginate(ranked, page), mode: "topic", terms }
  }

  if (group) {
    return { ...(await browseGroup({ group, price, page })), mode: "group", terms }
  }

  // ไม่ระบุหัวข้อ → แนะนำตามความสนใจของ user
  const personalised = (await getPersonalizedCourses(userId, 40)).filter((c) => priceMatches(price, c))
  return { ...paginate(personalised, page), mode: "personalised", terms }
}

// ไม่เจออะไรเลย → เสนอคอร์สยอดนิยมแทน
export const popularFallback = async (price) => {
  const popular = (await getPopularCourses(12)).filter((c) => priceMatches(price, c))
  return popular.slice(0, PAGE_SIZE)
}
