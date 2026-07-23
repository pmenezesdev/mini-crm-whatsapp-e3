export interface UnitDTO {
  id: string;
  name: string;
}

export interface MeDTO {
  id: string;
  email: string;
  name: string;
  unit: UnitDTO;
}

export interface ConversationDTO {
  id: string;
  contactName: string | null;
  whatsappJid: string;
  lastMessagePreview: string | null;
  updatedAt: string;
}

export type MessageDirection = "IN" | "OUT";

export interface MessageDTO {
  id: string;
  conversationId: string;
  direction: MessageDirection;
  body: string;
  timestamp: string;
}

export type WhatsappConnectionState = "DISCONNECTED" | "QR_PENDING" | "CONNECTED";

export interface WhatsappStatusDTO {
  state: WhatsappConnectionState;
  qrDataUrl: string | null;
  ownerUnit: UnitDTO | null;
}
