import bcrypt from "bcrypt";

import {client} from "../../libs/db.js";
import {adminData} from "../data/admin.js";

const ADMIN_DB = process.env.PG_ADMIN_TB;

export const adminSeeder = {
    seed: async () => {
        const existingAdmin = await client.query({
            text: `SELECT 1
                   FROM ${ADMIN_DB}
                   WHERE username = $1`,
            values: [adminData.username]
        })

        if (existingAdmin.rowCount === 1) {
            console.log('Admin account is already exist');
            return;
        }

        const hashed = await bcrypt.hash(adminData.password, 10);
        await client.query({
            text: `INSERT INTO ${ADMIN_DB}
                   VALUES ($1, $2)`,
            values: [adminData.username, hashed]
        })

        console.log("Admin account created");
        return;
    },
    clear: async () => {
        await client.query({
            text: `DELETE
                   FROM ${ADMIN_DB}
                   WHERE username = $1`,
            values: [adminData.username]
        });

        console.log("Admin account deleted");
        return;
    }
}