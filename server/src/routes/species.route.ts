import { Router } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";
import { protectRoute } from "../middlewares/protectRoute.js";
import {
    getAllSpecies,
    getSpeciesById,
    filterSpecies,
    addSpecies,
    updateSpecies,
    deleteSpecies,
    countTaxonomy,
} from "../controllers/species.controller.js";

const router = Router();

// Get species routes
router.get("/", asyncHandler(getAllSpecies));
router.get("/filter", asyncHandler(filterSpecies));
router.get("/:id", asyncHandler(getSpeciesById));
router.get("/:id/taxonomy/count", asyncHandler(countTaxonomy));

// Admin species routes
router.post("/", protectRoute, asyncHandler(addSpecies));
router.put("/:id", protectRoute, asyncHandler(updateSpecies));
router.delete("/:id", protectRoute, asyncHandler(deleteSpecies));

export default router;
