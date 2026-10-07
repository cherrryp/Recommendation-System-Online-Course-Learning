import prisma from "../lib/prisma.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import asyncHandler from "../utils/asyncHandler.js"
import HttpError from "../utils/HttpError.js"

const SALT_ROUNDS = 10

const withoutPassword = ({ password, ...user }) => user

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { username, email, password, fname, lname } = req.body

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) throw new HttpError(400, "Email already exists")

  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: await bcrypt.hash(password, SALT_ROUNDS),
      role: "student",
      fname,
      lname,
    },
  })

  res.json({ success: true, message: "Register success", user: withoutPassword(user) })
})

// POST /api/auth/login   body: { email (or username), password }
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  const user = await prisma.user.findFirst({
    where: { OR: [{ email }, { username: email }] },
  })

  const isMatch = user && (await bcrypt.compare(password, user.password))
  if (!isMatch) throw new HttpError(401, "Invalid email or password")

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  )

  res.json({ success: true, token, user: withoutPassword(user) })
})
