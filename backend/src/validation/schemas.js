import { z } from "zod"

const name = z.string().trim().min(1).max(100)
const password = z.string().min(6).max(128)

export const registerSchema = z.object({
  username: name,
  email: z.string().trim().toLowerCase().email(),
  password,
  fname: name.optional(),
  lname: name.optional(),
})

// "email" may also hold a username (see authController.login)
export const loginSchema = z.object({
  email: z.string().trim().min(1),
  password: z.string().min(1),
})

export const updateProfileSchema = z.object({
  fname: name.optional(),
  lname: name.optional(),
  username: name.optional(),
})

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: password,
})

export const updateInterestsSchema = z.object({
  keywords: z.array(z.string().trim().min(1).max(50)).max(50),
})

export const toggleBookmarkSchema = z.object({
  courseId: z.string().min(1),
})

export const interactionSchema = z.object({
  action: z.enum(["click", "search", "bookmark"]),
  courseId: z.string().min(1).nullish(),
  keyword: z.string().trim().max(200).nullish(),
})

export const chatSchema = z.object({
  message: z.string().trim().min(1).max(1000),
  page: z.coerce.number().int().min(1).default(1),
})

export const updateCourseSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  description: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).max(100).optional(),
  price: z.coerce.number().min(0).optional(),
  status: z.enum(["open", "closed"]).optional(),
})
