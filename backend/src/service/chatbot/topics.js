// กลุ่มหัวข้อที่ chatbot รู้จัก
// categories = ชื่อหมวดที่มีอยู่จริงใน DB (Course.category)
// names      = คำที่หมายถึงหมวดนั้นตรง ๆ  (ถ้าผู้ใช้พิมพ์แค่นี้ → เปิดดูทั้งหมวด)
// hints      = คำหัวข้อย่อยที่บอกว่าน่าจะอยู่หมวดนี้ (ใช้ให้คะแนนเพิ่มตอนค้นหา)
export const TOPIC_GROUPS = [
  {
    id: "tech",
    label: "เทคโนโลยี",
    categories: ["Digital & Technology", "Programming & Software Development", "Data & AI", "Data Analytics & Data Science"],
    names: ["เทคโนโลยี", "ไอที", "คอมพิวเตอร์", "ดิจิทัล", "technology", "digital", "it"],
    hints: ["python", "javascript", "java", "code", "coding", "programming", "โปรแกรม", "เว็บ", "ai", "data", "ข้อมูล", "excel"],
  },
  {
    id: "health",
    label: "สุขภาพ",
    categories: ["Medical & Health", "Health & Medicine"],
    names: ["สุขภาพ", "การแพทย์", "แพทย์", "health", "medical"],
    hints: ["พยาบาล", "หมอ", "ยา", "โรค", "โภชนาการ", "nurse", "nursing"],
  },
  {
    id: "business",
    label: "ธุรกิจ",
    categories: ["Business & Management"],
    names: ["ธุรกิจ", "บริหาร", "การจัดการ", "business", "management"],
    hints: ["การตลาด", "บัญชี", "การเงิน", "ผู้ประกอบการ", "marketing", "finance", "startup"],
  },
  {
    id: "arts",
    label: "ศิลปะและการออกแบบ",
    categories: ["Arts & Culture", "Art & Design"],
    names: ["ศิลปะ", "ออกแบบ", "ศิลปวัฒนธรรม", "วัฒนธรรม", "art", "design"],
    hints: ["ดนตรี", "วาดภาพ", "ภาพถ่าย", "music"],
  },
  {
    id: "agri",
    label: "เกษตรและสิ่งแวดล้อม",
    categories: ["Agriculture & Environment"],
    names: ["เกษตร", "สิ่งแวดล้อม", "agriculture", "environment"],
    hints: ["พืช", "ปลูก", "ฟาร์ม", "สัตว์", "ดิน"],
  },
  {
    id: "science",
    label: "วิทยาศาสตร์และคณิตศาสตร์",
    categories: ["Science & Mathematics", "Natural Science & Mathematics"],
    names: ["วิทยาศาสตร์", "คณิตศาสตร์", "science", "math", "maths"],
    hints: ["ฟิสิกส์", "เคมี", "ชีววิทยา", "สถิติ"],
  },
  {
    id: "education",
    label: "การศึกษา",
    categories: ["Education & Teaching"],
    names: ["การศึกษา", "การสอน", "ครู", "education", "teaching"],
    hints: ["วิจัย", "หลักสูตร"],
  },
  {
    id: "law",
    label: "กฎหมายและสังคม",
    categories: ["Law & Social Science"],
    names: ["กฎหมาย", "นิติ", "law"],
    hints: ["สิทธิ", "ภาษี"],
  },
  {
    id: "language",
    label: "ภาษาและการสื่อสาร",
    categories: ["Language & Communication"],
    names: ["ภาษา", "การสื่อสาร", "language", "communication"],
    hints: ["อังกฤษ", "จีน", "ญี่ปุ่น", "english", "chinese", "japanese", "พูด", "เขียน"],
  },
  {
    id: "social",
    label: "สังคมและมนุษยศาสตร์",
    categories: ["Social & Humanities"],
    names: ["สังคม", "มนุษยศาสตร์", "humanities"],
    hints: ["ประวัติศาสตร์", "ปรัชญา", "history"],
  },
]

export const getGroupById = (id) => TOPIC_GROUPS.find((g) => g.id === id) || null

// คำภาษาอังกฤษสั้น ๆ ต้องตรงทั้งคำ (กัน "it" ไปติดใน "with") ส่วนภาษาไทยใช้ includes
export const containsTerm = (text, term) =>
  /^[a-z0-9 ]+$/i.test(term)
    ? new RegExp(`(^|[^a-z0-9])${term}([^a-z0-9]|$)`, "i").test(text)
    : text.includes(term)

// หา group จากข้อความ: "name" ตรงถือว่าชัดกว่า "hint"
export const findGroup = (text) => {
  const lower = text.toLowerCase()
  return (
    TOPIC_GROUPS.find((g) => g.names.some((n) => containsTerm(lower, n))) ||
    TOPIC_GROUPS.find((g) => g.hints.some((h) => containsTerm(lower, h))) ||
    null
  )
}

export const isGroupName = (group, text) =>
  group.names.includes(text.toLowerCase().trim())
