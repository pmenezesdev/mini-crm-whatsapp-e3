"use client";

import type { ConversationDTO, MeDTO } from "@e3/shared";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ConversationList } from "@/components/ConversationList";
import { ConversationMessages } from "@/components/ConversationMessages";
import { WhatsappStatusBadge } from "@/components/WhatsappStatusBadge";
import { apiFetch, ApiError } from "@/lib/api";

const CONVERSATIONS_POLL_INTERVAL_MS = 4000;

export default function DashboardPage() {
  const { user, loading, getIdToken, signOut } = useAuth();
  const router = useRouter();

  const [me, setMe] = useState<MeDTO | null>(null);
  const [meError, setMeError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationDTO[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  const loadMe = useCallback(async () => {
    const idToken = await getIdToken();
    try {
      const data = await apiFetch<MeDTO>("/api/me", idToken);
      setMe(data);
    } catch (err) {
      setMeError(
        err instanceof ApiError
          ? err.message
          : "Nao foi possivel carregar os dados do usuario."
      );
    }
  }, [getIdToken]);

  const loadConversations = useCallback(async () => {
    const idToken = await getIdToken();
    try {
      const data = await apiFetch<ConversationDTO[]>("/api/conversations", idToken);
      setConversations(data);
    } catch {
      // erro ja reportado via meError quando aplicavel
    }
  }, [getIdToken]);

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch assincrono ao autenticar; setState so ocorre apos o await, nao ha cascata sincrona
      loadMe();
    }
  }, [user, loadMe]);

  useEffect(() => {
    if (!user) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch assincrono; mantem a lista de conversas atualizada sem precisar recarregar a pagina
    loadConversations();
    const interval = setInterval(loadConversations, CONVERSATIONS_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [user, loadConversations]);

  if (loading || !user) return null;

  if (meError) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <p className="max-w-sm text-center text-sm text-red-600">{meError}</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-black/10 dark:border-white/15 p-4">
        <div>
          <h1 className="text-sm font-semibold">{me?.unit.name ?? "Carregando..."}</h1>
          <p className="text-xs text-black/50 dark:text-white/50">{me?.email}</p>
        </div>
        <button
          onClick={signOut}
          className="text-xs rounded-md border border-black/15 dark:border-white/20 px-3 py-1.5"
        >
          Sair
        </button>
      </header>

      <div className="p-4">
        <WhatsappStatusBadge />
      </div>

      <div className="flex flex-1 min-h-0 border-t border-black/10 dark:border-white/15">
        <aside className="w-72 shrink-0 overflow-y-auto border-r border-black/10 dark:border-white/15">
          <ConversationList
            conversations={conversations}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </aside>
        <section className="flex-1 min-w-0 flex flex-col">
          {selectedId ? (
            <ConversationMessages key={selectedId} conversationId={selectedId} />
          ) : (
            <p className="p-6 text-sm text-black/50 dark:text-white/50">
              Selecione uma conversa para ver as mensagens.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
