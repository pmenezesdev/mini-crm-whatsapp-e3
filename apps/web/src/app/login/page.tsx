"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  async function handleSignIn() {
    setError(null);
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch {
      setError("Nao foi possivel entrar com o Google. Tente novamente.");
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-xl border border-black/10 dark:border-white/15 p-8 text-center">
        <h1 className="text-xl font-semibold mb-1">Mini-CRM WhatsApp</h1>
        <p className="text-sm text-black/60 dark:text-white/60 mb-6">E3 Digital</p>

        <button
          onClick={handleSignIn}
          disabled={signingIn}
          className="w-full rounded-md bg-black text-white dark:bg-white dark:text-black py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {signingIn ? "Entrando..." : "Entrar com Google"}
        </button>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>
    </main>
  );
}
