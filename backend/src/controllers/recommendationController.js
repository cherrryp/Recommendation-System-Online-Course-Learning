import prisma from "../lib/prisma.js";

export const getRecommendedCourses = async (req, res) => {
  try {

    const userId = req.params.userId;

    // 1. หา user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // 2. เอา interests ของ user
    const interests = user.interests;

    // 3. หาคอร์สที่ category ตรงกับ interest
    const courses = await prisma.course.findMany({
      where: {
        category: {
          in: interests
        }
      },
      include: {
        modules: true,
        keywords: true
      },
      take: 6
    });

    res.json({
      success: true,
      data: courses
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Error getting recommendations"
    });

  }
};