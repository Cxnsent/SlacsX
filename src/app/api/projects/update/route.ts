import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types/database";

export async function POST(request: Request) {
  const payload = await request.json();
  const supabase = createRouteHandlerClient<Database>({ cookies });

  const { id, ...values } = payload;

  if (!id) {
    return NextResponse.json({ error: "Missing project id" }, { status: 400 });
  }

  const { error, data } = await supabase
    .from("projekte")
    .update(values)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
