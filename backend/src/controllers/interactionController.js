import * as interactionService from "../service/interaction.service.js";

export const recordInteraction = async (req, res) => {
  const { userId, courseId, action } = req.body;

  // 1. ตรวจสอบว่าส่งข้อมูลมาครบไหม
  if (!userId || !courseId || !action) {
    return res.status(400).json({ 
      success: false, 
      message: "Missing required fields: userId, courseId, or action" 
    });
  }

  try {
    // 2. เรียกใช้ Service เพื่อทำงานหลัก
    const result = await interactionService.trackCourseInteraction(userId, courseId, action);

    // 3. จัดการ Response ตามผลลัพธ์ที่ได้จาก Service
    if (result.isSpam) {
      return res.status(200).json({ 
        success: true,
        message: "Interaction already recorded recently", 
        data: result.data 
      });
    }

    return res.status(201).json({ 
      success: true,
      message: "Interaction recorded successfully", 
      data: result.data 
    });

  } catch (error) {
    console.error("Controller Error (recordInteraction):", error);
    return res.status(500).json({ 
      success: false,
      message: "Internal server error" 
    });
  }
};