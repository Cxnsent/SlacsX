import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { Database } from "../../types.ts";

const OCR_BUCKET = "projekte";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey);

  const { path, kanzleiId } = await req.json();

  if (!path) {
    return new Response(JSON.stringify({ error: "Missing storage path" }), {
      headers: { "Content-Type": "application/json" },
      status: 400
    });
  }

  const { data: fileData, error: downloadError } = await supabase.storage
    .from(OCR_BUCKET)
    .download(path);

  if (downloadError || !fileData) {
    return new Response(JSON.stringify({ error: downloadError?.message ?? "Download fehlgeschlagen" }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }

  // Placeholder for OCR: in production integrate a WASM Tesseract or external service
  const dummyText = await fileData.text();

  const extracted = extractMetadata(dummyText);
  const { error: insertError } = await supabase.from("projekte").insert({
    titel: extracted.titel,
    bucket: "Pool",
    status: "Nicht begonnen",
    prioritaet: "Mittel",
    kanzlei_id: kanzleiId ?? null,
    metadaten: extracted.metadaten,
    checkliste: extracted.checkliste,
    notizen: extracted.notizen
  });

  if (insertError) {
    return new Response(JSON.stringify({ error: insertError.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200
  });
});

function extractMetadata(text: string) {
  const lines = text.split(/\r?\n/).map((line) => line.trim());
  const lookup = (label: string) =>
    lines.find((line) => line.toLowerCase().startsWith(label.toLowerCase()))?.split(":")[1]?.trim();

  const titel = lookup("Projekt") ?? lookup("Mandant") ?? "Neues Projekt";
  const anzahlUnternehmen = lookup("Anzahl Unternehmen") ?? "1";
  const fibu = lookup("FIBU") ?? "offen";
  const lohn = lookup("Lohn") ?? "offen";
  const ansprechpartner = lookup("Ansprechpartner Kanzlei") ?? "";

  return {
    titel,
    notizen: lines.slice(0, 10).join("\n"),
    metadaten: {
      anzahl_unternehmen: anzahlUnternehmen,
      fibu_status: fibu,
      lohn_status: lohn,
      ansprechpartner_kanzlei: ansprechpartner
    },
    checkliste: [
      { text: "Konzeptblatt erhalten", erledigt: !!lookup("Konzeptblatt erhalten") },
      { text: "Mandantenliste geprüft", erledigt: !!lookup("Mandantenliste") }
    ]
  };
}
