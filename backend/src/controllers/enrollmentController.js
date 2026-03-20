const asyncHandler = require('express-async-handler');
const enrollmentService = require('../services/enrollment.service');

// ✅ 1. ลงทะเบียนเรียน
const enroll = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const { courseId } = req.body;

  const result = await enrollmentService.enrollCourse(userId, courseId);

  res.status(201).json({
    message: 'Enroll success',
    data: result
  });
});

// ✅ 2. ดูคอร์สที่ตัวเองลงทะเบียน
const getMyEnrollments = asyncHandler(async (req, res) => {
  const userId = req.user.sub;

  const data = await enrollmentService.getMyEnrollments(userId);

  res.json({ data });
});

// ✅ 3. ดู enrollment ตาม id (แก้แล้ว 🔥)
const getEnrollmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.sub;

  const data = await enrollmentService.getEnrollmentById(id, userId);

  res.json({ data });
});

// ✅ 4. อัปเดต (แก้แล้ว 🔥)
const updateEnrollment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.sub;
  const updateData = req.body;

  const data = await enrollmentService.updateEnrollment(id, userId, updateData);

  res.json({
    message: 'Enrollment updated',
    data
  });
});

// ✅ 5. ลบ (แก้แล้ว 🔥)
const deleteEnrollment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.sub;

  await enrollmentService.deleteEnrollment(id, userId);

  res.json({
    message: 'Enrollment deleted'
  });
});

module.exports = {
  enroll,
  getMyEnrollments,
  getEnrollmentById,
  updateEnrollment,
  deleteEnrollment
};