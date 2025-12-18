import { type Request, type Response } from "express";
import ExcelJS from "exceljs";
import fs from "fs/promises";

import { client } from "../libs/db.js";
import { uploadImage, destroyImage } from "../libs/cloudinary.js";
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
    habitas: string;
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

interface SpeciesImage {
    image_url: string;
    public_id: string;
    is_cover: boolean;
}

interface InputFiles {
    images: Express.Multer.File[];
    location: Express.Multer.File[];
}

const SPECIES_COLUMNS = [
    "species",
    "name",
    "group_species",
    "description",
    "characteristic",
    "habitas",
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
const POINTS_TB = process.env.PG_POINTS_TB;

const clearupTmpFiles = async (files: InputFiles | undefined) => {
    if (!files) return;

    for (const [_, values] of Object.entries(files)) {
        if (values.length !== 0) {
            for (const file of values) {
                await fs.rm(file.path);
            }
        }
    }
};

const isValidLatLng = (lat: number, lng: number) => lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
const extractNumber = (str: string) => {
    const trimmed = str.trim();
    let result = "";
    let dotUsed = false;

    for (let i = 0; i < trimmed.length; i++) {
        if (/\d/.test(trimmed[i]!)) {
            result += trimmed[i];
            continue;
        }

        if (trimmed[i] === ".") {
            if (result === "" || dotUsed) {
                break;
            }
            result += trimmed[i];
            dotUsed = true;
            continue;
        }

        break;
    }

    return result;
};

export const fetchSpecies = async (req: Request, res: Response) => {
    const cursor = req.body?.cursor;
    const orFilterConditions: string[] = [];
    const andFilterConditions: string[] = [];
    const speciesData: any[] = [];
    let nextCursor: Record<string, string> | null = null;
    const rowLimit = 30;
    let paramIndex = 1;

    // Filtering
    if (req.body) {
        for (const [key, value] of Object.entries(req.body)) {
            if (!SPECIES_COLUMNS.includes(key as (typeof SPECIES_COLUMNS)[number])) continue;

            if (value) {
                if (Array.isArray(value) && value.length === 0) continue;

                if (key === "species" || key === "name") {
                    orFilterConditions.push(`${key} ILIKE $${paramIndex}`);
                    speciesData.push(`%${value}%`);
                    paramIndex++;
                } else {
                    if (Array.isArray(value) && value.length > 1) {
                        const placeholders = value.map((_, i) => `$${paramIndex + i}`).join(", ");
                        andFilterConditions.push(`${key} IN (${placeholders})`);
                        value.forEach((v) => speciesData.push(v));
                        paramIndex += value.length;
                    } else {
                        andFilterConditions.push(`${key} = $${paramIndex}`);
                        speciesData.push(`${value}`);
                        paramIndex++;
                    }
                }
            }
        }
    }

    // Cursor pagination
    if (cursor) {
        andFilterConditions.push(`s.id < $${paramIndex}`);
        speciesData.push(cursor.id as string);
    }

    const fetchSpeciesQuery = `
        SELECT s.id,
               s.species   as scientific_name,
               s.name      as vietnamese_name,
               s.threatened_symbol,
               s.group_species,
               i.image_url as cover_image_url
        FROM ${SPECIES_TB} as s
                 INNER JOIN ${IMAGE_TB} AS i ON s.id = i.species_id
        WHERE (${orFilterConditions.length > 0 ? orFilterConditions.join(" OR ") : "TRUE"})
        AND (${andFilterConditions.length > 0 ? andFilterConditions.join(" AND ") : "TRUE"})
        AND i.is_cover IS TRUE
        ORDER BY s.id DESC 
        LIMIT ${rowLimit}
    `;

    const result = await client.query({
        text: fetchSpeciesQuery,
        values: speciesData,
    });

    // Create next cursor
    if (result.rows.length > 0 && result.rowCount === rowLimit) {
        nextCursor = { id: result.rows[result.rows.length - 1].id };
    }

    return res.status(200).json({
        message: "Fetch species successfully",
        species: result.rows,
        cursor: nextCursor,
    });
};

export const fetchSpeciesById = async (req: Request, res: Response) => {
    const { id } = req.params;

    const fetchSpeciesQuery = `SELECT id,
                                      species as scientific_name,
                                      name    as vietnamese_name,
                                      group_species,
                                      description,
                                      characteristic,
                                      habitas,
                                      impact,
                                      threatened_symbol,
                                      vn_distribution,
                                      global_distribution,
                                      phylum,
                                      class,
                                      order_species,
                                      family,
                                      genus,
                                      references_text,
                                      created_at,
                                      updated_at
                               FROM ${SPECIES_TB}
                               WHERE id = $1`;
    const fetchImagesQuery = `SELECT public_id, image_url, is_cover
                              FROM ${IMAGE_TB}
                              WHERE species_id = $1`;
    const fetchPointsQuery = `SELECT id, lat, lng
                              FROM ${POINTS_TB}
                              WHERE species_id = $1`;

    const fetchedSpeciesResult = await client.query<Species>({
        text: fetchSpeciesQuery,
        values: [id],
    });
    const fetchedImagesResult = await client.query<SpeciesImage>({
        text: fetchImagesQuery,
        values: [id],
    });
    const fetchedPointsResult = await client.query<{ id: string; lat: number; lng: number }>({
        text: fetchPointsQuery,
        values: [id],
    });

    return res.status(200).json({
        message: "Get species successfully",
        species: {
            ...fetchedSpeciesResult.rows[0],
            images: fetchedImagesResult.rows,
            points: fetchedPointsResult.rows,
        },
    });
};

export const countTaxonomy = async (req: Request, res: Response) => {
    const { id } = req.params;
    const taxonomyCount: Record<string, string | number | null>[] = [
        { level: "phylum", value: null, count: 0 },
        { level: "class", value: null, count: 0 },
        { level: "order_species", value: null, count: 0 },
        { level: "family", value: null, count: 0 },
        { level: "genus", value: null, count: 0 },
    ];

    const allowedCols = new Set(["phylum", "class", "order_species", "family", "genus"]);

    // Get taxonomy info of species
    const resultOfTaxonomy = await client.query({
        name: "get-taxonomy",
        text: `SELECT phylum, class, order_species, family, genus
               FROM ${SPECIES_TB}
               WHERE id = $1`,
        values: [id],
    });

    const taxonomy = resultOfTaxonomy.rows[0];
    for (const [key, value] of Object.entries(taxonomy)) {
        if (value && allowedCols.has(key)) {
            const numberOfTaxonomyLevel = await client.query({
                name: `count-${key}`,
                text: `SELECT COUNT(1) AS number
                       FROM ${SPECIES_TB}
                       WHERE ${key} = $1`,
                values: [value],
            });

            // Update value and count
            taxonomyCount.forEach((item) => {
                if (item.level === key) {
                    item.value = value as string;
                    item.count = Number(numberOfTaxonomyLevel.rows[0]?.number ?? 0);
                }
            });
        }
    }

    return res.status(200).json({ message: "Count taxonomy successfully", taxonomy: taxonomyCount });
};

export const fetchFilterTags = async (req: Request, res: Response) => {
    const queries = [
        `SELECT DISTINCT group_species
         FROM ${SPECIES_TB}
         WHERE group_species IS NOT NULL
         ORDER BY group_species ASC`,
        `SELECT DISTINCT phylum
         FROM ${SPECIES_TB}
         WHERE phylum IS NOT NULL
         ORDER BY phylum ASC`,
        `SELECT DISTINCT class
         FROM ${SPECIES_TB}
         WHERE class IS NOT NULL
         ORDER BY class ASC`,
        `SELECT DISTINCT order_species
         FROM ${SPECIES_TB}
         WHERE order_species IS NOT NULL
         ORDER BY order_species ASC`,
        `SELECT DISTINCT family
         FROM ${SPECIES_TB}
         WHERE family IS NOT NULL
         ORDER BY family ASC`,
        `SELECT DISTINCT genus
         FROM ${SPECIES_TB}
         WHERE genus IS NOT NULL
         ORDER BY genus ASC`,
        `SELECT DISTINCT threatened_symbol
         FROM ${SPECIES_TB}
         WHERE threatened_symbol IS NOT NULL
         ORDER BY threatened_symbol ASC`,
    ];

    const [groups, phylums, classes, orders, families, genuses, threats] = await Promise.all(queries.map((q) => client.query(q)));

    return res.status(200).json({
        message: "Fetch filter tags successfully",
        tags: {
            group_species: groups?.rows.map((r) => r.group_species),
            phylum: phylums?.rows.map((r) => r.phylum),
            class: classes?.rows.map((r) => r.class),
            order_species: orders?.rows.map((r) => r.order_species),
            family: families?.rows.map((r) => r.family),
            genus: genuses?.rows.map((r) => r.genus),
            threatened_symbol: threats?.rows.map((r) => r.threatened_symbol),
        },
    });
};

export const fetchSpeciesAdmin = async (req: Request, res: Response) => {
    const order = req.body?.order;
    const dir = req.body?.dir;
    const cursor = req.body?.cursor;
    const isSearching = req.body?.isSearching;
    const orFilterConditions: string[] = [];
    const andFilterConditions: string[] = [];
    const speciesData: any[] = [];
    let nextCursor: Record<string, string> | null = null;
    const rowsLimit = 20;
    let paramIndex = 1;
    const aliasMap: Record<string, string> = {
        species: "scientific_name",
        name: "vietnamese_name",
    };

    if (dir && dir !== "asc" && dir !== "desc") {
        throw new AppError("[species/fetchSpeciesAdmin] Invalid cursor direction", 400);
    }

    // Filtering
    if (req.body) {
        for (const [key, value] of Object.entries(req.body)) {
            if (!SPECIES_COLUMNS.includes(key as (typeof SPECIES_COLUMNS)[number])) continue;

            if (value) {
                if (Array.isArray(value) && value.length === 0) continue;

                if (key === "species" || key === "name") {
                    orFilterConditions.push(`${key} ILIKE $${paramIndex}`);
                    speciesData.push(`%${value}%`);
                    paramIndex++;
                } else {
                    if (Array.isArray(value) && value.length > 1) {
                        const placeholders = value.map((_, i) => `$${paramIndex + i}`).join(", ");
                        andFilterConditions.push(`${key} IN (${placeholders})`);
                        value.forEach((v) => speciesData.push(v));
                        paramIndex += value.length;
                    } else {
                        andFilterConditions.push(`${key} = $${paramIndex}`);
                        speciesData.push(`${value}`);
                        paramIndex++;
                    }
                }
            }
        }
    }

    // Cursor pagination
    if (cursor) {
        if (cursor.value) {
            const comparisonOperator = dir === "asc" ? ">" : "<";
            andFilterConditions.push(
                `(s.${order} ${comparisonOperator} $${paramIndex} OR (s.${order} = $${paramIndex} AND s.id < $${paramIndex + 1}))`
            );
            speciesData.push(cursor.value);
            speciesData.push(cursor.id as string);
        } else {
            andFilterConditions.push(`s.id < $${paramIndex}`);
            speciesData.push(cursor.id as string);
        }
    }

    const columnSelected = isSearching
        ? ["s.id", "s.species as scientific_name", "s.name as vietnamese_name", "s.threatened_symbol", "s.group_species", "imgs.images"]
        : [
              "s.id",
              "s.species as scientific_name",
              "s.name as vietnamese_name",
              "s.group_species",
              "s.description",
              "s.threatened_symbol",
              "s.vn_distribution",
              "s.global_distribution",
              "s.phylum",
              "s.class",
              "s.order_species",
              "s.family",
              "s.genus",
              "s.references_text",
              "s.created_at",
              "s.updated_at",
              "imgs.images",
              "pts.points",
          ];

    // Sorting
    let sortOrder = "s.id DESC";
    if (order && dir) {
        sortOrder = `s.${order} ${dir}, ${sortOrder}`;
    }

    const fetchSpeciesQuery = `
        SELECT ${columnSelected.join(", ")}
        FROM ${SPECIES_TB} s
                 LEFT JOIN LATERAL (
            SELECT JSON_AGG(JSON_BUILD_OBJECT('public_id', i.public_id, 'image_url', i.image_url,
                                              'is_cover', i.is_cover)) AS images
            FROM ${IMAGE_TB} i
            WHERE i.species_id = s.id
                ) imgs ON true
                 LEFT JOIN LATERAL (
            SELECT JSON_AGG(JSON_BUILD_OBJECT('id', p.id, 'lat', p.lat, 'lng', p.lng)) AS points
            FROM ${POINTS_TB} p
            WHERE p.species_id = s.id
                ) pts ON true
        WHERE (${orFilterConditions.length > 0 ? orFilterConditions.join(" OR ") : "TRUE"})
          AND (${andFilterConditions.length > 0 ? andFilterConditions.join(" AND ") : "TRUE"})
        ORDER BY ${sortOrder} 
        LIMIT ${rowsLimit}
    `;

    const result = await client.query({
        text: fetchSpeciesQuery,
        values: speciesData,
    });

    // Create next cursor
    if (result.rows.length > 0 && result.rowCount === rowsLimit) {
        const lastRow = result.rows[rowsLimit - 1];
        const columnAlias = aliasMap[order] || order;
        nextCursor = { id: lastRow.id, value: order ? lastRow[columnAlias] : null };
    }

    return res.status(200).json({
        message: "Fetch species successfully",
        species: result.rows,
        cursor: nextCursor,
    });
};

export const addSpecies = async (req: Request, res: Response) => {
    const name = req.body?.species;
    const files = req.files;
    let coverImageIndex = req.body?.coverImageIndex;
    const imageFiles = files && "images" in files ? files["images"] : undefined;
    const locationFile = files && "location" in files ? files["location"]?.[0] : undefined;
    const publicIdOfUploadedImages: string[] = [];
    const secureUrlOfUploadedImages: string[] = [];
    const points: [number, number][] = [];

    if (
        imageFiles &&
        (coverImageIndex === undefined ||
            isNaN(Number(coverImageIndex)) ||
            Number(coverImageIndex) < 0 ||
            Number(coverImageIndex) >= imageFiles.length)
    ) {
        await clearupTmpFiles(files as InputFiles | undefined);
        throw new AppError("[species/addSpecies] Missing or invalid cover image index", 400);
    } else if (imageFiles) {
        coverImageIndex = Number(coverImageIndex);
    }

    if (!name) {
        await clearupTmpFiles(files as InputFiles | undefined);
        throw new AppError("[species/addSpecies] Species (name) field is required", 400);
    }
    // Checking duplicate species name
    const checkSpecies = await client.query({
        text: `SELECT 1
               FROM ${SPECIES_TB}
               WHERE species = $1`,
        values: [name],
    });

    if (checkSpecies.rowCount !== null && checkSpecies.rowCount > 0) {
        await clearupTmpFiles(files as InputFiles | undefined);
        throw new AppError("[species/addSpecies] Species already exists", 400);
    }

    // Checking location file and parse points
    if (locationFile) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(locationFile.path);
        const worksheet = workbook.worksheets[0];

        const headerRow = worksheet?.getRow(1);
        if (headerRow?.getCell(1).value !== "lat" && headerRow?.getCell(2).value !== "lng") {
            throw new AppError("[species/addSpecies] Invalid structure file", 400);
        }

        const rowCount = worksheet?.rowCount || 0;
        for (let rowNumber = 2; rowNumber <= rowCount; rowNumber++) {
            const lat = worksheet?.getRow(rowNumber).getCell(1).value as number;
            const lng = worksheet?.getRow(rowNumber).getCell(2).value as number;

            if (!isValidLatLng(lat, lng)) {
                await clearupTmpFiles(files as InputFiles | undefined);
                throw new AppError("[points/createPoint] Invalid lat/lng", 400);
            }

            points.push([lat, lng]);
        }
    }

    // Insert species, images, points in a transaction
    try {
        await client.query("BEGIN");

        const speciesColumns: string[] = [];
        const speciesData: any[] = [];
        const paramIndexes: string[] = [];
        let paramIndex = 1;

        for (const [key, value] of Object.entries(req.body)) {
            if (!SPECIES_COLUMNS.includes(key as (typeof SPECIES_COLUMNS)[number])) continue;

            if (value) {
                speciesColumns.push(key);
                // Trim only if the value is a string, otherwise keep the value as-is
                if (typeof value === "string") {
                    speciesData.push(value.trim());
                } else {
                    speciesData.push(value);
                }
                paramIndexes.push(`$${paramIndex}`);
                paramIndex++;
            }
        }

        const insertSpeciesQuery = `INSERT INTO ${SPECIES_TB} (${speciesColumns.join(", ")})
                                    VALUES (${paramIndexes.join(", ")}) RETURNING *`;

        // Insert species
        const insertedSpeciesResult = await client.query(insertSpeciesQuery, speciesData);
        const { id: speciesId } = insertedSpeciesResult.rows[0];

        if (imageFiles && imageFiles.length > 0) {
            const insertImageQuery = `INSERT INTO ${IMAGE_TB}
                                      VALUES ($1, $2, $3, $4) RETURNING *`;
            // Upload images to cloudinary
            for (const image of imageFiles) {
                const imageRes = await uploadImage(image.path);
                if (!imageRes.public_id || !imageRes.secure_url) {
                    await clearupTmpFiles(files as InputFiles | undefined);
                    for (const public_id of publicIdOfUploadedImages) {
                        await destroyImage(public_id);
                    }
                    throw new AppError("[species/addSpecies] Failed to upload image", 503);
                }
                publicIdOfUploadedImages.push(imageRes.public_id);
                secureUrlOfUploadedImages.push(imageRes.secure_url);
            }

            // Insert images
            for (let i = 0; i < publicIdOfUploadedImages.length; i++) {
                const publicId = publicIdOfUploadedImages[i];
                const secureUrl = secureUrlOfUploadedImages[i];
                await client.query(insertImageQuery, [publicId, speciesId, secureUrl, i === coverImageIndex]);
            }
        }

        if (points.length > 0) {
            const insertPointQuery = `INSERT INTO ${POINTS_TB} (species_id, lat, lng)
                                      VALUES ($1, $2, $3) RETURNING *`;

            // Insert points
            for (const [lat, lng] of points) {
                await client.query(insertPointQuery, [speciesId, lat, lng]);
            }
        }

        await client.query("COMMIT");
        await clearupTmpFiles(files as InputFiles | undefined);

        return res.status(201).json({
            message: "Create species successfully",
        });
    } catch (error) {
        await client.query("ROLLBACK");
        await clearupTmpFiles(files as InputFiles | undefined);
        throw error;
    }
};

