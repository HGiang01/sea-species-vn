import "dotenv/config";
import path from "path";
import express from "express";
import cors from "cors";

import { conn } from "./lib/db.js";
import authRoute from "./routes/auth.route.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { clearBlacklist } from "./utils/clearBlacklist.js";

// Configs
const PORT = process.env.PORT || 3000;
const __dirname = path.resolve();

// Init app
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Connect database
const isConnectedDB = await conn();

// Routes
app.use("/api/auth", authRoute);
app.use(errorHandler);

// Clear blacklist tokens at startup
await clearBlacklist();

// Start server
isConnectedDB &&
    app.listen(PORT, () => {
        console.log(`💻 Server is listening in port: ${PORT}`);
    });
