import { Router } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";
import { login, logout, changePassword } from "../controllers/auth.controller.js";
import { loginLimiter } from "../middlewares/loginLimiter.js";

const router = Router();

router.post("/login", loginLimiter, asyncHandler(login));
router.post("/logout", asyncHandler(logout));
router.post("/change-password", asyncHandler(changePassword));

export default router;
