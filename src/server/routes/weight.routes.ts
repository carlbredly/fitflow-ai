import { Router } from "express";
import { create, list } from "../controllers/weight.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { weightLogSchema } from "../lib/validations.js";

const router = Router();
router.use(authenticate);
router.get("/", list);
router.post("/", validate(weightLogSchema), create);
export default router;
