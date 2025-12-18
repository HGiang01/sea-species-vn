import "dotenv/config";
import express from "express";
import cors from "cors";

import { conn } from "./libs/db.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { clearBlacklist } from "./utils/clearBlacklist.js";
import authRoute from "./routes/auth.route.js";
import speciesRouter from "./routes/species.route.js";

// Configs
const PORT = process.env.PORT || 3000;

// Init app
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Connect database
const isConnectedDB = await conn();

// Routes
app.use("/api/auth", authRoute);
app.use("/api/species", speciesRouter);
app.use(errorHandler);

// Serve frontend static files
app.use(express.static("public/dist"));

// Clear blacklist tokens at startup
await clearBlacklist();

// Start server
isConnectedDB &&
    app.listen(PORT, () => {
        console.log(`💻 Server is listening in port: ${PORT}`);
    });
