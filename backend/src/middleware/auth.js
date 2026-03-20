import jwt from "jsonwebtoken"
import prisma from '../lib/prisma.js';

// 🔐 verify + attach user
export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Unauthorized: No token provided"
      })
    }

    const token = authHeader.split(" ")[1]

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // ✅ เช็ค user ใน DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub }
    })

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized: User not found"
      })
    }

    // ✅ แนบ user
    req.user = {
      sub: user.id,
      role: user.role
    }

    next()
  } catch (error) {
    return res.status(401).json({
      message: "Unauthorized: Invalid token"
    })
  }
}

// 🔐 optional: แยก verify เฉย ๆ (ไม่ query DB)
export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "No token"
      })
    }

    const token = authHeader.split(" ")[1]

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    req.user = decoded

    next()
  } catch (error) {
    return res.status(401).json({
      message: "Invalid token"
    })
  }
}

// check admin role
export const verifyAdmin = (req, res, next) => {

  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Admin only"
    })
  }

  next()
}