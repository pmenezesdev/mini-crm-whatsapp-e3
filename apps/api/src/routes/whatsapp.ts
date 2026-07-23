import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getWhatsappStatus } from "../whatsapp/connection.js";

export const whatsappRouter = Router();

whatsappRouter.get("/whatsapp/status", requireAuth, async (_req, res) => {
  const status = await getWhatsappStatus();
  res.json(status);
});
