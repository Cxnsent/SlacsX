"use client";

// CHANGED
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
// CHANGED
import Link from "next/link";
// NEW
import { useRouter } from "next/navigation";
// CHANGED
import { useCallback, useState } from "react";
// CHANGED
import { toast } from "sonner";

export default function LoginPage() {
  // CHANGED
  const supabase = createClientComponentClient();
  // NEW
  const router = useRouter();
  // CHANGED
  const [email, setEmail] = useState("");
  // CHANGED
  const [password, setPassword] = useState("");
  // CHANGED
  const [isLoading, setIsLoading] = useState(false);
  // NEW
  const [showPassword, setShowPassword] = useState(false);

  // CHANGED
  const handleLogin = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      // CHANGED
      event.preventDefault();
      // NEW
      if (isLoading) {
        // NEW
        return;
      }
      // CHANGED
      setIsLoading(true);

      try {
        // NEW
        const normalizedEmail = email.trim().toLowerCase();
        // CHANGED
        const { data, error } = await supabase.auth.signInWithPassword({
          // CHANGED
          email: normalizedEmail,
          // CHANGED
          password,
        });

        // NEW
        if (error) {
          // NEW
          const message = error.message.toLowerCase();
          // NEW
          const isInvalidCredentials =
            message.includes("invalid login credentials") ||
            message.includes("invalid email or password");
          // NEW
          if (isInvalidCredentials) {
            // NEW
            toast.error("Ungültige Zugangsdaten. Bitte überprüfe E-Mail-Adresse und Passwort.");
          } else {
            // NEW
            toast.error("Anmeldung fehlgeschlagen. Bitte versuche es erneut.");
          }
          // NEW
          return;
        }

        // NEW
        if (data?.user && !data.user.email_confirmed_at) {
          // NEW
          // TODO: Optional prüfen, ob der Nutzer verifiziert ist und entsprechend informieren.
        }

        // CHANGED
        toast.success("Erfolgreich angemeldet");
        // NEW
        router.push("/dashboard");
      } catch (loginError) {
        // NEW
        console.error("Unerwarteter Fehler beim Login", loginError);
        // NEW
        toast.error("Es ist ein unerwarteter Fehler aufgetreten. Bitte versuche es später erneut.");
      } finally {
        // CHANGED
        setIsLoading(false);
      }
    },
    // NEW
    [email, isLoading, password, router, supabase]
  );

  // CHANGED
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <form
        // CHANGED
        onSubmit={handleLogin}
        // CHANGED
        className="w-full max-w-md space-y-6 rounded-3xl border border-slate-800 bg-surface p-8 shadow-2xl"
      >
        <div className="space-y-2 text-center">
          {/* // CHANGED */}
          <h1 className="text-2xl font-semibold text-slate-100">Anmeldung</h1>
          {/* // CHANGED */}
          <p className="text-sm text-slate-400">
            Melde dich mit deinem Kanzlei-Account bei SlacsX an.
          </p>
        </div>
        <div className="space-y-2">
          {/* // CHANGED */}
          <label htmlFor="email" className="text-xs text-slate-400">
            E-Mail
          </label>
          <input
            id="email"
            // CHANGED
            type="email"
            // CHANGED
            name="email"
            // CHANGED
            autoComplete="email"
            // CHANGED
            required
            // CHANGED
            value={email}
            // CHANGED
            onChange={(event) => setEmail(event.target.value)}
            // CHANGED
            disabled={isLoading}
            // CHANGED
            className="w-full rounded-xl bg-muted px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/60 disabled:opacity-60"
          />
        </div>
        <div className="space-y-2">
          {/* // CHANGED */}
          <label htmlFor="password" className="text-xs text-slate-400">
            Passwort
          </label>
          <div className="relative">
            <input
              id="password"
              // CHANGED
              type={showPassword ? "text" : "password"}
              // CHANGED
              name="password"
              // CHANGED
              autoComplete="current-password"
              // CHANGED
              required
              // CHANGED
              value={password}
              // CHANGED
              onChange={(event) => setPassword(event.target.value)}
              // CHANGED
              disabled={isLoading}
              // CHANGED
              className="w-full rounded-xl bg-muted px-4 py-3 pr-20 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/60 disabled:opacity-60"
            />
            <button
              type="button"
              // NEW
              onClick={() => setShowPassword((prev) => !prev)}
              // NEW
              className="absolute inset-y-0 right-0 flex items-center px-3 text-xs font-semibold text-accent hover:text-accent/80"
              // NEW
              disabled={isLoading}
            >
              {/* // NEW */}
              {showPassword ? "Verbergen" : "Anzeigen"}
            </button>
          </div>
        </div>
        <button
          type="submit"
          // CHANGED
          disabled={isLoading}
          // CHANGED
          className="w-full rounded-full bg-accent px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {/* // CHANGED */}
          {isLoading ? "Anmeldung..." : "Anmelden"}
        </button>
        <p className="text-center text-xs text-slate-500">
          {/* // CHANGED */}
          Noch kein Zugang? <Link href="#" className="text-accent hover:underline">Administrator kontaktieren</Link>
        </p>
      </form>
    </div>
  );
}
