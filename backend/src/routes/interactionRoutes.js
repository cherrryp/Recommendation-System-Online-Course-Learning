import express from "express";
import { recordInteraction } from "../controllers/interactionController.js"; 
const router = express.Router();

// POST: /api/interactions
router.post("/", recordInteraction);

export default router;