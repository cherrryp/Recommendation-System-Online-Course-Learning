// สร้าง embedding ของข้อความค้นหาด้วยโมเดลเดียวกับที่ใช้ใน scripts/generate_embeddings.py
// (paraphrase-multilingual-MiniLM-L12-v2, 384 มิติ) เพื่อให้เทียบกับ CourseEmbedding ใน DB ได้
//
// - โหลดโมเดลแบบ lazy (ครั้งแรกใช้เวลา ~20 วินาที และกิน RAM ~500MB)
// - ปิดได้ด้วย SEMANTIC_SEARCH=off  → ระบบจะใช้ keyword search อย่างเดียว
// - ถ้าโหลดไม่สำเร็จจะคืน null เสมอ ผู้เรียกต้องมี fallback
const MODEL = "Xenova/paraphrase-multilingual-MiniLM-L12-v2"
const RETRY_AFTER_MS = 60_000

export const isSemanticSearchEnabled = () => process.env.SEMANTIC_SEARCH !== "off"

let extractorPromise = null
let failedAt = 0

const loadExtractor = () => {
  if (!extractorPromise) {
    extractorPromise = import("@huggingface/transformers")
      .then(({ pipeline }) => pipeline("feature-extraction", MODEL, { dtype: "q8" }))
      .catch((e) => {
        console.error("embedding model failed to load:", e.message)
        extractorPromise = null
        failedAt = Date.now()
        return null
      })
  }
  return extractorPromise
}

// เรียกตอน server start เพื่อให้โมเดลพร้อมก่อน request แรก (ไม่ block การเปิด server)
export const warmUpEmbeddings = () => {
  if (isSemanticSearchEnabled()) loadExtractor()
}

const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve(null), ms))])

// คืน number[384] (normalized) หรือ null ถ้าใช้ไม่ได้/ช้าเกิน timeout
export const embedText = async (text, { timeoutMs = 2000 } = {}) => {
  if (!isSemanticSearchEnabled() || !text?.trim()) return null
  if (failedAt && Date.now() - failedAt < RETRY_AFTER_MS) return null

  const run = async () => {
    const extractor = await loadExtractor()
    if (!extractor) return null
    const out = await extractor(text.slice(0, 500), { pooling: "mean", normalize: true })
    return Array.from(out.data)
  }
  return withTimeout(run(), timeoutMs)
}

// รูปแบบที่ pgvector รับ: '[0.1,0.2,...]'
export const toVectorLiteral = (vector) => `[${vector.join(",")}]`
export const parseVector = (text) => JSON.parse(text)
