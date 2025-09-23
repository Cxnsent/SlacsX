import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/database";

export async function POST(request: Request) {
  const payload = await request.json();
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const { data, error } = await supabase.from("sachbearbeiter").insert(payload).select().single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data });
}

export async function PUT(request: Request) {
  const payload = await request.json();
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const { id, ...values } = payload;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("sachbearbeiter")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const { error } = await supabase.from("sachbearbeiter").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
