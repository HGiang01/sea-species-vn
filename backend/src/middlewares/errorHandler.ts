import type { NextFunction, Request, Response } from "express";

import { AppError } from "../utils/appError.js";

export const errorHandler = async (error: any, req: Request, res: Response, next: NextFunction) => {
    console.error(error);

    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            status: "error",
            message: error.message.slice(error.message.indexOf("]") + 2),
        });
    }

    return res.status(500).json({
        status: "error",
        message: "Internal Server Error",
    });
};
