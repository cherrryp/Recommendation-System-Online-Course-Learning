import { classifyIntent } from "./chatbot/intent.js"
import { generate, checkOllamaHealth } from "./chatbot/ollama.js"
import { searchCourses, popularFallback } from "./chatbot/courseSearch.js"
import { updateUserInterest } from "./recommendation.service.js"
import { invalidateUser } from "../utils/ttlCache.js"

export { checkOllamaHealth }

const GREETING_REPLY = "สวัสดีครับ 😊 สนใจเรียนด้านไหน บอกได้เลย เดี๋ยวช่วยแนะนำคอร์สให้ครับ"
const UNAVAILABLE_REPLY = "ขออภัยครับ ตอบไม่ได้ตอนนี้ 🙏 ลองบอกหัวข้อที่อยากเรียน เดี๋ยวช่วยหาคอร์สให้ครับ"
const SAFE_REPLY = "สามารถแนะนำคอร์สจากมหาวิทยาลัยต่าง ๆ ได้ครับ ลองบอกหัวข้อที่สนใจ เช่น python, การตลาด, สุขภาพ"

// chatbot เป็นแค่ตัวกลางแนะนำคอร์ส ไม่ใช่เจ้าของคอร์ส/แพลตฟอร์ม
const CLAIMS_OWNERSHIP = /(ของเรา|ระบบของเรา|แพลตฟอร์มของเรา|SCB\s?10X)/i

const SYSTEM_PROMPT = `คุณคือผู้ช่วยแนะนำคอร์สเรียนออนไลน์จากหลายมหาวิทยาลัย คุณไม่ใช่เจ้าของคอร์สหรือแพลตฟอร์ม
กติกา: ตอบภาษาไทยเป็นกันเอง ไม่เกิน 3 ประโยค, ห้ามใช้คำว่า "ของเรา", ห้ามอ้างว่าเป็นเจ้าของคอร์ส`

const generateReply = async (message) => {
  try {
    const reply = await generate({
      prompt: `${SYSTEM_PROMPT}\n\nคำถามผู้ใช้: ${JSON.stringify(message.slice(0, 500))}\nคำตอบ:`,
      options: { temperature: 0.7, num_predict: 150 },
    })
    if (!reply) return UNAVAILABLE_REPLY
    return CLAIMS_OWNERSHIP.test(reply) ? SAFE_REPLY : reply
  } catch {
    return UNAVAILABLE_REPLY
  }
}

const describeTopic = (topic, group) => topic || group?.label || ""

const buildReply = ({ mode, topic, group, found }) => {
  const subject = describeTopic(topic, group)
  if (!found) {
    return subject
      ? `ยังไม่พบคอร์สเกี่ยวกับ "${subject}" ครับ ลองใช้คำอื่นดู หรือดูคอร์สยอดนิยมด้านล่างได้เลย 👇`
      : "ยังไม่พบคอร์สที่ตรงครับ ลองดูคอร์สยอดนิยมด้านล่างได้เลย 👇"
  }
  if (mode === "personalised") return "คอร์สเหล่านี้น่าจะตรงกับความสนใจของคุณ 👇"
  return `มีคอร์สแนะนำเกี่ยวกับ "${subject}" 👇`
}

// เก็บหัวข้อที่ถามใน chat เป็นความสนใจของ user ด้วย (ไม่รอ ไม่ให้ error กระทบคำตอบ)
const rememberInterest = (userId, terms) => {
  const keyword = terms[terms.length - 1]
  updateUserInterest(userId, null, "search", keyword)
    .then(() => invalidateUser(userId))
    .catch((e) =>
    console.error("remember interest error:", e.message)
  )
}

export const chat = async (userId, message, page = 1) => {
  const intent = await classifyIntent(message)
  const publicIntent = {
    wantCourse: intent.wantCourse,
    topic: intent.topic,
    price: intent.price,
    group: intent.group?.id ?? null,
  }

  if (intent.greeting) {
    return { reply: GREETING_REPLY, courses: [], hasMore: false, intent: publicIntent }
  }

  if (!intent.wantCourse) {
    return { reply: await generateReply(message), courses: [], hasMore: false, intent: publicIntent }
  }

  const result = await searchCourses({
    userId,
    topic: intent.topic,
    group: intent.group,
    price: intent.price,
    page,
  })

  if (result.courses.length) {
    if (result.mode === "topic" && page === 1) rememberInterest(userId, result.terms)
    return {
      reply: buildReply({ ...result, topic: intent.topic, group: intent.group, found: true }),
      courses: result.courses,
      hasMore: result.hasMore,
      intent: publicIntent,
    }
  }

  const fallback = page === 1 ? await popularFallback(intent.price) : []
  return {
    reply: buildReply({ ...result, topic: intent.topic, group: intent.group, found: false }),
    courses: fallback,
    hasMore: false,
    intent: publicIntent,
  }
}
