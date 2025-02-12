import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import aiRouter from "./routes/aiRoute.js";

// Create Express app
const app = express();

// Middleware Configuration
app.use(cors());

// Body parser configuration
app.use(bodyParser.json());

// Routes
app.use("/ai", aiRouter);

// Error 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

export default app;
