import dotenv from "dotenv"

dotenv.config()

const { assertEnv, PORT } = await import("./src/config/env.js")
assertEnv()

const { default: app } = await import("./src/index.js")
const { warmUpEmbeddings } = await import("./src/service/embedding.service.js")

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  warmUpEmbeddings() // โหลดโมเดล embedding เบื้องหลัง (ปิดด้วย SEMANTIC_SEARCH=off)
})
