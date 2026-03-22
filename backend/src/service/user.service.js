import prisma from "../lib/prisma.js"
import bcrypt from "bcrypt"

// ดึง profile ของ user
export const getUserProfile = async (userId) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, username: true, email: true,
      fname: true, lname: true, role: true, createdAt: true,
      interests: {
        select: { keyword: true, score: true },
        orderBy: { score: "desc" },
      },
    },
  })
}

// แก้ไข profile
export const updateUserProfile = async (userId, { fname, lname, username }) => {
  return await prisma.user.update({
    where: { id: userId },
    data: { fname, lname, username },
    select: {
      id: true, username: true, email: true,
      fname: true, lname: true,
    },
  })
}

// แก้รหัสผ่าน
export const updatePassword = async (userId, { oldPassword, newPassword }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  const valid = await bcrypt.compare(oldPassword, user.password)
  if (!valid) throw new Error("รหัสผ่านเดิมไม่ถูกต้อง")

  const hashed = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  })
  return { success: true }
}

// ดึง interest ของ user
export const getUserInterests = async (userId) => {
  return await prisma.userInterest.findMany({
    where: { userId },
    orderBy: { score: "desc" },
  })
}

// ตั้ง interest ใหม่ทั้งหมด (user เลือกเองจากหน้า profile)
export const setUserInterests = async (userId, keywords) => {
  // ลบ interest เดิมทั้งหมด
  await prisma.userInterest.deleteMany({ where: { userId } })

  // สร้างใหม่ตาม keyword ที่เลือก
  if (!keywords.length) return []

  await prisma.userInterest.createMany({
    data: keywords.map((keyword) => ({
      userId,
      keyword: keyword.toLowerCase().trim(),
      score: 1,
    })),
  })

  return await getUserInterests(userId)
}
