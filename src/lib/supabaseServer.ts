import { cookies, headers } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/database";

export function createServerSupabaseClient() {
  return createServerComponentClient<Database>({
    cookies,
    headers
  });
}
