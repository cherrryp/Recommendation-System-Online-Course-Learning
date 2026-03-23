import prisma from "../lib/prisma.js"

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434"
const MODEL = "scb10x/llama3.2-typhoon2-3b-instruct"

const CATEGORIES = [
  "Digital & Technology", "Health & Medicine", "Business & Management",
  "Arts & Design", "Agriculture", "Science", "Education",
  "Law", "Language & Communication", "Engineering", "Social Sciences",
]

const classifyIntent = async (message) => {
  const prompt = `วิเคราะห์ข้อความแล้วตอบเป็น JSON เท่านั้น ห้ามพูดอื่นเด็ดขาด

หมวดหมู่ที่มี: ${CATEGORIES.join(", ")}

ตัวอย่าง:
"อยากเรียน python" → {"category":"Digital & Technology","price":"","reply":"มีคอร์สด้านเทคโนโลยีแนะนำเลยครับ 👇"}
"ลูกสาวเรียนพยาบาล" → {"category":"Health & Medicine","price":"","reply":"มีคอร์สด้านสุขภาพน่าสนใจเลยครับ 👇"}
"ขอคอร์สฟรี" → {"category":"","price":"free","reply":"มีคอร์สฟรีแนะนำเลยครับ 👇"}
"สวัสดี" → {"category":"","price":"","reply":"สวัสดีครับ! สนใจเรียนด้านไหนบ้างครับ? 😊"}
"ขอบคุณ" → {"category":"","price":"","reply":"ยินดีครับ! มีอะไรให้ช่วยอีกไหมครับ? 😊"}

ข้อความ: "${message}"
JSON:`

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        stream: false,
        options: { temperature: 0.1, num_predict: 80 },
      }),
    })

    if (!response.ok) throw new Error("Ollama error")

    const data = await response.json()
    const match = (data.response || "").match(/\{[\s\S]*?\}/)
    if (match) return JSON.parse(match[0])
  } catch (e) {
    console.error("classify error:", e)
  }

  // fallback
  return { category: "", price: "", reply: "สนใจเรียนด้านไหนครับ? 😊" }
}

const findCourses = async (category, price, page = 1, limit = 3) => {
  const skip = (page - 1) * limit
  const where = {
    ...(category && { category: { equals: category, mode: "insensitive" } }),
    ...(price === "free" && { price: 0 }),
    ...(price === "paid" && { price: { gt: 0 } }),
  }

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      select: {
        id: true, title: true, category: true,
        university: true, url: true, price: true, thumbnailUrl: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.course.count({ where }),
  ])

  return { courses, total, hasMore: skip + limit < total }
}

export const chat = async (userId, message, page = 1) => {
  // 1. classify intent
  const intent = await classifyIntent(message)

  // 2. ถ้าไม่มี category/price → คุยทั่วไป
  if (!intent.category && !intent.price) {
    return { reply: intent.reply, courses: [], hasMore: false, intent }
  }

  // 3. query DB
  const { courses, hasMore } = await findCourses(intent.category, intent.price, page)

  const reply = courses.length > 0
    ? intent.reply
    : "ขออภัยครับ ไม่พบคอร์สที่ตรงในระบบ ลองถามใหม่ด้วยคำอื่นได้เลยครับ 🙏"

  return { reply, courses, hasMore, intent }
}

export const checkOllamaHealth = async () => {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`)
    const data = await res.json()
    const hasModel = data.models?.some((m) => m.name.includes("typhoon"))
    return { running: true, hasModel }
  } catch {
    return { running: false, hasModel: false }
  }
}