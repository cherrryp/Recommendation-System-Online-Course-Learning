import prisma from "../lib/prisma.js"

export const getUserProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      })
    }

    // เอา password ออก
    const { password: _, ...userData } = user

    res.json({
      success: true,
      user: userData
    })

  } catch (error) {
    console.error(error)

    res.status(500).json({
      success: false,
      message: "Unable to retrieve profile"
    })
  }
}