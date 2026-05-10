import { Router } from "express";
import { list, create, remove } from "../controllers/food.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { foodLogSchema } from "../lib/validations.js";

const router = Router();
router.use(authenticate);
router.get("/", list);
router.post("/", validate(foodLogSchema), create);
router.delete("/:id", remove);
export default router;
