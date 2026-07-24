import { Router } from "express";
import type { ConversationDTO, MessageDTO } from "@e3/shared";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const conversationsRouter = Router();

conversationsRouter.get("/conversations", requireAuth, async (req, res) => {
  const { unitId } = req.user!;

  const conversations = await prisma.conversation.findMany({
    where: { unitId },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        orderBy: [{ timestamp: "desc" }, { createdAt: "desc" }],
        take: 1,
      },
    },
  });

  const dto: ConversationDTO[] = conversations.map((c) => ({
    id: c.id,
    contactName: c.contactName,
    whatsappJid: c.whatsappJid,
    lastMessagePreview: c.messages[0]?.body ?? null,
    updatedAt: c.updatedAt.toISOString(),
  }));

  res.json(dto);
});

conversationsRouter.get("/conversations/:id/messages", requireAuth, async (req, res) => {
  const { unitId } = req.user!;
  const id = String(req.params.id);

  const conversation = await prisma.conversation.findUnique({ where: { id } });

  if (!conversation || conversation.unitId !== unitId) {
    res.status(403).json({ error: "Conversa nao encontrada nesta unidade." });
    return;
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: [{ timestamp: "asc" }, { createdAt: "asc" }],
  });

  const dto: MessageDTO[] = messages.map((m) => ({
    id: m.id,
    conversationId: m.conversationId,
    direction: m.direction,
    body: m.body,
    timestamp: m.timestamp.toISOString(),
  }));

  res.json(dto);
});
