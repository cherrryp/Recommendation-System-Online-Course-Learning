import express from "express"
import { recordInteraction } from "../controllers/interactionController.js"
import { verifyToken } from "../middleware/auth.js"
import { validate } from "../middleware/validate.js"
import { interactionSchema } from "../validation/schemas.js"

const router = express.Router()

router.post("/", verifyToken, validate(interactionSchema), recordInteraction)

export default router