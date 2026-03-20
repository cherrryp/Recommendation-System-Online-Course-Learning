import express from "express";
import { enroll ,getMyCourses} from "../controllers/enrollmentController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/", authMiddleware, enroll);
router.get("/my-courses", authMiddleware, getMyCourses);

export default router;