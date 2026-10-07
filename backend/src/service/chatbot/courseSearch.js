import prisma from "../../lib/prisma.js"
import { COURSE_CARD_SELECT } from "../../constants/courseSelect.js"
import { getPersonalizedCourses } from "../recommendation.service.js"
import { getPopularCourses } from "../course.service.js"
import { translateToEng } from "../translate.service.js"

const CANDIDATE_LIMIT = 150
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
  return score
}

const searchByTopic = async ({ terms, group, price }) => {
  const matchTerm = (t) => [
    { title: { contains: t, mode: "insensitive" } },
    { description: { contains: t, mode: "insensitive" } },
    { keywords: { some: { keyword: { contains: t, mode: "insensitive" } } } },
  ]

  const candidates = await prisma.course.findMany({
    where: { ...priceWhere(price), OR: terms.flatMap(matchTerm) },
    select: { ...COURSE_CARD_SELECT, keywords: { select: { keyword: true } } },
    take: CANDIDATE_LIMIT,
  })

  const seenTitles = new Set()
  return candidates
    .map((c) => ({ ...c, keywords: c.keywords.map((k) => k.keyword) }))
    .map((c) => ({ course: c, score: scoreCourse(c, terms, group) }))
    .sort((a, b) => b.score - a.score)
    .map(({ course }) => course)
    .filter((c) => !seenTitles.has(c.title) && seenTitles.add(c.title))
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
export const searchCourses = async ({ userId, topic, terms, group, price, page = 1 }) => {
  if (terms.length) {
    const ranked = await searchByTopic({ terms, group, price })
    return { ...paginate(ranked, page), mode: "topic" }
  }

  if (group) {
    return { ...(await browseGroup({ group, price, page })), mode: "group" }
  }

  // ไม่ระบุหัวข้อ → แนะนำตามความสนใจของ user
  const personalised = (await getPersonalizedCourses(userId, 40)).filter((c) => priceMatches(price, c))
  return { ...paginate(personalised, page), mode: "personalised" }
}

// ไม่เจออะไรเลย → เสนอคอร์สยอดนิยมแทน
export const popularFallback = async (price) => {
  const popular = (await getPopularCourses(12)).filter((c) => priceMatches(price, c))
  return popular.slice(0, PAGE_SIZE)
}
