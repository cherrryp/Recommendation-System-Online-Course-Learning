import { getRecommendedCourses, getPersonalizedCourses } from "./recommendation.service.js"
import { getTrendingCourses, getExploreCourses } from "./course.service.js"
import { getUserProfile } from "./userProfile.js"
import { dedupeCourses } from "../utils/courseKey.js"
import { memo } from "../utils/ttlCache.js"

const ROW_SIZE = 8
const HOME_TTL_MS = 60 * 1000
const MAX_TITLE_LENGTH = 40

const shorten = (text) =>
  text.length > MAX_TITLE_LENGTH ? `${text.slice(0, MAX_TITLE_LENGTH)}…` : text

// "เพราะคุณสนใจ X": คอร์สที่คล้ายกับคอร์สที่ user เพิ่งสนใจล่าสุด/มากที่สุด
const becauseYouLiked = async (profile) => {
  if (!profile.anchor) return null
  const similar = await getRecommendedCourses(profile.anchor.id, 40)
  const courses = dedupeCourses(similar, profile.seenKeys).slice(0, ROW_SIZE)
  return courses.length
    ? { id: "because", title: `เพราะคุณสนใจ "${shorten(profile.anchor.title)}"`, courses }
    : null
}

const row = (id, title, courses) => (courses?.length ? { id, title, courses } : null)

// แถวหน้าแรกแบบ Netflix/YouTube: แนะนำสำหรับคุณ → เพราะคุณสนใจ → กำลังมาแรง → ลองสิ่งใหม่
export const getHomeRows = (userId) =>
  memo(`user:${userId}:home`, HOME_TTL_MS, async () => {
    const profile = await getUserProfile(userId)

    const [forYou, because, trending, explore] = await Promise.all([
      profile.hasSignal ? getPersonalizedCourses(userId, ROW_SIZE) : [],
      becauseYouLiked(profile),
      getTrendingCourses(ROW_SIZE),
      profile.categories.length ? getExploreCourses(profile.categories, ROW_SIZE) : [],
    ])

    return [
      row("for-you", "แนะนำสำหรับคุณ", forYou),
      because,
      row("trending", "กำลังมาแรง", trending),
      row("explore", "ลองเรียนสิ่งใหม่", explore),
    ].filter(Boolean)
  })
