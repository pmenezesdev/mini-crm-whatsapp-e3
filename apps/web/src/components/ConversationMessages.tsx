"use client";

import type { MessageDTO } from "@e3/shared";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { MessageList } from "./MessageList";

const POLL_INTERVAL_MS = 4000;

export function ConversationMessages({ conversationId }: { conversationId: string }) {
  const { getIdToken } = useAuth();
  const [messages, setMessages] = useState<MessageDTO[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadMessages() {
      const idToken = await getIdToken();
      const data = await apiFetch<MessageDTO[]>(
        `/api/conversations/${conversationId}/messages`,
        idToken
      );
      if (!cancelled) setMessages(data);
    }

    loadMessages();
    const interval = setInterval(loadMessages, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [conversationId, getIdToken]);

  return <MessageList messages={messages} />;
}
