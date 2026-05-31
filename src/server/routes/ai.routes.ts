import { Router } from "express";
import { scanFood, generatePlanCtrl, chatCtrl, chatStreamCtrl } from "../controllers/ai.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { aiRateLimit } from "../middleware/ratelimit.js";
import { scanFoodSchema, generatePlanSchema, chatSchema } from "../lib/validations.js";

const router = Router();
router.use(authenticate);
router.use(aiRateLimit);
router.post("/scan-food", validate(scanFoodSchema), scanFood);
router.post("/generate-plan", validate(generatePlanSchema), generatePlanCtrl);
router.post("/chat", validate(chatSchema), chatCtrl);
router.post("/chat/stream", validate(chatSchema), chatStreamCtrl);
export default router;
