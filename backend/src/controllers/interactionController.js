import prisma from "../lib/prisma.js"
import { updateUserInterest } from "../service/recommendation.service.js"
import { trackCourseInteraction } from "../service/interaction.service.js"

// POST /api/interactions
// เก็บ interaction และอัปเดต UserInterest
export const recordInteraction = async (req, res) => {
  try {
    const { userId, courseId, action } = req.body

    if (!userId || !courseId || !action) {
      return res.status(400).json({ success: false, message: "userId, courseId, action required" })
    }

    // บันทึก interaction (มี spam protection อยู่แล้ว)
    const result = await trackCourseInteraction(userId, courseId, action)

    // อัปเดต UserInterest ถ้าไม่ใช่ spam
    if (!result.isSpam) {
      await updateUserInterest(userId, courseId, action)
    }

    res.json({ success: true, data: result.data, isSpam: result.isSpam })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "Error recording interaction" })
  }
}
