import prisma from "../lib/prisma.js"
import { trackCourseInteraction } from "../service/interaction.service.js"
import { updateUserInterest } from "../service/recommendation.service.js"


export const recordInteraction = async (req, res) => {
  try {
    const { userId, courseId, action } = req.body

    if (!userId || !action) {
      return res.status(400).json({ success: false, message: "userId and action required" })
    }

    // search ไม่ต้องมี courseId
    if (action === "search") {
      await prisma.userInteraction.create({
        data: { userId, action },
      }).catch(() => {}) // ถ้า courseId null อาจ fail ตาม schema → catch ไว้
      return res.json({ success: true, isSpam: false })
    }

    if (!courseId) {
      return res.status(400).json({ success: false, message: "courseId required" })
    }

    const result = await trackCourseInteraction(userId, courseId, action)
    if (!result.isSpam) {
      await updateUserInterest(userId, courseId, action)
    }

    res.json({ success: true, data: result.data, isSpam: result.isSpam })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "Error recording interaction" })
  }
}