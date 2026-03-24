import prisma from "../lib/prisma.js"

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434"
const MODEL = "scb10x/llama3.2-typhoon2-3b-instruct"

const CATEGORIES = [
  "Digital & Technology", "Health & Medicine", "Business & Management",
  "Arts & Design", "Agriculture", "Science", "Education",
  "Law", "Language & Communication", "Engineering", "Social Sciences",
]

const KEYWORD_CATEGORY_MAP = {
  "โปรแกรม": "Digital & Technology",
  "code": "Digital & Technology", 
  "python": "Digital & Technology",
  "javascript": "Digital & Technology",
  "เว็บ": "Digital & Technology",
  "พยาบาล": "Health & Medicine",
  "หมอ": "Health & Medicine",
  "ธุรกิจ": "Business & Management",
  "การตลาด": "Business & Management",
  "กฎหมาย": "Law",
  "ภาษา": "Language & Communication",
  "อังกฤษ": "Language & Communication",
}

const keywordClassify = (message) => {
  const lower = message.toLowerCase()
  for (const [kw, cat] of Object.entries(KEYWORD_CATEGORY_MAP)) {
    if (lower.includes(kw)) return cat
  }
  return null
}

// ─── 1. classify intent ────────────────────────────────────────────────────

const classifyIntent = async (message) => {
  // ลอง keyword ก่อน เร็วกว่าและแม่นกว่า
  const quickCategory = keywordClassify(message)

  const prompt = `วิเคราะห์ข้อความแล้วตอบเป็น JSON เท่านั้น ห้ามพูดอื่นเด็ดขาด
  หมวดหมู่: ${CATEGORIES.join(", ")}

  wantCourse = true ถ้าข้อความมีคำว่า แนะนำ/อยากเรียน/หาคอร์ส/ขอคอร์ส/มีคอร์ส/คอร์สไหนดี

  ตัวอย่าง:
  "อยากเรียน python" → {"wantCourse":true,"category":"Digital & Technology","price":"","reply":""}
  "แนะนำคอร์สฟรีหน่อย" → {"wantCourse":true,"category":"","price":"free","reply":""}
  "python คืออะไร" → {"wantCourse":false,"category":"","price":"","reply":""}
  "สวัสดี" → {"wantCourse":false,"category":"","price":"","reply":""}

  ข้อความ: "${message}"
  JSON:`

  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        stream: false,
        options: { temperature: 0.1, num_predict: 80 },
      }),
    })
    if (!res.ok) throw new Error("Ollama error")
    const data = await res.json()
    const match = (data.response || "").match(/\{[\s\S]*?\}/)
    if (match) {
      const intent = JSON.parse(match[0])
      // ถ้า Ollama classify category ว่าง แต่ keyword เจอ → ใช้ keyword แทน
      if (!intent.category && quickCategory) {
        intent.category = quickCategory
        intent.wantCourse = true  // ← มี keyword แปลว่าอยากได้คอร์ส
      }
      return intent
    }
  } catch (e) {
    console.error("classify error:", e)
  }
  // fallback — ถ้า Ollama ล้มเหลวทั้งหมด
  return {
    wantCourse: !!quickCategory,
    category: quickCategory || "",
    price: "",
    reply: ""
  }
}

// ─── 2. ตอบแบบ AI ทั่วไป ────────────────────────────────────────────────────

