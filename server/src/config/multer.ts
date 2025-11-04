import path from "path";
import fs from "fs/promises";
import multer, {type FileFilterCallback} from "multer";
import {type Request} from "express";

const __dirname = path.resolve();
const storagePath = path.join(__dirname, "/src/tmp");

// create storage directory
await fs.mkdir(storagePath, {recursive: true});

const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, storagePath);
    },
    filename: (req, file, cb) => {
        // create unique name for file
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        const nameWithoutExt = path.basename(file.originalname, ext);
        cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
    },
});

const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
) => {
    const acceptedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (acceptedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only JPEG, PNG, JPG and WEBP are allowed"));
    }
};

export const uploadMemory = multer({
    storage: diskStorage,
    limits: {
        fileSize: 1024 * 1024 * Number(process.env.MAX_FILE_SIZE_OF_IMG),
    },
    fileFilter,
});