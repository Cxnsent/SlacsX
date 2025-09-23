import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { KanzleiManager } from "@/components/forms/kanzlei-manager";

export const revalidate = 0;

export default async function KanzleienPage() {
  const supabase = createServerSupabaseClient();

  const [{ data: kanzleien }, { data: sachbearbeiter }] = await Promise.all([
    supabase.from("kanzleien").select("*"),
    supabase.from("sachbearbeiter").select("*")
  ]);

  return (
    <KanzleiManager kanzleien={kanzleien ?? []} sachbearbeiter={sachbearbeiter ?? []} />
  );
}
