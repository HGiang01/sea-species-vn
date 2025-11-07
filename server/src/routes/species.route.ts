import { Router } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";
import { protectRoute } from "../middlewares/protectRoute.js";
import { uploadMemory } from "../config/multer.js";
import {
    getAllSpecies,
    getSpeciesById,
    filterSpecies,
    countTaxonomy,
    addSpecies,
    updateSpecies,
    deleteSpecies,
    uploadSpeciesImage,
    selectCoverImage,
    deleteSpeciesImage,
} from "../controllers/species.controller.js";

const router = Router();

// Get species routes
router.get("/", asyncHandler(getAllSpecies));
router.get("/:id", asyncHandler(getSpeciesById));
router.get("/filter", asyncHandler(filterSpecies));
router.get("/:id/taxonomy/count", asyncHandler(countTaxonomy));

// Admin species routes
router.post("/", protectRoute, asyncHandler(addSpecies));
router.put("/:id", protectRoute, asyncHandler(updateSpecies));
router.delete("/:id", protectRoute, asyncHandler(deleteSpecies));

// Admin images routes
router.post("/:id/image", protectRoute, uploadMemory.single("image"), asyncHandler(uploadSpeciesImage));
router.post("/:id/image/:imageId/cover", protectRoute, asyncHandler(selectCoverImage));
router.delete("/:id/image/:imageId", protectRoute, asyncHandler(deleteSpeciesImage));

export default router;
