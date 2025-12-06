import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { RateLimitInfo } from "express-rate-limit";

import { AppError } from "../utils/appError.js";
import { client } from "../libs/db.js";

declare global {
    namespace Express {
        interface Request {
            rateLimit?: RateLimitInfo;
        }
    }
}

const ADMIN_TB = process.env.PG_ADMIN_TB;
const BLACKLIST_TB = process.env.PG_BLACKLIST_TB;

export const login = async (req: Request, res: Response) => {
    const { username, password } = req.body;
    const remainingAttempts: number | undefined = req.rateLimit?.remaining;

    if (remainingAttempts === 0) {
        return res.status(429).json({ message: "Too many login attempts from this IP, please try again after 15 minutes" });
    }

    // Checking required fields
    if (!username || !password) {
        throw new AppError("[auth/login] Both username and password fields are required", 400);
    }

    // Get admin account
    const adminAccount = await client.query({
        name: "getAdminAccount",
        text: `SELECT *
               FROM ${ADMIN_TB}
               WHERE username = $1`,
        values: [username],
    });

    if (adminAccount.rowCount === 0) {
        return res.status(401).json({ message: `Username or password is incorrect, you have ${remainingAttempts} attempts remaining` });
    }

    const isCorrectPassword = await bcrypt.compare(password, adminAccount.rows[0].password);

    if (!isCorrectPassword) {
        return res.status(401).json({ message: `Username or password is incorrect, you have ${remainingAttempts} attempts remaining` });
    }

    // Generate token
    const token = jwt.sign({ username }, process.env.JWT_SECRET as string, {
        expiresIn: "1d",
    });

    return res.status(200).json({
        message: "Login successfully",
        username,
        token,
    });
};

export const logout = async (req: Request, res: Response) => {
    // Get token from headers
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader!.split(" ")[1];
    const decoded = jwt.decode(token as string);

    // Convert expiration (seconds) to datetime
    const expSeconds = (decoded as { exp: number }).exp;
    const expirationTime = new Date(expSeconds * 1000);

    // Add token to blacklist
    await client.query({
        text: `INSERT INTO ${BLACKLIST_TB}
               VALUES ($1, $2)`,
        values: [token, expirationTime],
    });

    return res.status(200).json({ message: "Logout successfully" });
};

export const changePassword = async (req: Request, res: Response) => {
    const { username, password, newPassword, confirmPassword } = req.body;

    // Checking required fields
    if (!username || !password || !newPassword || !confirmPassword) {
        throw new AppError("[auth/changePassword] Username, password, newPassword and confirmPassword fields are required", 400);
    }

    if (newPassword.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
        throw new AppError("[auth/changePassword] New password must be at least 8 characters with uppercase, lowercase and number", 400);
    }

    if (confirmPassword !== newPassword) {
        throw new AppError("[auth/changePassword] Confirm password is incorrect", 400);
    }

    // Checking account
    const adminAccount = await client.query({
        name: "getAdminAccount",
        text: `SELECT *
               FROM ${ADMIN_TB}
               WHERE username = $1`,
        values: [username],
    });

    if (adminAccount.rowCount === 0) {
        throw new AppError("[auth/changePassword] Username or password is incorrect", 401);
    }

    const isCorrectPassword = await bcrypt.compare(password, adminAccount.rows[0].password);

    if (!isCorrectPassword) {
        throw new AppError("[auth/changePassword] Username or password is incorrect", 401);
    }

    // Update password
    const hashed = await bcrypt.hash(newPassword, 10);
    await client.query({
        text: `UPDATE ${ADMIN_TB}
               SET password = $1
               WHERE username = $2`,
        values: [hashed, username],
    });

    return res.status(200).json({
        message: "Change password successfully",
    });
};
