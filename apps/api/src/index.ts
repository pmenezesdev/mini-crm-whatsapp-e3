import "dotenv/config";
import cors from "cors";
import express from "express";
import { logger } from "./lib/logger.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);
const corsOrigin = process.env.CORS_ORIGIN?.split(",") ?? "*";

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  logger.info(`API rodando em http://localhost:${port}`);
});
