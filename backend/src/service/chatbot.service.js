import prisma from "../lib/prisma.js"

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434"
const MODEL = "typhoon2" // ติดตั้งก่อนด้วย: ollama pull typhoon2

// ดึงคอร์สที่เกี่ยวข้องกับ message ของ user
const findRelevantCourses = async (message, limit = 5) => {
  const courses = await prisma.course.findMany({
    where: {
      OR: [
        { title: { contains: message, mode: "insensitive" } },
        { description: { contains: message, mode: "insensitive" } },
        { category: { contains: message, mode: "insensitive" } },
        { keywords: { some: { keyword: { contains: message, mode: "insensitive" } } } },
      ],
    },
    select: {
      id: true,
      title: true,
      category: true,
      university: true,
      description: true,
      url: true,
      price: true,
    },
    take: limit,
  })
  return courses
}

// ส่งข้อความไป Ollama
export const chat = async (userId, message, history = []) => {
  // ดึงคอร์สที่เกี่ยวข้อง
  const relevantCourses = await findRelevantCourses(message)

  // ดึง interest ของ user
  const interests = await prisma.userInterest.findMany({
    where: { userId },
    orderBy: { score: "desc" },
    take: 5,
    select: { keyword: true },
  })
  const interestKeywords = interests.map((i) => i.keyword).join(", ")

  const courseList = relevantCourses.length
    ? relevantCourses
        .map(
          (c, i) =>
            `${i + 1}. ${c.title} (${c.university}) - ${c.category} - ${
              c.price === 0 ? "ฟรี" : `${c.price} บาท`
            }\n   URL: ${c.url}\n   ${c.description?.slice(0, 100)}...`
        )
        .join("\n\n")
    : "ไม่พบคอร์สที่ตรงกับคำค้นหา"

  const systemPrompt = `คุณคือ AI ผู้ช่วยแนะนำคอร์สเรียนออนไลน์จากมหาวิทยาลัยไทย
ตอบภาษาไทยเสมอ กระชับ เป็นมิตร และมีประโยชน์

ความสนใจของผู้ใช้: ${interestKeywords || "ยังไม่มีข้อมูล"}

คอร์สที่เกี่ยวข้องกับคำถาม:
${courseList}

กฎสำคัญ:
- แนะนำเฉพาะคอร์สที่อยู่ในรายการข้างต้นเท่านั้น
- ระบุชื่อคอร์ส มหาวิทยาลัย และ URL เสมอ
- ถ้าไม่มีคอร์สที่ตรง ให้บอกตรงๆ และแนะนำให้ลองค้นหาด้วยคำอื่น
- ห้ามแต่งคอร์สที่ไม่มีในระบบขึ้นมาเอง`

  // แปลง history เป็น format ของ Ollama
  const messages = [
    ...history.slice(-6).map((h) => ({
      role: h.role,
      content: h.content,
    })),
    { role: "user", content: message },
  ]

  // เรียก Ollama API
  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      system: systemPrompt,
      messages,
      stream: false,
      options: {
        temperature: 0.7,
        num_predict: 1024,
      },
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Ollama error: ${err}`)
  }

  const data = await response.json()
  const reply = data.message?.content || "ขออภัย ไม่สามารถตอบได้ในขณะนี้"

  return {
    reply,
    courses: relevantCourses.map((c) => ({
      id: c.id,
      title: c.title,
      university: c.university,
      url: c.url,
    })),
  }
}

// เช็คว่า Ollama รันอยู่ไหม (ใช้ใน health check)
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
