import jwt from "jsonwebtoken"

process.env.JWT_SECRET = "test-secret"

export const tokenFor = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET)
