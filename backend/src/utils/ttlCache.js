// cache ในหน่วยความจำแบบมีอายุ — กันคำนวณซ้ำเมื่อ user รีเฟรชหน้าบ่อย ๆ
// (ถ้า deploy หลาย instance ให้เปลี่ยนเป็น Redis โดยคง interface เดิม)
const MAX_ENTRIES = 5000
const store = new Map()    // key → { value, expires }
const inflight = new Map() // key → Promise (ให้ request พร้อมกันใช้ผลเดียวกัน)

const prune = () => {
  const now = Date.now()
  for (const [key, entry] of store) if (entry.expires <= now) store.delete(key)
  if (store.size > MAX_ENTRIES) store.clear()
}

export const memo = async (key, ttlMs, compute) => {
  const hit = store.get(key)
  if (hit && hit.expires > Date.now()) return hit.value
  if (inflight.has(key)) return inflight.get(key)

  const promise = compute()
    .then((value) => {
      store.set(key, { value, expires: Date.now() + ttlMs })
      if (store.size > MAX_ENTRIES) prune()
      return value
    })
    .finally(() => inflight.delete(key))

  inflight.set(key, promise)
  return promise
}

export const invalidate = (prefix) => {
  for (const key of store.keys()) if (key.startsWith(prefix)) store.delete(key)
}

// เรียกเมื่อ user มี interaction ใหม่ → ผลแนะนำของ user นั้นต้องคำนวณใหม่
export const invalidateUser = (userId) => invalidate(`user:${userId}:`)
