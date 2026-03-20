import prisma from "../lib/prisma.js";

// ✅ 1. ลงทะเบียนเรียน
const enrollCourse = async (userId, courseId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId }
  });

  if (!course) {
    throw new Error('Course not found');
  }

  const existing = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId
      }
    }
  });

  if (existing) {
    throw new Error('Already enrolled in this course');
  }

  const enrollment = await prisma.enrollment.create({
    data: {
      userId,
      courseId,
      status: 'not_started',
      progress: 0
    }
  });

  // 🔥 (แนะนำ) สร้าง LessonPerformance อัตโนมัติ
  const lessons = await prisma.lesson.findMany({
    where: {
      module: {
        courseId: courseId
      }
    }
  });

  if (lessons.length > 0) {
    await prisma.lessonPerformance.createMany({
      data: lessons.map((lesson) => ({
        enrollmentId: enrollment.id,
        lessonId: lesson.id,
        lessonStatus: 'not_started'
      }))
    });
  }

  return enrollment;
};

// ✅ 2. ดู enrollment ของตัวเอง
const getMyEnrollments = async (userId) => {
  return prisma.enrollment.findMany({
    where: { userId },
    include: {
      course: true
    },
    orderBy: {
      enrolledDate: 'desc'
    }
  });
};

// ✅ 3. ดูตาม id
const getEnrollmentById = async (id, userId) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id },
    include: {
      course: true
    }
  });

  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  // 🔐 กันดูของคนอื่น
  if (enrollment.userId !== userId) {
    throw new Error('Forbidden');
  }

  return enrollment;
};

// ✅ 4. อัปเดต progress / status
const updateEnrollment = async (id, userId, data) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id }
  });

  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  if (enrollment.userId !== userId) {
    throw new Error('Forbidden');
  }

  return prisma.enrollment.update({
    where: { id },
    data
  });
};

// ✅ 5. ลบ / ถอนเรียน
const deleteEnrollment = async (id, userId) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id }
  });

  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  if (enrollment.userId !== userId) {
    throw new Error('Forbidden');
  }

  return prisma.enrollment.delete({
    where: { id }
  });
};

export default {
  enrollCourse,
  getMyEnrollments,
  getEnrollmentById,
  updateEnrollment,
  deleteEnrollment
};