"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

export default function LoginPage() {
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Erfolgreich angemeldet");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md space-y-6 rounded-3xl border border-slate-800 bg-surface p-8 shadow-2xl"
      >
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-slate-100">Anmeldung</h1>
          <p className="text-sm text-slate-400">
            Melde dich mit deinem Kanzlei-Account bei SlacsX an.
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-xs text-slate-400">E-Mail</label>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl bg-muted px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/60"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-slate-400">Passwort</label>
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl bg-muted px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/60"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-full bg-accent px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-accent/90 disabled:opacity-60"
        >
          {isLoading ? "Anmeldung..." : "Anmelden"}
        </button>
        <p className="text-center text-xs text-slate-500">
          Noch kein Zugang? <Link href="#" className="text-accent hover:underline">Administrator kontaktieren</Link>
        </p>
      </form>
    </div>
  );
}
