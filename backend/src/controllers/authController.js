import prisma from "../lib/prisma.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

export const register = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      fname,
      lname,
      birthDate,
      educationLevel
    } = req.body

    // check email ซ้ำ
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists"
      })
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: "student",
        fname,
        lname,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        educationLevel
      }
    })

    const { password: _, ...userData } = user

    res.json({
      success: true,
      message: "Register success",
      user: userData
    })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      success: false,
      message: "Register error"
    })

  }
}

export const login = async (req, res) => {

  try {

    const { email, password } = req.body

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      })
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      })
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    )

    const { password: _, ...userData } = user

    res.json({
      success: true,
      token,
      user: userData
    })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      success: false,
      message: "Login error"
    })

  }
}