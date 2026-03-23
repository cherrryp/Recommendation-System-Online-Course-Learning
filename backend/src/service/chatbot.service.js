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

// ค้นหาคอร์สใกล้เคียงด้วย keyword จาก message
const findSimilarCourses = async (message, limit = 3) => {
  const words = message.split(/\s+/).filter((w) => w.length > 1)
  
  const courses = await prisma.course.findMany({
    where: {
      OR: [
        ...words.map((w) => ({ title: { contains: w, mode: "insensitive" } })),
        ...words.map((w) => ({ description: { contains: w, mode: "insensitive" } })),
        ...words.map((w) => ({ keywords: { some: { keyword: { contains: w, mode: "insensitive" } } } })),
      ],
    },
    select: {
      id: true, title: true, category: true,
      university: true, url: true, price: true, thumbnailUrl: true,
    },
    take: limit,
  })

  return courses
}

export const chat = async (userId, message, page = 1) => {
  const intent = await classifyIntent(message)

  // คุยทั่วไป ไม่เกี่ยวคอร์ส
  if (!intent.category && !intent.price) {
    return { reply: intent.reply, courses: [], hasMore: false, intent }
  }

  // query ตาม intent
  const { courses, hasMore } = await findCourses(intent.category, intent.price, page)

  if (courses.length > 0) {
    return { reply: intent.reply, courses, hasMore, intent }
  }

  // ไม่เจอ -> หาใกล้เคียงจาก keyword ใน message
  const similar = await findSimilarCourses(message)

  if (similar.length > 0) {
    return {
      reply: `ไม่พบคอร์สที่ตรงเป๊ะครับ แต่มีคอร์สใกล้เคียงที่น่าสนใจ 👇`,
      courses: similar,
      hasMore: false,
      intent,
    }
  }

  // ไม่เจอจริงๆ -> แนะนำ random จาก category ยอดนิยม
  const popular = await prisma.course.findMany({
    where: { category: "Digital & Technology" },
    select: {
      id: true, title: true, category: true,
      university: true, url: true, price: true, thumbnailUrl: true,
    },
    take: 3,
    orderBy: { createdAt: "desc" },
  })

  return {
    reply: `ไม่พบคอร์สที่ตรงครับ แต่มีคอร์สยอดนิยมแนะนำ 👇`,
    courses: popular,
    hasMore: false,
    intent,
  }
}

// export const chat = async (userId, message, page = 1) => {
//   // 1. classify intent
//   const intent = await classifyIntent(message)

//   // 2. ถ้าไม่มี category/price → คุยทั่วไป
//   if (!intent.category && !intent.price) {
//     return { reply: intent.reply, courses: [], hasMore: false, intent }
//   }

//   // 3. query DB
//   const { courses, hasMore } = await findCourses(intent.category, intent.price, page)

//   const reply = courses.length > 0
//     ? intent.reply
//     : "ขออภัยครับ ไม่พบคอร์สที่ตรงในระบบ ลองถามใหม่ด้วยคำอื่นได้เลยครับ 🙏"

//   return { reply, courses, hasMore, intent }
// }

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