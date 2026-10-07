import pkg from '@prisma/client'
const { PrismaClient } = pkg

// จำกัดจำนวน connection ต่อ instance — pooler ของ DB (เช่น Supabase session mode) มี pool_size จำกัด
// ถ้า DATABASE_URL กำหนด connection_limit เองอยู่แล้วจะไม่แตะ
const withConnectionLimit = (rawUrl) => {
  if (!rawUrl) return rawUrl
  try {
    const url = new URL(rawUrl)
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", process.env.PRISMA_CONNECTION_LIMIT || "8")
    }
    return url.toString()
  } catch {
    return rawUrl
  }
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: withConnectionLimit(process.env.DATABASE_URL)
    }
  },
  log: ['error']
})

export default prisma
