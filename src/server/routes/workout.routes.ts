import { Router } from "express";
import { today, upsert } from "../controllers/workout.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { workoutSessionSchema } from "../lib/validations.js";

const router = Router();
router.use(authenticate);
router.get("/", today);
router.post("/", validate(workoutSessionSchema), upsert);
export default router;
