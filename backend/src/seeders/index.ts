import "dotenv/config";

import {conn, disconnect} from "../libs/db.js";
import {adminSeeder} from "./scripts/adminSeeder.js";

const main = async () => {
    await conn();
    const args = process.argv[2];

    if (args === "run") {
        await adminSeeder.seed()
    } else if (args === "clear") {
        await adminSeeder.clear()
    }
};

main().catch((e) => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await disconnect();
    process.exit(0);
});