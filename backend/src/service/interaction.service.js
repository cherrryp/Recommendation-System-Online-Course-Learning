import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ฟังก์ชันสำหรับบันทึก Interaction
export const trackCourseInteraction = async (userId, courseId, action) => {
  // 1. ระบบป้องกัน Spam (เช็คว่าเคยดูไปแล้วใน 1 ชั่วโมงที่ผ่านมาหรือไม่)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const recentInteraction = await prisma.userInteraction.findFirst({
    where: {
      userId: userId,
      courseId: courseId,
      action: action,
      createdAt: { gte: oneHourAgo },
    },
  });

  // ถ้าเพิ่งดูไป คืนค่าเดิมกลับไป ไม่ต้องบันทึกใหม่
  if (recentInteraction) {
    return { isSpam: true, data: recentInteraction };
  }

  // 2. บันทึกข้อมูลใหม่ลง Database
  const newInteraction = await prisma.userInteraction.create({
    data: {
      userId: userId,
      courseId: courseId,
      action: action, 
    },
  });

  return { isSpam: false, data: newInteraction };
};