const generateReply = async (message) => {
  const prompt = `คุณคือผู้ช่วยแนะนำคอร์สเรียนออนไลน์ (Aggregator) 
    คุณไม่ใช่เจ้าของคอร์ส และไม่ใช่แพลตฟอร์มการเรียน

    ข้อสำคัญ:
    - ห้ามพูดว่า "ระบบของเรา", "แพลตฟอร์มของเรา", "คอร์สของเรา", "ของเรา", "แพลตฟอร์มของเรา", "ระบบของเรา"
    - ให้ใช้คำว่า "มีคอร์สแนะนำ", "แนะนำคอร์ส", "สามารถพาไปยังเว็บไซต์ผู้ให้บริการ"
    - ตอบสั้น กระชับ ไม่เกิน 3 ประโยค
    - ห้ามแอบอ้างว่าเป็นเจ้าของคอร์สหรือแพลตฟอร์มเด็ดขาดๆ
    - ห้ามอ้างว่าเป็นเจ้าของคอร์สหรือผู้ให้บริการ

    แนวทางตอบ:
    - ตอบกลาง ๆ เช่น "สามารถแนะนำคอร์สได้"
    - ใช้ภาษาธรรมชาติ เป็นกันเอง
    - ไม่เกิน 2-3 ประโยค

    คำถาม: ${message}
    คำตอบ:`


  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        stream: false,
        options: { temperature: 0.7, num_predict: 150 },
      }),
    })
    if (!res.ok) throw new Error()
    const data = await res.json()
    let reply = (data.response || "").trim()

    //sanitize กันหลุด
    reply = reply
      .replace(/SCB\s?10X|SCB/gi, "")
      .replace(/แพลตฟอร์มของเรา|ระบบของเรา|ของเรา/gi, "")
      .replace(/เว็บไซต์ผู้ให้บริการ/gi, "")
      .replace(/ยินดีต้อนรับ.*?\n?/gi, "")

    return reply
  } catch {
    return "ขออภัยครับ ตอบไม่ได้ตอนนี้ 🙏"
  }
}

// ─── 3. หาคอร์ส ────────────────────────────────────────────────────────────

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
      select: { id: true, title: true, category: true, university: true, url: true, price: true, thumbnailUrl: true },
      skip, take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.course.count({ where }),
  ])
  return { courses, total, hasMore: skip + limit < total }
}

const findSimilarCourses = async (message, limit = 3) => {
  const words = message.split(/\s+/).filter((w) => w.length > 1)
  return prisma.course.findMany({
    where: {
      OR: [
        ...words.map((w) => ({ title: { contains: w, mode: "insensitive" } })),
        ...words.map((w) => ({ keywords: { some: { keyword: { contains: w, mode: "insensitive" } } } })),
      ],
    },
    select: { id: true, title: true, category: true, university: true, url: true, price: true, thumbnailUrl: true },
    take: limit,
  })
}

// ─── 4. main chat ───────────────────────────────────────────────────────────

export const chat = async (userId, message, page = 1) => {
  const intent = await classifyIntent(message)

  if (/^(สวัสดี|hello|hi)/i.test(message.trim())) {
    return {
      reply: "สวัสดีครับ 😊 สนใจเรียนด้านไหน บอกได้เลย เดี๋ยวช่วยแนะนำคอร์สให้ครับ",
      courses: [],
      hasMore: false,
      intent: { wantCourse: false }
    }
  }

  // ไม่ต้องการคอร์ส → ตอบ AI ทั่วไป
  if (!intent.wantCourse) {
    const reply = await generateReply(message)
    return { reply, courses: [], hasMore: false, intent }
  }

  // ต้องการคอร์ส → หาคอร์ส
  const { courses, hasMore } = await findCourses(intent.category, intent.price, page)
  if (courses.length > 0) {
    return {
      reply: `มีคอร์สแนะนำเลยครับ 👇`,
      courses, hasMore, intent,
    }
  }

  // หาไม่เจอ → ลอง similar
  const similar = await findSimilarCourses(message)
  if (similar.length > 0) {
    return {
      reply: `ไม่พบคอร์สที่ตรงเป๊ะครับ แต่มีคอร์สใกล้เคียง 👇`,
      courses: similar, hasMore: false, intent,
    }
  }

  return {
    reply: `ไม่พบคอร์สที่ตรงครับ ลองถามใหม่ด้วยคำอื่นได้เลย 🙏`,
    courses: [], hasMore: false, intent,
  }
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

