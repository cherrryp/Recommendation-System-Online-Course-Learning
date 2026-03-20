import prisma from "../lib/prisma.js"

export const getDashboardStats = async (req, res) => {
  try {

    const users = await prisma.user.count()
    const courses = await prisma.course.count()
    const enrollments = await prisma.enrollment.count()

    res.json({
      users,
      courses,
      enrollments
    })

  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stats" })
  }
}


export const getAllUsers = async (req, res) => {
  try {

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true
      }
    })

    res.json(users)

  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" })
  }
}


export const deleteUser = async (req, res) => {

  const { id } = req.params

  try {

    await prisma.user.delete({
      where: { id }
    })

    res.json({ message: "User deleted" })

  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" })
  }
}


export const getAllCourses = async (req, res) => {

  try {

    const courses = await prisma.course.findMany()

    res.json(courses)

  } catch (error) {
    res.status(500).json({ error: "Failed to fetch courses" })
  }

}


export const deleteCourse = async (req, res) => {

  const { id } = req.params

  try {

    await prisma.course.delete({
      where: { id }
    })

    res.json({ message: "Course deleted" })

  } catch (error) {
    res.status(500).json({ error: "Failed to delete course" })
  }

}