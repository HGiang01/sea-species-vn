import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { client } from "../libs/db.js";

const BLACKLIST_TB = process.env.PG_BLACKLIST_TB;
export const protectRoute = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get token from headers
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }

        // Authorization: Bearer <token>
        const token = authHeader.split(" ")[1];

        // Verify token
        jwt.verify(token!, process.env.JWT_SECRET as string, (error) => {
            if (error) {
                return res.status(401).json({ message: "Unauthorized: Invalid token" });
            }
        });

        // Check if token is blacklisted
        const isBlacklisted = await client.query({
            text: `SELECT * FROM ${BLACKLIST_TB} WHERE token = $1`,
            values: [token],
        });

        if (isBlacklisted.rowCount! > 0) {
            return res.status(401).json({ message: "Unauthorized: Token is blacklisted" });
        }

        next();
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
