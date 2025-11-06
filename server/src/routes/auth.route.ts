import { Router } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";
import { login, logout, changePassword } from "../controllers/auth.controller.js";
import { protectRoute } from "../middlewares/protectRoute.js";
import { loginLimiter } from "../middlewares/loginLimiter.js";

const router = Router();

// @ts-ignore
router.post("/login", loginLimiter, asyncHandler(login));
router.post("/logout", protectRoute, asyncHandler(logout));
// @ts-ignore
router.post("/change-password", protectRoute, asyncHandler(changePassword));

export default router;
