import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

import { client } from "../../libs/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const runSqlFile = async () => {
    try {
        const filePath = path.join(__dirname, "..", "data", "schema.sql");
        const sql = await fs.readFile(filePath, "utf-8");
        await client.query(sql);
        console.log("Database schema built successfully");
    } catch (error) {
        console.log("An error occurred while building to the database schema: ", error);
    }
};
