"use client";

import type { WhatsappStatusDTO } from "@e3/shared";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";

const POLL_INTERVAL_MS = 4000;

const STATE_LABEL: Record<WhatsappStatusDTO["state"], string> = {
  CONNECTED: "WhatsApp conectado",
  QR_PENDING: "Aguardando leitura do QR Code",
  DISCONNECTED: "WhatsApp desconectado",
};

export function WhatsappStatusBadge() {
  const { getIdToken } = useAuth();
  const [status, setStatus] = useState<WhatsappStatusDTO | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      const idToken = await getIdToken();
      try {
        const data = await apiFetch<WhatsappStatusDTO>("/api/whatsapp/status", idToken);
        if (!cancelled) setStatus(data);
      } catch {
        // silencioso: widget de status nao deve travar o resto da UI
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [getIdToken]);

  if (!status) return null;

  return (
    <div className="rounded-lg border border-black/10 dark:border-white/15 p-4 text-sm">
      <div className="flex items-center gap-2">
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            status.state === "CONNECTED"
              ? "bg-green-500"
              : status.state === "QR_PENDING"
                ? "bg-amber-500"
                : "bg-red-500"
          }`}
        />
        <span className="font-medium">{STATE_LABEL[status.state]}</span>
        {status.ownerUnit && (
          <span className="text-black/50 dark:text-white/50">
            ({status.ownerUnit.name})
          </span>
        )}
      </div>

      {status.state === "QR_PENDING" && status.qrDataUrl && (
        <div className="mt-3">
          <Image
            src={status.qrDataUrl}
            alt="QR Code de pareamento do WhatsApp"
            width={180}
            height={180}
            unoptimized
          />
          <p className="mt-2 text-xs text-black/50 dark:text-white/50">
            Escaneie com WhatsApp {"->"} Aparelhos conectados.
          </p>
        </div>
      )}
    </div>
  );
}
