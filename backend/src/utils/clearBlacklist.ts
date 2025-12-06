import { client } from "../libs/db.js";

const BLACKLIST_TB = process.env.PG_BLACKLIST_TB;
export const clearBlacklist = async () => {
    try {
        const result = await client.query({
            text: `DELETE
                   FROM ${BLACKLIST_TB}
                   WHERE expiration_time < NOW() RETURNING *`,
        });
        console.log(`🧹 Deleted ${result.rowCount} expired tokens from blacklist`);
    } catch (error) {
        console.error("Error clearing blacklist:", error);
    }
};
