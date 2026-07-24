import { readdir, rm } from "node:fs/promises";
import path from "node:path";
import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  type WASocket,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import QRCode from "qrcode";
import type { WhatsappConnectionState, WhatsappStatusDTO } from "@e3/shared";
import { logger } from "../lib/logger.js";
import { prisma } from "../lib/prisma.js";
import { handleMessagesUpsert } from "./messageHandler.js";

const AUTH_DIR = process.env.WHATSAPP_AUTH_DIR ?? path.resolve(process.cwd(), "auth_info");

// Baileys e' bastante verboso; mantemos o logger interno dele em "warn" para nao poluir os logs do container.
const baileysLogger = pino({ level: "warn" });

let currentQr: string | null = null;
let connectionState: WhatsappConnectionState = "DISCONNECTED";

async function clearAuthState(): Promise<void> {
  const files = await readdir(AUTH_DIR).catch(() => []);
  await Promise.all(
    files.map((file) => rm(path.join(AUTH_DIR, file), { recursive: true, force: true }))
  );
}

export async function startWhatsapp(): Promise<void> {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock: WASocket = makeWASocket({
    auth: state,
    version,
    logger: baileysLogger,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, qr, lastDisconnect } = update;

    if (qr) {
      currentQr = qr;
      connectionState = "QR_PENDING";
      logger.info("QR Code de pareamento gerado. Escaneie com o WhatsApp (Aparelhos conectados):");
      const asciiQr = await QRCode.toString(qr, { type: "terminal", small: true });
      console.log(asciiQr);
    }

    if (connection === "open") {
      currentQr = null;
      connectionState = "CONNECTED";
      logger.info("WhatsApp conectado com sucesso.");
    }

    if (connection === "close") {
      connectionState = "DISCONNECTED";
      const statusCode = (lastDisconnect?.error as Boom | undefined)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      logger.warn({ statusCode, shouldReconnect }, "Conexao com o WhatsApp foi encerrada.");

      if (shouldReconnect) {
        startWhatsapp().catch((err) => logger.error(err, "Falha ao reconectar ao WhatsApp."));
      } else {
        // Sessao invalidada de vez (logout, troca de aparelho, etc.) - a credencial salva nunca
        // mais vai funcionar. Limpa o estado e recomeca do zero para gerar um QR novo, em vez de
        // ficar parado em DISCONNECTED ate alguem reiniciar o container manualmente.
        logger.warn("Sessao invalidada permanentemente. Gerando novo QR Code.");
        clearAuthState()
          .then(() => startWhatsapp())
          .catch((err) => logger.error(err, "Falha ao reiniciar apos sessao invalidada."));
      }
    }
  });

  sock.ev.on("messages.upsert", (payload) => {
    handleMessagesUpsert(sock, payload).catch((err) =>
      logger.error(err, "Erro ao processar mensagens recebidas.")
    );
  });
}

export async function getWhatsappStatus(): Promise<WhatsappStatusDTO> {
  const ownerUnit = await prisma.unit.findFirst({ where: { isWhatsappOwner: true } });

  return {
    state: connectionState,
    qrDataUrl: currentQr ? await QRCode.toDataURL(currentQr) : null,
    ownerUnit: ownerUnit ? { id: ownerUnit.id, name: ownerUnit.name } : null,
  };
}
