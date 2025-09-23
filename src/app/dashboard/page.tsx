import { createServerSupabaseClient } from "@/lib/supabaseServer";

export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase.from("dashboard_summary").select("*");

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-100">Dashboard</h1>
        <p className="text-slate-400">
          Visualisierungen werden hier zukünftig erscheinen. Die Materialized View
          <code className="ml-2 rounded bg-muted px-2 py-1 text-xs text-slate-300">dashboard_summary</code>
          liefert bereits aggregierte Kennzahlen.
        </p>
      </header>
      <pre className="rounded-3xl border border-slate-800 bg-surface p-6 text-xs text-slate-400">
        {JSON.stringify(data, null, 2)}
      </pre>
    </section>
  );
}
