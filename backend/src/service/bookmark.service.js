import prisma from "../lib/prisma.js"
import { COURSE_CARD_SELECT } from "../constants/courseSelect.js"

// toggle bookmark (เพิ่มถ้าไม่มี ลบถ้ามีแล้ว)
export const toggleBookmark = async (userId, courseId) => {
  try {
    await prisma.bookmark.create({
      data: { userId, courseId },
    })
    return { bookmarked: true }
  } catch (error) {
    // เช็คว่า error เป็น unique constraint จริง
    if (error.code === "P2002") {
      await prisma.bookmark.delete({
        where: { userId_courseId: { userId, courseId } },
      })
      return { bookmarked: false }
    }
    throw error
  }
}

// ดึง bookmark ทั้งหมดของ user
export const getUserBookmarks = async (userId) => {
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId },
    include: {
      course: { select: COURSE_CARD_SELECT },
    },
    orderBy: { createdAt: "desc" },
  })
  return bookmarks.map((b) => ({
    ...b.course,
    bookmarkedAt: b.createdAt,
  }))
}