export const updateSpecies = async (req: Request, res: Response) => {
    const { id: speciesId } = req.params;
    const name = req.body?.species;
    const files = req.files;
    let coverImageIndex = req.body?.coverImageIndex;
    const imageFiles = files && "images" in files ? files["images"] : undefined;
    const locationFile = files && "location" in files ? files["location"]?.[0] : undefined;
    const publicIdOfUploadedImages: string[] = [];
    const secureUrlOfUploadedImages: string[] = [];
    const points: [number, number][] = [];

    if (
        imageFiles &&
        (coverImageIndex === undefined ||
            isNaN(Number(coverImageIndex)) ||
            Number(coverImageIndex) < 0 ||
            Number(coverImageIndex) >= imageFiles.length)
    ) {
        await clearupTmpFiles(files as InputFiles | undefined);
        throw new AppError("[species/addSpecies] Missing or invalid cover image index", 400);
    } else if (imageFiles) {
        coverImageIndex = Number(coverImageIndex);
    }

    if (!name) {
        await clearupTmpFiles(files as InputFiles | undefined);
        throw new AppError("[species/addSpecies] Species (name) field is required", 400);
    }

    // Checking duplicate species name
    const checkSpecies = await client.query({
        text: `SELECT 1
               FROM ${SPECIES_TB}
               WHERE species = $1
                 AND id <> $2`,
        values: [name, speciesId],
    });

    if (checkSpecies.rowCount !== null && checkSpecies.rowCount > 0) {
        await clearupTmpFiles(files as InputFiles | undefined);
        throw new AppError("[species/addSpecies] Species already exists", 400);
    }

    // Checking location file and parse points
    if (locationFile) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(locationFile.path);
        const worksheet = workbook.worksheets[0];

        const headerRow = worksheet?.getRow(1);
        if (headerRow?.getCell(1).value !== "lat" && headerRow?.getCell(2).value !== "lng") {
            throw new AppError("[species/addSpecies] Invalid structure file", 400);
        }

        const rowCount = worksheet?.rowCount || 0;
        for (let rowNumber = 2; rowNumber <= rowCount; rowNumber++) {
            const lat = worksheet?.getRow(rowNumber).getCell(1).value as number;
            const lng = worksheet?.getRow(rowNumber).getCell(2).value as number;

            if (!isValidLatLng(lat, lng)) {
                await clearupTmpFiles(files as InputFiles | undefined);
                throw new AppError("[points/createPoint] Invalid lat/lng", 400);
            }

            points.push([lat, lng]);
        }
    }

    // Update species, images, points in a transaction
    try {
        await client.query("BEGIN");

        if (imageFiles && imageFiles.length > 0) {
            // Delete old images
            const fetchPublicIdsQuery = `SELECT public_id
                                         FROM ${IMAGE_TB}
                                         WHERE species_id = $1`;

            // Fetch existing image public ids
            const fetchedPublicIdsResult = await client.query({
                text: fetchPublicIdsQuery,
                values: [speciesId],
            });

            // Destroy old images from cloudinary
            const destroyRes = fetchedPublicIdsResult.rows.map((row) => destroyImage(row.public_id));
            await Promise.all(destroyRes);

            // Delete old images from database
            for (const row of fetchedPublicIdsResult.rows) {
                await client.query({
                    name: "delete-image",
                    text: `DELETE
                       FROM ${IMAGE_TB}
                       WHERE public_id = $1`,
                    values: [row.public_id],
                });
            }

            // Update new images
            const insertImageQuery = `INSERT INTO ${IMAGE_TB}
                                  VALUES ($1, $2, $3, $4) RETURNING *`;

            // Upload new images to cloudinary
            for (const image of imageFiles) {
                const imageRes = await uploadImage(image.path);
                if (!imageRes.public_id || !imageRes.secure_url) {
                    await clearupTmpFiles(files as InputFiles | undefined);
                    for (const public_id of publicIdOfUploadedImages) {
                        await destroyImage(public_id);
                    }
                    throw new AppError("[species/addSpecies] Failed to upload image", 503);
                }
                publicIdOfUploadedImages.push(imageRes.public_id);
                secureUrlOfUploadedImages.push(imageRes.secure_url);
            }

            // Insert new images
            for (let i = 0; i < publicIdOfUploadedImages.length; i++) {
                const publicId = publicIdOfUploadedImages[i];
                const secureUrl = secureUrlOfUploadedImages[i];
                await client.query(insertImageQuery, [publicId, speciesId, secureUrl, i === coverImageIndex]);
            }
        }

        if (locationFile && points.length > 0) {
            // Delete old points
            const fetchPointIdsQuery = `SELECT id
                                        FROM ${POINTS_TB}
                                        WHERE species_id = $1`;
            // Fetch existing point ids
            const fetchedPointIdsResult = await client.query({
                name: "fetch-existing-point-ids",
                text: fetchPointIdsQuery,
                values: [speciesId],
            });

            // Delete old points

            for (const row of fetchedPointIdsResult.rows) {
                await client.query({
                    name: "delete-point",
                    text: `DELETE
                           FROM ${POINTS_TB}
                           WHERE id = $1`,
                    values: [row.id],
                });
            }

            // Insert new points
            const insertPointQuery = `INSERT INTO ${POINTS_TB} (species_id, lat, lng)
                                  VALUES ($1, $2, $3) RETURNING *`;

            for (const [lat, lng] of points) {
                await client.query(insertPointQuery, [speciesId, lat, lng]);
            }
        }

        // Insert new species
        const setClauses: string[] = [];
        const speciesData: any[] = [];
        let paramIndex = 1;

        for (const [key, value] of Object.entries(req.body)) {
            if (!SPECIES_COLUMNS.includes(key as (typeof SPECIES_COLUMNS)[number])) continue;

            if (value) {
                setClauses.push(`${key} = $${paramIndex}`);
                if (typeof value === "string") {
                    speciesData.push(value.trim());
                } else {
                    speciesData.push(value);
                }
                paramIndex++;
            }
        }

        if (setClauses.length === 0) {
            await client.query("COMMIT");
            await clearupTmpFiles(files as InputFiles | undefined);
            return res.status(200).json({ message: "Update species successfully" });
        }

        speciesData.push(speciesId);
        const updateSpeciesQuery = `UPDATE ${SPECIES_TB}
                                    SET ${setClauses.join(", ")}
                                    WHERE id = $${paramIndex}`;

        //   Update species
        await client.query(updateSpeciesQuery, speciesData);
        await client.query("COMMIT");
        await clearupTmpFiles(files as InputFiles | undefined);

        return res.status(200).json({ message: "Update species successfully" });
    } catch (error) {
        await client.query("ROLLBACK");
        await clearupTmpFiles(files as InputFiles | undefined);
        throw error;
    }
};

