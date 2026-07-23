"use client";

import type { MessageDTO } from "@e3/shared";

export function MessageList({ messages }: { messages: MessageDTO[] }) {
  if (messages.length === 0) {
    return (
      <p className="p-6 text-sm text-black/50 dark:text-white/50">
        Selecione uma conversa para ver as mensagens.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-4 overflow-y-auto">
      {messages.map((m) => (
        <div
          key={m.id}
          className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
            m.direction === "OUT"
              ? "self-end bg-black text-white dark:bg-white dark:text-black"
              : "self-start bg-black/[.05] dark:bg-white/[.1]"
          }`}
        >
          <p>{m.body}</p>
          <p className="mt-1 text-[10px] opacity-60">
            {new Date(m.timestamp).toLocaleString("pt-BR")}
          </p>
        </div>
      ))}
    </div>
  );
}
