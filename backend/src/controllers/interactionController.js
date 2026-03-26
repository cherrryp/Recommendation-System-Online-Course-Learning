import prisma from "../lib/prisma.js"
import { trackCourseInteraction } from "../service/interaction.service.js"
import { updateUserInterest } from "../service/recommendation.service.js"
import { translateToEng } from "../service/translate.service.js"

export const recordInteraction = async (req, res) => {
  try {
    const { userId, courseId, action } = req.body

    if (!userId || !action) {
      return res.status(400).json({ success: false, message: "userId and action required" })
    }

    // search ไม่ต้องมี courseId
    if (action === "search") {
      const { keyword } = req.body

      await prisma.userInteraction.create({
        data: { userId, action, keyword: keyword ?? null } // log ภาษาไทยเก็บไว้
      })

      if (keyword) {
        if (keyword) {
          console.log("1. keyword รับมา:", keyword)        // ← เพิ่ม
          const engKeyword = await translateToEng(keyword)
          console.log("2. แปลแล้ว:", engKeyword)           // ← เพิ่ม
          await updateUserInterest(userId, null, "search", engKeyword)
          console.log("3. upsert เสร็จ")                   // ← เพิ่ม
}
      }

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