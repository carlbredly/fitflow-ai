import { Router } from "express";
import { register, login, me } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { authSchema } from "../lib/validations.js";

const router = Router();
router.post("/register", validate(authSchema), register);
router.post("/login", validate(authSchema), login);
router.get("/me", authenticate, me);
export default router;
