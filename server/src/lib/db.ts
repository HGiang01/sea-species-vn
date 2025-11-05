import {Client} from "pg";

import {pgConfig} from "../config/db.js";

export const client = new Client(pgConfig);

client.on("error", (err) => {
    console.error("Database connection error:", err);
});

export const conn = async (): Promise<boolean> => {
    try {
        await client.connect();
        console.log("🐘 Connected to PostgreSQL");

        return true;
    } catch (error) {
        if (error instanceof Error) {
            console.log(
                "An error occurred while connecting to the database: ",
                error.message
            );
        } else {
            console.log(
                "An error occurred while connecting to the database: ",
                error
            );
        }
        return false;
    }
};

// Disconnect client
export const disconnect = async (): Promise<void> => {
    await client.end();
    console.log("🐘 Disconnected from PostgreSQL");
};