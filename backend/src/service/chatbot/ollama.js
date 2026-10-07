const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434"
export const MODEL = process.env.OLLAMA_MODEL || "scb10x/llama3.2-typhoon2-3b-instruct"

// เรียก Ollama พร้อม timeout กัน request ค้าง — json=true บังคับให้ตอบเป็น JSON
export const generate = async ({ prompt, options = {}, json = false, timeoutMs = 20000 }) => {
  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, prompt, stream: false, ...(json && { format: "json" }), options }),
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!res.ok) throw new Error(`Ollama responded ${res.status}`)
  const data = await res.json()
  return (data.response || "").trim()
}

export const checkOllamaHealth = async () => {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(3000) })
    const data = await res.json()
    const hasModel = data.models?.some((m) => m.name === MODEL || m.name.startsWith(`${MODEL}:`))
    return { running: true, hasModel: !!hasModel }
  } catch {
    return { running: false, hasModel: false }
  }
}
