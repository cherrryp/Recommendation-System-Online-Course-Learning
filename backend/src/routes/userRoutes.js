import express from "express"
import {
  getProfile, updateProfile, changePassword,
  getInterests, updateInterests,
} from "../controllers/userController.js"
import { verifyToken, requireSelfOrAdmin } from "../middleware/auth.js"
import { validate } from "../middleware/validate.js"
import {
  updateProfileSchema, changePasswordSchema, updateInterestsSchema,
} from "../validation/schemas.js"

const router = express.Router()

router.use(verifyToken)

router.get("/profile/:userId", requireSelfOrAdmin, getProfile)
router.put("/profile/:userId", requireSelfOrAdmin, validate(updateProfileSchema), updateProfile)
router.put("/password/:userId", requireSelfOrAdmin, validate(changePasswordSchema), changePassword)
router.get("/interests/:userId", requireSelfOrAdmin, getInterests)
router.put("/interests/:userId", requireSelfOrAdmin, validate(updateInterestsSchema), updateInterests)

export default router
