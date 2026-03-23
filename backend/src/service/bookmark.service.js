import prisma from "../lib/prisma.js"

// เพิ่ม bookmark
export const addBookmark = async (userId, courseId) => {
  return await prisma.bookmark.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: {},
    create: { userId, courseId },
  })
}

// ลบ bookmark
export const removeBookmark = async (userId, courseId) => {
  return await prisma.bookmark.delete({
    where: { userId_courseId: { userId, courseId } },
  })
}

// toggle bookmark (เพิ่มถ้าไม่มี ลบถ้ามีแล้ว)
export const toggleBookmark = async (userId, courseId) => {
  const existing = await prisma.bookmark.findUnique({
    where: { userId_courseId: { userId, courseId } },
  })

  if (existing) {
    await prisma.bookmark.delete({
      where: { userId_courseId: { userId, courseId } },
    })
    return { bookmarked: false }
  }

  await prisma.bookmark.create({ data: { userId, courseId } })
  return { bookmarked: true }
}

// ดึง bookmark ทั้งหมดของ user
export const getUserBookmarks = async (userId) => {
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId },
    include: {
      course: {
        select: {
          id: true, title: true, category: true,
          university: true, thumbnailUrl: true,
          url: true, price: true, status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })
  return bookmarks.map((b) => b.course)
}

// เช็คว่า user bookmark คอร์สนี้ไหม
export const isBookmarked = async (userId, courseId) => {
  const bookmark = await prisma.bookmark.findUnique({
    where: { userId_courseId: { userId, courseId } },
  })
  return !!bookmark
}
