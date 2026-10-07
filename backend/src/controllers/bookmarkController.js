import { toggleBookmark, getUserBookmarks } from "../service/bookmark.service.js"
import asyncHandler from "../utils/asyncHandler.js"
import HttpError from "../utils/HttpError.js"

// POST /api/bookmarks/toggle   body: { courseId }
export const toggle = asyncHandler(async (req, res) => {
  const { courseId } = req.body
  if (!courseId) throw new HttpError(400, "courseId required")

  const result = await toggleBookmark(req.user.id, courseId)
  res.json({ success: true, bookmarked: result.bookmarked })
})

// GET /api/bookmarks/:userId
export const getBookmarks = asyncHandler(async (req, res) => {
  const courses = await getUserBookmarks(req.params.userId)
  res.json({ success: true, data: courses })
})
