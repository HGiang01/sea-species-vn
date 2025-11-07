import { type Request, type Response } from "express";
import { type QueryResult } from "pg";

import { client } from "../lib/db.js";
import { uploadImage, destroyImage } from "../lib/cloudinaryImageService.js";
import { AppError } from "../utils/appError.js";

enum ThreatenedSymbol {
    NE = "Chưa được đánh giá",
    DD = "Thiếu dẫn liệu",
    LC = "Ít lo ngại",
    NT = "Gần bị đe dọa",
    VU = "Sẽ nguy cấp",
    EN = "Nguy cấp",
    CR = "Cực kỳ nguy cấp",
    EW = "Tuyệt chủng ngoài tự nhiên",
    EX = "Tuyệt chủng",
}

interface Species {
    id: string;
    species: string;
    name: string;
    group_species: string;
    description: string;
    characteristic: string;
    habits: string;
    impact: string;
    threatened_symbol: ThreatenedSymbol;
    vn_distribution: string;
    global_distribution: string;
    phylum: string;
    class: string;
    order_species: string;
    family: string;
    genus: string;
    references_text: string;
    created_at: Date;
    updated_at: Date;
}

const SPECIES_COLUMNS = [
    "id",
    "species",
    "name",
    "group_species",
    "description",
    "characteristic",
    "habits",
    "impact",
    "threatened_symbol",
    "vn_distribution",
    "global_distribution",
    "phylum",
    "class",
    "order_species",
    "family",
    "genus",
    "references_text",
    "created_at",
    "updated_at",
] as const satisfies readonly (keyof Species)[];

const SPECIES_TB = process.env.PG_SPECIES_TB;
const IMAGE_TB = process.env.PG_IMAGES_TB;

// Controller for getting species
export const getAllSpecies = async (req: Request, res: Response) => {
    const result = await client.query({
        name: "get-all-species",
        text: `SELECT s.id,
                s.species,
                s.threatened_symbol,
                s.group_species,
                i.image_url
                FROM ${SPECIES_TB} AS s  
                INNER JOIN ${IMAGE_TB} AS i 
                ON s.id = i.species_id
                WHERE i.is_cover IS TRUE
                ORDER BY updated_at DESC`,
    });

    return res.status(200).json({ message: "Get all species successfully", data: result.rows });
};

export const getSpeciesById = async (req: Request, res: Response) => {
    const { id } = req.params;

    const result: QueryResult<Species & { image_url: string }> = await client.query({
        name: "get-species",
        text: `SELECT s.*,
                i.image_url
                FROM ${SPECIES_TB} AS s  
                INNER JOIN ${IMAGE_TB} AS i 
                ON s.id = i.species_id
                WHERE s.id = $1 AND i.is_cover IS TRUE
                ORDER BY updated_at DESC`,
        values: [id],
    });

    // Aggregate images into an array
    const species = result.rows.reduce<(Species & { images: string[] }) | null>((acc, curr) => {
        const { image_url, ...speciesData } = curr;
        if (!acc) {
            return { ...speciesData, images: [image_url] };
        }
        acc.images.push(image_url);
        return acc;
    }, null);

    return res.status(200).json({ message: "Get species successfully", species });
};

export const filterSpecies = async (req: Request, res: Response) => {
    const whereClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(req.query)) {
        if (!SPECIES_COLUMNS.includes(key as (typeof SPECIES_COLUMNS)[number])) continue;

        if (value) {
            if (Array.isArray(value) && value.length > 1) {
                for (const subValue of value) {
                    whereClauses.push(`${key} ILIKE $${paramIndex}`);
                    values.push(`%${subValue}%`);
                    paramIndex++;
                }
            } else {
                whereClauses.push(`${key} ILIKE $${paramIndex}`);
                values.push(`%${value}%`);
                paramIndex++;
            }
        }
    }

    if (whereClauses.length === 0) {
        throw new AppError("[species/filterSpecies] Missing query parameters", 400);
    }

    const queryText = `SELECT s.id,
                            s.species,
                            s.threatened_symbol,
                            s.group_species,
                            i.image_url
                        FROM ${SPECIES_TB} as s
                        INNER JOIN ${IMAGE_TB} AS i ON s.id = i.species_id
                        WHERE ${whereClauses.join(" OR ")}
                        AND i.is_cover IS TRUE`;

    const result: QueryResult<Species & { image_url: string }> = await client.query({
        text: queryText,
        values: values,
    });

    // Aggregate images into an array
    const species = result.rows.reduce<(Species & { images: string[] }) | null>((acc, curr) => {
        const { image_url, ...speciesData } = curr;
        if (!acc) {
            return { ...speciesData, images: [image_url] };
        }
        acc.images.push(image_url);
        return acc;
    }, null);

    return res.status(200).json({ message: "Filter species successfully", species });
};

