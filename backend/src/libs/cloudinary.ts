import { type UploadApiOptions, type UploadApiResponse } from "cloudinary";
import cloudinary from "../configs/cloudinary.js";

const uploadConfig: UploadApiOptions = {
    use_filename: true,
    overwrite: true,
    resource_type: "image",
};

export const uploadImage = async (path: string): Promise<UploadApiResponse> => {
    try {
        const response = await cloudinary.uploader.upload(path, uploadConfig);
        return response;
    } catch (error) {
        throw error;
    }
};

export const destroyImage = async (public_id: string): Promise<UploadApiResponse> => {
    try {
        const response = await cloudinary.uploader.destroy(public_id, uploadConfig);
        return response;
    } catch (error) {
        throw error;
    }
};
