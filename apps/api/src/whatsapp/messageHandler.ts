import type { BaileysEventMap, WASocket } from "@whiskeysockets/baileys";
import { logger } from "../lib/logger.js";
import { prisma } from "../lib/prisma.js";

const AUTO_REPLY_TRIGGER = "oi";
const AUTO_REPLY_TEXT = "Oi! Aqui é o Atendente da E3";

export async function handleMessagesUpsert(
  sock: WASocket,
  { messages, type }: BaileysEventMap["messages.upsert"]
): Promise<void> {
  if (type !== "notify") return;

  const ownerUnit = await prisma.unit.findFirst({ where: { isWhatsappOwner: true } });

  if (!ownerUnit) {
    logger.error(
      "Nenhuma unidade marcada como isWhatsappOwner. Rode 'pnpm --filter @e3/api prisma:seed' antes de conectar."
    );
    return;
  }

  for (const msg of messages) {
    const remoteJid = msg.key.remoteJid;

    if (!msg.message || msg.key.fromMe || !remoteJid || remoteJid === "status@broadcast") {
      continue;
    }

    const text = msg.message.conversation ?? msg.message.extendedTextMessage?.text ?? "";
    if (!text) continue;

    if (msg.key.id) {
      const alreadyPersisted = await prisma.message.findUnique({
        where: { waMessageId: msg.key.id },
      });
      if (alreadyPersisted) continue;
    }

    const conversation = await prisma.conversation.upsert({
      where: { whatsappJid: remoteJid },
      update: { contactName: msg.pushName ?? undefined },
      create: {
        whatsappJid: remoteJid,
        unitId: ownerUnit.id,
        contactName: msg.pushName ?? undefined,
      },
    });

    const timestamp = msg.messageTimestamp
      ? new Date(Number(msg.messageTimestamp) * 1000)
      : new Date();

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        unitId: ownerUnit.id,
        direction: "IN",
        body: text,
        waMessageId: msg.key.id ?? undefined,
        timestamp,
      },
    });

    logger.info({ remoteJid, text }, "Mensagem recebida e persistida.");

    if (text.trim().toLowerCase() === AUTO_REPLY_TRIGGER) {
      await sock.sendMessage(remoteJid, { text: AUTO_REPLY_TEXT });

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          unitId: ownerUnit.id,
          direction: "OUT",
          body: AUTO_REPLY_TEXT,
          timestamp: new Date(),
        },
      });

      logger.info({ remoteJid }, "Resposta automatica enviada.");
    }
  }
}
