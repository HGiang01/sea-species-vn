import { type ClientConfig } from "pg";

export const pgConfig: ClientConfig = {
    user: process.env.PG_USERNAME,
    password: String(process.env.PG_PASSWORD),
    host: process.env.PG_HOST,
    port: Number(process.env.PG_PORT),
    database: process.env.PG_DATABASE,
    ssl: {
        rejectUnauthorized: process.env.NODE_ENV === "production"
    }
};
