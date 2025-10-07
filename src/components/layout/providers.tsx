"use client";

import { ReactNode } from "react";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { ThemeProvider } from "next-themes";
import { SupabaseClient } from "@supabase/supabase-js";
import { useState } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const [supabase] = useState<SupabaseClient | null>(() => {
    if (!supabaseUrl || !supabaseKey) {
      console.error(
        "Supabase Umgebungsvariablen fehlen. Bitte NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY setzen."
      );
      return null;
    }

    return createBrowserSupabaseClient({
      supabaseUrl,
      supabaseKey
    });
  });

  if (!supabase) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        {children}
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <SessionContextProvider supabaseClient={supabase}>
        {children}
      </SessionContextProvider>
    </ThemeProvider>
  );
}
