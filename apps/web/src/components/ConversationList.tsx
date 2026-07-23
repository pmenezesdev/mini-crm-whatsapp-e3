"use client";

import type { ConversationDTO } from "@e3/shared";

interface Props {
  conversations: ConversationDTO[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ConversationList({ conversations, selectedId, onSelect }: Props) {
  if (conversations.length === 0) {
    return (
      <p className="p-4 text-sm text-black/50 dark:text-white/50">
        Nenhuma conversa nesta unidade ainda.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-black/10 dark:divide-white/10">
      {conversations.map((c) => (
        <li key={c.id}>
          <button
            onClick={() => onSelect(c.id)}
            className={`w-full text-left p-4 hover:bg-black/[.03] dark:hover:bg-white/[.06] ${
              selectedId === c.id ? "bg-black/[.05] dark:bg-white/[.08]" : ""
            }`}
          >
            <p className="text-sm font-medium truncate">
              {c.contactName || c.whatsappJid.split("@")[0]}
            </p>
            {c.lastMessagePreview && (
              <p className="text-xs text-black/50 dark:text-white/50 truncate mt-0.5">
                {c.lastMessagePreview}
              </p>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
