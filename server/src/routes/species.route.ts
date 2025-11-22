import { Router } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";
import { protectRoute } from "../middlewares/protectRoute.js";
import { uploadMemory } from "../config/multer.js";
import {
    // fetchAllSpecies,
    // fetchAllSpeciesAdmin,
    fetchSpeciesAdmin,
    fetchSpeciesById,
    fetchSpecies,
    countTaxonomy,
    addSpecies,
    updateSpecies,
    deleteSpecies,
    importSpeciesDataFromFile,
} from "../controllers/species.controller.js";

const router = Router();

// Query and Search
router.post("/search", asyncHandler(fetchSpecies));
router.post("/admin/search", asyncHandler(fetchSpeciesAdmin));

// Fetch by ID
router.get("/:id", asyncHandler(fetchSpeciesById)); // User
router.get("/:id/taxonomy/count", asyncHandler(countTaxonomy)); // User

// Create, Update, Delete - Admin
router.post("/", protectRoute, uploadMemory.fields([{ name: "images" }, { name: "location", maxCount: 1 }]), asyncHandler(addSpecies));
router.put("/:id", protectRoute, uploadMemory.fields([{ name: "images" }, { name: "location", maxCount: 1 }]), asyncHandler(updateSpecies));
router.delete("/:id", protectRoute, asyncHandler(deleteSpecies));

// Utility - Admin
router.post("/import", protectRoute, uploadMemory.single("location"), asyncHandler(importSpeciesDataFromFile));

export default router;
