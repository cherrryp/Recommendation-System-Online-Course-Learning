import jwt from "jsonwebtoken"
import prisma from "../lib/prisma.js"
import HttpError from "../utils/HttpError.js"
import asyncHandler from "../utils/asyncHandler.js"

const readToken = (req) => {
  const header = req.headers.authorization
  return header?.startsWith("Bearer ") ? header.split(" ")[1] : null
}

// Verifies the JWT, then loads the user so role changes and deleted accounts
// take effect immediately. Sets req.user = { id, role }.
export const verifyToken = asyncHandler(async (req, res, next) => {
  const token = readToken(req)
  if (!token) throw new HttpError(401, "Unauthorized: No token provided")

  let decoded
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    throw new HttpError(401, "Unauthorized: Invalid token")
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: { id: true, role: true },
  })
  if (!user) throw new HttpError(401, "Unauthorized: User not found")

  req.user = user
  next()
})

export const verifyAdmin = (req, res, next) => {
  if (req.user.role !== "admin") return next(new HttpError(403, "Admin only"))
  next()
}

// For routes with a :userId param — only that user (or an admin) may access it
export const requireSelfOrAdmin = (req, res, next) => {
  const isSelf = req.params.userId === req.user.id
  if (!isSelf && req.user.role !== "admin") {
    return next(new HttpError(403, "Forbidden"))
  }
  next()
}
