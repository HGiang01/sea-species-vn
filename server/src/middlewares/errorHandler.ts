import type {NextFunction, Request, Response} from "express";

import {AppError} from "../utils/appError.js";

export const errorHandler = (
    error: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.log("❌ Error: ", error);

    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            status: "error",
            message: error.message,
        });
    }

    return res.status(500).json({
        status: "error",
        message: "Internal Server Error",
    });
};