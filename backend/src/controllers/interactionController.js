import prisma from "../lib/prisma.js"
import { trackCourseInteraction } from "../service/interaction.service.js"
import { updateUserInterest } from "../service/recommendation.service.js"
import { translateToEng } from "../service/translate.service.js"
import asyncHandler from "../utils/asyncHandler.js"
import HttpError from "../utils/HttpError.js"

// POST /api/interactions   body: { courseId?, action, keyword? }
export const recordInteraction = asyncHandler(async (req, res) => {
  const userId = req.user.id
  const { courseId, action, keyword } = req.body

  if (!action) throw new HttpError(400, "action required")

  // search ไม่ต้องมี courseId
  if (action === "search") {
    await prisma.userInteraction.create({
      data: { userId, action, keyword: keyword ?? null }, // log ภาษาไทยเก็บไว้
    })

    if (keyword) {
      const engKeyword = await translateToEng(keyword)
      await updateUserInterest(userId, null, "search", engKeyword)
    }

    return res.json({ success: true, isSpam: false })
  }

  if (!courseId) throw new HttpError(400, "courseId required")

  const result = await trackCourseInteraction(userId, courseId, action)
  if (!result.isSpam) {
    await updateUserInterest(userId, courseId, action)
  }

  res.json({ success: true, data: result.data, isSpam: result.isSpam })
})
