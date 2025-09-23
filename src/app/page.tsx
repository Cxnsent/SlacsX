import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { Suspense } from "react";

export const revalidate = 0;

export default async function HomePage() {
  const supabase = createServerSupabaseClient();

  const [{ data: projects }, { data: kanzleien }, { data: sachbearbeiter }, { data: vorlagen }] =
    await Promise.all([
      supabase.from("projekte").select("*, dokumente(*), kanzleien:kanzlei_id(id, name)"),
      supabase.from("kanzleien").select("*"),
      supabase.from("sachbearbeiter").select("*"),
      supabase.from("vorlagen").select("*")
    ]);

  return (
    <Suspense fallback={<div className="text-slate-400">Lade Projekte...</div>}>
      <KanbanBoard
        projects={projects ?? []}
        kanzleien={kanzleien ?? []}
        sachbearbeiter={sachbearbeiter ?? []}
        vorlagen={vorlagen ?? []}
      />
    </Suspense>
  );
}
