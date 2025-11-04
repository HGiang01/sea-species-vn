import "dotenv/config";
import path from "path";
import express from "express";
import cors from "cors";

// Configs
const PORT = process.env.PORT || 3000;
const __dirname = path.resolve();

// Init app
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes

// Start server
app.listen(PORT, () => {
  console.log(`💻 Server is listening in port: ${PORT}`);
});