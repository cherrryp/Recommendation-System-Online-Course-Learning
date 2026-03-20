import prisma from "../lib/prisma.js"

export const getAllCourses = async (req, res) => {
  try {

    const courses = await prisma.course.findMany({
      include: {
        feedbacks: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true
          }
        },
        category: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json({
      success: true,
      count: courses.length,
      data: courses
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Error fetching courses"
    });

  }
};

export const getCourseById = async (req, res) => {
  try {

    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: {
        id: id
      },
      include: {
        modules: true,
        keywords: true,
        embedding: true
      }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    res.json({
      success: true,
      data: course
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching course"
    });
  }
};

export const getCoursesWithRating = async (req, res) => {
  try {

    const courses = await prisma.course.findMany({
      include: {
        feedbacks: {
          select: {
            rating: true
          }
        },
        category: true
      }
    });

    const result = courses.map(course => {

      const ratings = course.feedbacks.map(f => f.rating);

      const avg =
        ratings.length > 0
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : 0;

      return {
        ...course,
        averageRating: Number(avg.toFixed(1)),
        totalReviews: ratings.length
      };

    })
    .sort((a, b) => b.averageRating - a.averageRating) // ⭐ เรียงจากมากไปน้อย
    .slice(0, 4); // ⭐ เอาแค่ 4 คอร์ส

    res.json({
      success: true,
      data: result
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Error fetching popular courses"
    });

  }
};