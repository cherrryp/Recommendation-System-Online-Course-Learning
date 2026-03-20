import asyncHandler from "express-async-handler";
import enrollmentService from "../service/enrollment.service.js"; 

export const enroll = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const { courseId } = req.body;

  try {
    // เรียกใช้ลอจิกจาก Service ของคุณ!
    const enrollment = await enrollmentService.enrollCourse(userId, courseId);

    res.status(201).json({
      success: true,
      message: "Enroll success 🎉",
      data: enrollment
    });
  } catch (error) {
    // ดักจับ Error ที่ถูกโยนมาจาก Service (เช่น "Already enrolled in this course")
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// ฟังก์ชันสำหรับดึงคอร์สเรียนทั้งหมดของฉัน
export const getMyCourses = asyncHandler(async (req, res) => {
  // ดึง userId จาก token (ขึ้นอยู่กับว่า auth middleware ของคุณเก็บไว้ที่ไหน เช่น req.user.id หรือ req.user.sub)
  const userId = req.user.sub; 

  try {
    const enrollments = await enrollmentService.getMyEnrollments(userId);

    res.status(200).json({
      success: true,
      data: enrollments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "ไม่สามารถดึงข้อมูลคอร์สเรียนได้",
      error: error.message
    });
  }
});
