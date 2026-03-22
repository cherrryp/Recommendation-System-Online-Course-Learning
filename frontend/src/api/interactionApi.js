import api from "./api"; 

/**
 * ฟังก์ชันสำหรับส่งข้อมูลพฤติกรรม (Interaction) ของผู้ใช้ไปยัง Backend
 * @param {string} userId - ID ของผู้ใช้งาน
 * @param {string} courseId - ID ของคอร์สเรียน
 * @param {string} action - ประเภทการกระทำ เช่น "view", "click", "enroll" (ค่าเริ่มต้นคือ "view")
 * @returns {Promise<Object>} - ข้อมูล Response จาก Backend
 */
export const recordCourseInteraction = async (userId, courseId, action = "view") => {
  try {
    // ใช้ api.post ได้เลย BaseURL จะถูกเติมให้เป็น /api/interactions อัตโนมัติ
    // และ Token จะถูกแนบไปใน Header ให้เองจาก Interceptor
    const response = await api.post("/interactions", {
      userId,
      courseId,
      action,
    });

    // คืนค่า data ที่ได้จาก backend (ในนั้นจะมี success, message, data)
    return response.data; 

  } catch (error) {
    // จัดการ Error ให้อ่านง่ายขึ้นเวลา Debug
    console.error(
      "API Error (recordCourseInteraction):", 
      error.response?.data || error.message
    );
    throw error;
  }
};

export const recordInteraction = recordCourseInteraction