export const countTaxonomy = async (req: Request, res: Response) => {
    const { id } = req.params;
    const taxonomyCount: Record<string, number> = {
        phylum: 0,
        class: 0,
        order_species: 0,
        family: 0,
        genus: 0,
    };

    // Get taxonomy info of species
    const resultOfTaxonomy = await client.query({
        name: "get-taxonomy",
        text: `SELECT phylum, class, order_species, family, genus FROM ${SPECIES_TB} WHERE id = $1`,
        values: [id],
    });

    const taxonomy = resultOfTaxonomy.rows[0];

    for (const [key, value] of Object.entries(taxonomy)) {
        if (value) {
            const numberOfTaxonomyLevel = await client.query({
                name: `count-${key}`,
                text: `SELECT COUNT(1) AS number  FROM ${SPECIES_TB} WHERE $1 = $2`,
                values: [key, value],
            });

            // Update count
            taxonomyCount[key] = numberOfTaxonomyLevel.rows[0].number;
        }
    }

    return res.status(200).json({ message: "Count taxonomy successfully", taxonomy: taxonomyCount });
};

// Controller for managing species (admin only)
export const addSpecies = async (req: Request, res: Response) => {
    const { name } = req.body;

    if (!name) {
        throw new AppError("[species/addSpecies] Name field is required", 400);
    }

    // Check if species already exists
    const checkSpecies = await client.query({
        name: "check-species-exists",
        text: `SELECT 1 FROM ${SPECIES_TB} WHERE name = $1`,
        values: [name],
    });

    if (checkSpecies.rowCount !== null && checkSpecies.rowCount > 0) {
        throw new AppError("[species/addSpecies] Species already exists", 400);
    }

    // Create dynamic insert query
    const columns: string[] = [];
    const values: any[] = [];
    const paramIndexes: string[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(req.body)) {
        if (!SPECIES_COLUMNS.includes(key as (typeof SPECIES_COLUMNS)[number])) continue;

        if (value) {
            columns.push(key);
            // Trim only if the value is a string, otherwise keep the value as-is
            if (typeof value === "string") {
                values.push(value.trim());
            } else {
                values.push(value);
            }
            paramIndexes.push(`$${paramIndex}`);
            paramIndex++;
        }
    }

    const insertQuery = `INSERT INTO ${SPECIES_TB} (${columns.join(", ")}) VALUES (${paramIndexes.join(", ")}) RETURNING *`;

    const result: QueryResult<Species> = await client.query({
        text: insertQuery,
        values: values,
    });

    return res.status(201).json({ message: "Add species successfully", species: result.rows[0] });
};

export const updateSpecies = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
        throw new AppError("[species/updateSpecies] Name field is required", 400);
    }

    // Check if species exists
    const speciesExists = await client.query({
        name: "check-species-exists-by-id",
        text: `SELECT 1 FROM ${SPECIES_TB} WHERE id = $1`,
        values: [id],
    });

    if (speciesExists.rowCount === 0) {
        throw new AppError("[species/updateSpecies] Species not found", 404);
    }

    // Check if name species already exists
    const checkSpecies = await client.query({
        name: "check-species-exists",
        text: `SELECT 1 FROM ${SPECIES_TB} WHERE name = $1`,
        values: [name],
    });

    if (checkSpecies.rowCount !== null && checkSpecies.rowCount > 0) {
        throw new AppError("[species/updateSpecies] Species already exists", 400);
    }

    // Create dynamic update query
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(req.body)) {
        if (!SPECIES_COLUMNS.includes(key as (typeof SPECIES_COLUMNS)[number])) continue;

        if (value) {
            setClauses.push(`${key} = $${paramIndex}`);
            // Trim only if the value is a string, otherwise keep the value as-is
            if (typeof value === "string") {
                values.push(value.trim());
            } else {
                values.push(value);
            }
            paramIndex++;
        }
    }

    values.push(id);

    const updateQuery = `UPDATE species
                        SET ${setClauses.join(", ")}
                        WHERE id = $${paramIndex} RETURNING *`;

    const result: QueryResult<Species> = await client.query({
        text: updateQuery,
        values: values,
    });

    return res.status(200).json({ message: "Update species successfully", species: result.rows[0] });
};

export const deleteSpecies = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;

    await client.query({
        name: "delete-species",
        text: `DELETE
                   FROM ${SPECIES_TB}
                   WHERE id = $1`,
        values: [id],
    });

    return res.status(200).json({ message: "Delete species successfully" });
};

// Controller for managing species images (admin only)
