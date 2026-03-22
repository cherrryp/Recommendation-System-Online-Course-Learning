import {
  toggleBookmark,
  getUserBookmarks,
  isBookmarked,
} from "../service/bookmark.service.js"

// POST /api/bookmarks/toggle
export const toggle = async (req, res) => {
  try {
    const { userId, courseId } = req.body
    const result = await toggleBookmark(userId, courseId)
    res.json({ success: true, ...result })
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
    res.json({ success: true, data: courses })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "Error getting bookmarks" })
  }
}

// GET /api/bookmarks/check/:userId/:courseId
export const checkBookmark = async (req, res) => {
  try {
    const { userId, courseId } = req.params
    const bookmarked = await isBookmarked(userId, courseId)
    res.json({ success: true, bookmarked })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "Error checking bookmark" })
  }
}
