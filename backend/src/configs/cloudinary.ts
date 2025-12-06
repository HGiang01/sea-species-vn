import { v2 } from "cloudinary";

v2.config({
    cloud_name: process.env.CLOUDINARY_NAME as string,
    api_key: process.env.CLOUDINARY_API_KEY as string,
    api_secret: process.env.CLOUDINARY_API_SECRET_KEY as string,
});

export default v2;
