import type { NextFunction, Request, Response } from "express";
import { firebaseAuth } from "../lib/firebase.js";
import { prisma } from "../lib/prisma.js";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  unitId: string;
  unitName: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.header("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token de autenticacao ausente." });
    return;
  }

  const idToken = authHeader.slice("Bearer ".length);

  try {
    const decoded = await firebaseAuth.verifyIdToken(idToken);
    const email = decoded.email;

    if (!email) {
      res.status(401).json({ error: "Token invalido: email ausente." });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { unit: true },
    });

    if (!user) {
      res.status(403).json({
        error: "Usuario autenticado, mas nao vinculado a nenhuma unidade. Contate o administrador.",
      });
      return;
    }

    if (!user.firebaseUid) {
      await prisma.user.update({
        where: { id: user.id },
        data: { firebaseUid: decoded.uid },
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      unitId: user.unitId,
      unitName: user.unit.name,
    };

    next();
  } catch (err) {
    res.status(401).json({ error: "Token invalido ou expirado." });
  }
}
