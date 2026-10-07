import { findGroup, isGroupName, getGroupById } from "./topics.js"
import { generate } from "./ollama.js"

const GREETING = /^(สวัสดี|หวัดดี|hello|hi|hey)(?=$|[\s!.,ครับค่ะคะ])/i

// ผู้ใช้ขอคอร์สชัดเจน
const EXPLICIT_REQUEST = /(คอร์ส|หลักสูตร|แนะนำ|อยากเรียน|อยากหา|อยากดู|หาเรียน|ขอแบบ|ดูหมวด|course|recommend)/i
// ถามความรู้ทั่วไป ไม่ได้ขอคอร์ส
const QUESTION = /(คืออะไร|คือ|อะไร|อย่างไร|ยังไง|ทำไม|เพราะอะไร|แตกต่าง|what is|what's|how |why |\?)/i
const FREE = /(ฟรี|free|ไม่เสียเงิน|ไม่มีค่าใช้จ่าย)/i
const PAID = /(เสียเงิน|มีค่าใช้จ่าย|paid)/i

// คำที่ไม่ใช่หัวข้อ → ตัดออกเพื่อเหลือแต่ topic
const FILLER = [
  "อยากเรียนรู้", "อยากเรียน", "อยากหาคอร์ส", "อยากหา", "อยากดู", "หาคอร์ส", "ขอคอร์ส", "มีคอร์ส", "แนะนำคอร์ส",
  "คอร์สไหนดี", "ขอแบบ", "ได้ไหม", "ได้มั้ย", "หน่อย", "เกี่ยวกับ", "หมวดอื่น", "ด้าน", "คอร์ส", "หลักสูตร", "แนะนำ",
  "ฟรี", "เสียเงิน", "ครับ", "ค่ะ",
  "i want to learn", "recommend", "courses", "course", "free", "paid", "about", "please",
].sort((a, b) => b.length - a.length)

const FILLER_RE = new RegExp(FILLER.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "gi")

export const extractTopic = (message) =>
  message
    .replace(FILLER_RE, " ")
    .replace(/[?!.,"'“”]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(เรียน|หมวด)\s*/, "") // "เรียน python" → "python" (ไม่ตัด "เรียน" กลางคำ)

// กฎล้วน ๆ (ไม่เรียก LLM)
// wantCourse: true | false | null (ไม่แน่ใจ → ให้ LLM ช่วยตัดสิน)
export const parseIntent = (message) => {
  const text = message.trim()

  if (GREETING.test(text) && text.length <= 20) {
    return { greeting: true, wantCourse: false, topic: "", price: "", group: null }
  }

  const price = FREE.test(text) ? "free" : PAID.test(text) ? "paid" : ""
  let topic = extractTopic(text)
  let group = findGroup(topic || text)

  // พิมพ์แค่ชื่อหมวด → เปิดดูทั้งหมวด
  if (group && topic && isGroupName(group, topic)) topic = ""

  const explicit = EXPLICIT_REQUEST.test(text)
  if (explicit) return { wantCourse: true, topic, price, group }
  if (QUESTION.test(text)) return { wantCourse: false, topic, price, group }
  if (price) return { wantCourse: true, topic, price, group } // "ขอฟรี"
  if (group) return { wantCourse: true, topic, price, group } // พิมพ์แค่ "python" / "ธุรกิจ"

  return { wantCourse: null, topic, price, group }
}

// ใช้ LLM เฉพาะตอนกฎตัดสินไม่ได้ — บังคับให้ตอบ JSON
const classifyWithLlm = async (message) => {
  const prompt = `ตอบเป็น JSON เท่านั้น รูปแบบ {"wantCourse":boolean,"topic":string}
wantCourse = true ถ้าผู้ใช้กำลังหาคอร์สเรียน/อยากเรียนอะไรบางอย่าง, false ถ้าแค่ถามความรู้ ทักทาย หรือคุยเล่น
topic = หัวข้อที่อยากเรียน สั้น ๆ (ว่างได้)

ข้อความ: ${JSON.stringify(message.slice(0, 300))}`

  try {
    const raw = await generate({ prompt, json: true, timeoutMs: 8000, options: { temperature: 0, num_predict: 60 } })
    const parsed = JSON.parse(raw)
    return {
      wantCourse: parsed.wantCourse === true,
      topic: typeof parsed.topic === "string" ? parsed.topic.trim() : "",
    }
  } catch (e) {
    console.error("classify error:", e.message)
    return { wantCourse: false, topic: "" }
  }
}

export const classifyIntent = async (message) => {
  const intent = parseIntent(message)
  if (intent.wantCourse !== null) return intent

  const llm = await classifyWithLlm(message)
  const topic = llm.topic || intent.topic
  return { ...intent, wantCourse: llm.wantCourse, topic, group: findGroup(topic) || intent.group }
}

export { getGroupById }
