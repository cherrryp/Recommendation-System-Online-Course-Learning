import dotenv from "dotenv"

dotenv.config()

const { assertEnv, PORT } = await import("./src/config/env.js")
assertEnv()

const { default: app } = await import("./src/index.js")

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
