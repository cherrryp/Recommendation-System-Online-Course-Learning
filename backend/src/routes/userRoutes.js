import express from "express"
import { verifyToken } from "../middleware/auth.js"
import prisma from "../lib/prisma.js"
import { getUserProfile } from "../controllers/userController.js"

const router = express.Router()

router.get("/profile", verifyToken, getUserProfile)

export default router