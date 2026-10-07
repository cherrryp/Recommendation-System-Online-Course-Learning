import prisma from "../lib/prisma.js"
import { weightOf } from "../constants/interaction.js"
import { courseGroupKey } from "../utils/courseKey.js"
import { memo } from "../utils/ttlCache.js"
import { parseVector } from "./embedding.service.js"

// โปรไฟล์ของ user สร้างจาก event log (bookmark + click) โดยให้น้ำหนักกิจกรรมล่าสุดมากกว่า
// กิจกรรมเมื่อ 30 วันก่อนมีน้ำหนักครึ่งหนึ่ง, 60 วันก่อนเหลือหนึ่งในสี่ ... (เหมือนที่ Netflix/YouTube
// ให้ความสำคัญกับสิ่งที่เพิ่งดูมากกว่าสิ่งที่ดูนานแล้ว)
const HALF_LIFE_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000
const PROFILE_TTL_MS = 60 * 1000
const TOP_KEYWORDS = 10
// UserInterest เก็บทั้งคำที่ user เลือกเองและคำที่ค้นหา (ไม่มีเวลา → ไม่ decay) ให้เป็นความจำระยะยาวน้ำหนักเบา
const LONG_TERM_INTEREST_SHARE = 0.25

export const decayFactor = (at, now = Date.now()) =>
  Math.pow(0.5, Math.max(0, now - new Date(at).getTime()) / (HALF_LIFE_DAYS * DAY_MS))

const normalise = (vector) => {
  const norm = Math.hypot(...vector)
  return norm === 0 ? vector : vector.map((v) => v / norm)
}

// pure function (ทดสอบง่าย)
// events: [{ at, action, course: { id, title, category, keywords: string[], embedding?: number[] } }]
// interests: [{ keyword, score }]
export const computeProfile = ({ events, interests = [], now = Date.now() }) => {
  const keywordScores = new Map()
  const seenIds = new Set()
  const seenKeys = new Set()
  const categories = new Set()
  let embeddingSum = null
  let anchor = null // เหตุการณ์ที่ "แรง + ใหม่" ที่สุด ใช้เป็นฐานของแถว "เพราะคุณสนใจ ..."

  for (const { at, action, course } of events) {
    if (!course) continue
    const weight = weightOf(action) * decayFactor(at, now)

    seenIds.add(course.id)
    seenKeys.add(courseGroupKey(course.title))
    categories.add(course.category)

    for (const keyword of course.keywords) {
      keywordScores.set(keyword, (keywordScores.get(keyword) || 0) + weight)
    }

    if (course.embedding) {
      embeddingSum ??= new Array(course.embedding.length).fill(0)
      course.embedding.forEach((v, i) => (embeddingSum[i] += v * weight))
    }

    if (!anchor || weight > anchor.weight) anchor = { weight, course }
  }

  for (const { keyword, score } of interests) {
    keywordScores.set(keyword, (keywordScores.get(keyword) || 0) + score * LONG_TERM_INTEREST_SHARE)
  }

  return {
    keywordScores: [...keywordScores]
      .map(([keyword, score]) => ({ keyword, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_KEYWORDS),
    embedding: embeddingSum ? normalise(embeddingSum) : null,
    seenIds: [...seenIds],
    seenKeys: [...seenKeys],
    categories: [...categories],
    anchor: anchor?.course ?? null,
    hasSignal: events.length > 0 || interests.length > 0,
  }
}

const COURSE_FIELDS = {
  id: true, title: true, category: true,
  keywords: { select: { keyword: true } },
}

const loadEvents = async (userId) => {
  const [bookmarks, clicks, interests] = await Promise.all([
    prisma.bookmark.findMany({
      where: { userId },
      select: { createdAt: true, course: { select: COURSE_FIELDS } },
    }),
    prisma.userInteraction.findMany({
      where: { userId, action: "click", courseId: { not: null } },
      select: { createdAt: true, course: { select: COURSE_FIELDS } },
    }),
    prisma.userInterest.findMany({ where: { userId }, select: { keyword: true, score: true } }),
  ])

  const toEvent = (action) => ({ createdAt, course }) => ({
    at: createdAt,
    action,
    course: course && { ...course, keywords: course.keywords.map((k) => k.keyword) },
  })
  const events = [...bookmarks.map(toEvent("bookmark")), ...clicks.map(toEvent("click"))].filter((e) => e.course)

  // embedding ของคอร์สที่เกี่ยวข้อง (ใช้เฉลี่ยเป็นเวกเตอร์ความสนใจ)
  const ids = [...new Set(events.map((e) => e.course.id))]
  if (ids.length) {
    const rows = await prisma.$queryRaw`
      SELECT "courseId", embedding::text AS embedding FROM "CourseEmbedding" WHERE "courseId" = ANY(${ids}::text[])
    `
    const byId = new Map(rows.map((r) => [r.courseId, parseVector(r.embedding)]))
    events.forEach((e) => (e.course.embedding = byId.get(e.course.id)))
  }

  return { events, interests }
}

// cache 1 นาทีต่อ user — invalidateUser() ล้างให้เมื่อมี interaction ใหม่
export const getUserProfile = (userId) =>
  memo(`user:${userId}:profile`, PROFILE_TTL_MS, async () => computeProfile(await loadEvents(userId)))
