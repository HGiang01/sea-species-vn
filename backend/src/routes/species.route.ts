import { Router } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";
import { protectRoute } from "../middlewares/protectRoute.js";
import { uploadMemory } from "../configs/multer.js";
import {
    fetchSpeciesAdmin,
    fetchSpeciesById,
    fetchSpecies,
    countTaxonomy,
    addSpecies,
    updateSpecies,
    deleteSpecies,
    fetchFilterTags,
    importSpeciesDataFromFile,
} from "../controllers/species.controller.js";

const router = Router();

// Utilities
router.get("/tags", asyncHandler(fetchFilterTags));
router.post("/import", uploadMemory.single("speciesInfo"), asyncHandler(importSpeciesDataFromFile));
router.get("/:id/taxonomy/count", asyncHandler(countTaxonomy));

// Query and Search
router.post("/search", asyncHandler(fetchSpecies));
router.post("/admin/search", asyncHandler(fetchSpeciesAdmin));

// Fetch by ID
router.get("/:id", asyncHandler(fetchSpeciesById));

// Create, Update, Delete - Admin
router.post("/", protectRoute, uploadMemory.fields([{ name: "images" }, { name: "location", maxCount: 1 }]), asyncHandler(addSpecies));
router.put("/:id", protectRoute, uploadMemory.fields([{ name: "images" }, { name: "location", maxCount: 1 }]), asyncHandler(updateSpecies));
router.delete("/:id", protectRoute, asyncHandler(deleteSpecies));

export default router;
