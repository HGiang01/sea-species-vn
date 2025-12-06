import type { Request, Response, NextFunction, RequestHandler } from "express";

type AsyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => RequestHandler;

export const asyncHandler: AsyncHandler = (fn) => {
    return async (req, res, next) => {
        try {
            await fn(req, res, next);
        } catch (error) {
            next(error);
        }
    };
};