export const deleteSpecies = async (req: Request, res: Response) => {
    const { id: speciesId } = req.params;

    // Fetch existing image public ids
    const fetchedPublicIdsResult = await client.query({
        name: "fetch-existing-image-public-ids",
        text: `SELECT public_id
               FROM ${IMAGE_TB}
               WHERE species_id = $1`,
        values: [speciesId],
    });

    // Destroy old images from cloudinary
    const destroyRes = fetchedPublicIdsResult.rows.map((row) => destroyImage(row.public_id));
    await Promise.all(destroyRes);

    await client.query({
        name: "delete-species",
        text: `DELETE
               FROM ${SPECIES_TB}
               WHERE id = $1`,
        values: [speciesId],
    });

    return res.status(200).json({ message: "Delete species successfully" });
};

export const importSpeciesDataFromFile = async (req: Request, res: Response) => {
    const file = req.file;

    if (!file) {
        throw new AppError("[species/importSpeciesDataFromFile] Missing file", 400);
    }

    const logs: { rowNumber: number; messages: string[] }[] = [];
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(file.path);
    const worksheet = workbook.worksheets[0];
    const speciesDataMap: Record<string, Record<string, any>> = {};

    const columns = [
        "species",
        "name",
        "group",
        "description",
        "characteristic",
        "habitas",
        "impact",
        "threatened_symbol",
        "vn_distribution",
        "global_distribution",
        "phylum",
        "class",
        "order",
        "family",
        "genus",
        "references",
        "lat",
        "long",
    ];

    const headerRow = worksheet?.getRow(1);
    if (
        headerRow?.getCell(1).text !== columns[0] ||
        headerRow?.getCell(2).text !== columns[1] ||
        headerRow?.getCell(3).text !== columns[2] ||
        headerRow?.getCell(4).text !== columns[3] ||
        headerRow?.getCell(5).text !== columns[4] ||
        headerRow?.getCell(6).text !== columns[5] ||
        headerRow?.getCell(7).text !== columns[6] ||
        headerRow?.getCell(8).text !== columns[7] ||
        headerRow?.getCell(9).text !== columns[8] ||
        headerRow?.getCell(10).text !== columns[9] ||
        headerRow?.getCell(11).text !== columns[10] ||
        headerRow?.getCell(12).text !== columns[11] ||
        headerRow?.getCell(13).text !== columns[12] ||
        headerRow?.getCell(14).text !== columns[13] ||
        headerRow?.getCell(15).text !== columns[14] ||
        headerRow?.getCell(16).text !== columns[15] ||
        headerRow?.getCell(17).text !== columns[16] ||
        headerRow?.getCell(18).text !== columns[17]
    ) {
        await fs.rm(file.path);
        throw new AppError(
            "[species/checkSpeciesImportFile] Invalid structure file: A1=species; B1=name; C1=group; D1=description; E1=characteristic; F1=habitas; G1=impact; H1=threatened_symbol; I1=vn_distribution; J1=global_distribution; K1=phylum; L1=class; M1=order; N1=family; O1=genus; P1=references; Q1=lat; R1=long",
            400
        );
    }

    const rowCount = worksheet?.rowCount || 0;
    const startCheckTime = Date.now();

    for (let rowNumber = 2; rowNumber <= rowCount; rowNumber++) {
        const species = worksheet?.getRow(rowNumber).getCell(1).text;
        const threatenedSymbol = worksheet?.getRow(rowNumber).getCell(8).text;
        const lat = worksheet?.getRow(rowNumber).getCell(17).text;
        const lng = worksheet?.getRow(rowNumber).getCell(18).text;
        const messages: string[] = [];

        // Validate required fields
        if (species === "") {
            messages.push("Missing species name");
        } else {
            if (!speciesDataMap[species!]) {
                // Check duplicate species name
                const checkSpecies = await client.query({
                    name: "check-species-exists",
                    text: `
                        SELECT 1
                        FROM ${SPECIES_TB}
                        WHERE species = $1`,
                    values: [species],
                });

                if (checkSpecies.rowCount !== null && checkSpecies.rowCount > 0) {
                    messages.push("Species name already exists");
                }

                // Check threatened symbol
                if (threatenedSymbol === "") {
                    messages.push("Missing threatened symbol");
                }
            }

            // Validate lat/lng
            if (lat && lng) {
                const latNum = extractNumber(lat);
                const lngNum = extractNumber(lng);
                const isValid = isValidLatLng(Number(latNum), Number(lngNum));

                if (!latNum || !lngNum || !isValid) {
                    messages.push("Invalid lat/long");
                }
            }
        }

        if (messages.length > 0) {
            logs.push({ rowNumber, messages });
        } else if (species) {
            if (speciesDataMap[species] === undefined) {
                const initialSpecies: Record<string, any> = { points: [] };
                worksheet?.getRow(rowNumber).eachCell((cell, colNumber) => {
                    const cellValue = cell.text;
                    let colName = columns[colNumber - 1];

                    if (colName === "group") {
                        colName = "group_species";
                    } else if (colName === "order") {
                        colName = "order_species";
                    } else if (colName === "references") {
                        colName = "references_text";
                    }

                    if (cellValue !== "" && colName && colNumber <= 16) {
                        initialSpecies[colName] = cellValue;
                    }
                });
                speciesDataMap[species] = initialSpecies;
            }

            if (lat && lng) {
                const latNum = Number(extractNumber(lat));
                const lngNum = Number(extractNumber(lng));
                speciesDataMap[species].points.push([latNum, lngNum]);
            }
        }
    }

    if (logs.length > 0) {
        await fs.rm(file.path);
        return res.status(400).json({ message: "File has invalid data", logs });
    }

    await fs.rm(file.path);

    // Insert species and points in a transaction
    try {
        await client.query("BEGIN");

        await Promise.all(
            Object.values(speciesDataMap).map(async (species) => {
                const speciesColumns: string[] = [];
                const speciesData: any[] = [];
                const paramIndexes: string[] = [];
                let paramIndex = 1;

                for (const [key, value] of Object.entries(species)) {
                    if (key === "points") continue;

                    if (value) {
                        speciesColumns.push(key);
                        // Trim only if the value is a string, otherwise keep the value as-is
                        if (typeof value === "string") {
                            speciesData.push(value.trim());
                        } else {
                            speciesData.push(value);
                        }
                        paramIndexes.push(`$${paramIndex}`);
                        paramIndex++;
                    }
                }

                const insertSpeciesQuery = `INSERT INTO ${SPECIES_TB} (${speciesColumns.join(", ")})
                                            VALUES (${paramIndexes.join(", ")}) RETURNING id`;
                const insertPointQuery = `INSERT INTO ${POINTS_TB} (species_id, lat, lng)
                                          VALUES ($1, $2, $3)`;

                // Insert species
                const insertedSpeciesResult = await client.query(insertSpeciesQuery, speciesData);
                const { id: speciesId } = insertedSpeciesResult.rows[0];

                if (species.points.length > 0) {
                    await Promise.all(
                        species.points.map(([lat, lng]: [number, number]) => client.query(insertPointQuery, [speciesId, lat, lng]))
                    );
                }
            })
        );

        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    }

    return res.status(201).json({ message: "Import species data successfully" });
};
