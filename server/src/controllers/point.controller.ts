import { type Request, type Response } from "express";
import { type QueryResult } from "pg";

import { AppError } from "../utils/appError.js";
import { client } from "../lib/db.js";

const TABLE = process.env.PG_POINTS_TB;

const isValidLatLng = (lat: number, lng: number) =>
    Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

export const getPoints = async (req: Request, res: Response): Promise<Response> => {
    const { speciesId } = req.params;

    const result: QueryResult = await client.query({
        name: "get-all-points",
        text: `SELECT id, lat, lng FROM ${TABLE} WHERE species_id = $1`,
        values: [speciesId],
    });

    return res.status(200).json({
        message: "Get all species distribution points successfully",
        points: result.rows,
    });
};

export const createPoint = async (req: Request, res: Response): Promise<Response> => {
    const { speciesId } = req.params;
    const latNum = Number(req.body?.lat);
    const lngNum = Number(req.body?.lng);

    if (!isValidLatLng(latNum, lngNum)) {
        throw new AppError("[points/createPoint] Invalid lat/lng", 400);
    }

    const result: QueryResult = await client.query({
        name: "create-points",
        text: `INSERT INTO ${TABLE} (species_id, lat, lng) VALUES ($1, $2, $3) RETURNING *`,
        values: [speciesId, latNum, lngNum],
    });

    return res.status(201).json({
        message: "Create species distribution points successfully",
        point: result.rows[0],
    });
};

export const updatePoint = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const latNum = Number(req.body?.lat);
    const lngNum = Number(req.body?.lng);

    if (!isValidLatLng(latNum, lngNum)) {
        throw new AppError("[points/updatePoint] Invalid lat/lng", 400);
    }

    const result: QueryResult = await client.query({
        name: "update-points",
        text: `UPDATE ${TABLE} SET lat = $1, lng = $2 WHERE id = $3 RETURNING *`,
        values: [latNum, lngNum, id],
    });

    if (result.rowCount === 0) {
        throw new AppError("[points/updatePoint] Point not found", 404);
    }

    return res.status(200).json({
        message: "Update species distribution points successfully",
        point: result.rows[0],
    });
};

export const deletePoint = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;

    const result: QueryResult = await client.query({
        name: "delete-points",
        text: `DELETE FROM ${TABLE} WHERE id = $1`,
        values: [id],
    });

    if (result.rowCount === 0) {
        throw new AppError("[points/deletePoint] Point not found", 404);
    }

    return res.status(200).json({
        message: "Delete species distribution points successfully",
    });
};
