import { Router } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";
import { protectRoute } from "../middlewares/protectRoute.js";
import { getPoints, createPoint, updatePoint, deletePoint } from "../controllers/point.controller.js";

const router = Router();

router.get(":speciesId", asyncHandler(getPoints));
router.post(":speciesId", protectRoute, asyncHandler(createPoint));
router.put(":id", protectRoute, asyncHandler(updatePoint));
router.delete(":id", protectRoute, asyncHandler(deletePoint))

export default router;
