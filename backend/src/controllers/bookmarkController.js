import {
  toggleBookmark,
  getUserBookmarks,
} from "../service/bookmark.service.js"

// POST /api/bookmarks/toggle
export const toggle = async (req, res) => {
  try {
    const { userId, courseId } = req.body
    const result = await toggleBookmark(userId, courseId)

    res.json({
      success: true,
      bookmarked: result.bookmarked, // ✅ ชัดขึ้น
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "Error toggling bookmark" })
  }
}

// GET /api/bookmarks/:userId
export const getBookmarks = async (req, res) => {
  try {
    const { userId } = req.params
    const courses = await getUserBookmarks(userId)

    res.json({
      success: true,
      data: courses,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "Error getting bookmarks" })
  }
}
