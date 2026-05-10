import { Router } from "express";
import { get, onboarding } from "../controllers/profile.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { onboardingSchema } from "../lib/validations.js";

const router = Router();
router.use(authenticate);
router.get("/", get);
router.post("/onboarding", validate(onboardingSchema), onboarding);
export default router;
