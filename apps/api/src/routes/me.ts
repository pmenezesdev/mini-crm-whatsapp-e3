import { Router } from "express";
import type { MeDTO } from "@e3/shared";
import { requireAuth } from "../middleware/auth.js";

export const meRouter = Router();

meRouter.get("/me", requireAuth, (req, res) => {
  const user = req.user!;

  const dto: MeDTO = {
    id: user.id,
    email: user.email,
    name: user.name,
    unit: { id: user.unitId, name: user.unitName },
  };

  res.json(dto);
});
