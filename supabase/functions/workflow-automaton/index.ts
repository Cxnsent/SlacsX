import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { Database } from "../../types.ts";
import { addDays } from "https://esm.sh/date-fns@3.6.0/addDays";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey);

  const { data: projects, error } = await supabase
    .from("projekte")
    .select("*, kanzleien:kanzlei_id(id, name)")
    .not("faelligkeits_datum", "is", null);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }

  const today = new Date();

  for (const project of projects ?? []) {
    const rule = workflowRules[project.bucket];
    if (!rule) continue;
    await rule({ project, supabase, today });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200
  });
});

type WorkflowSupabase = SupabaseClient<Database>;

type RuleContext = {
  project: Database["public"]["Tables"]["projekte"]["Row"];
  supabase: WorkflowSupabase;
  today: Date;
};

type RuleHandler = (ctx: RuleContext) => Promise<void>;

const workflowRules: Record<string, RuleHandler> = {
  Pool: async ({ project, supabase, today }) => {
    if (!project.faelligkeits_datum) return;
    // Trigger occurs when TM send list -> simulation via status field
    if (project.status === "Mailing Konzeptblatt" || new Date(project.faelligkeits_datum) <= today) {
      await performUpdate(supabase, project.id, {
        bucket: "Konzeptblatt gesendet",
        faelligkeits_datum: addDays(today, 21).toISOString().slice(0, 10),
        notizen: appendNote(project.notizen, `${formatDate(today)} - Konzeptblatt versendet`)
      });
      await logAction(supabase, project.id, "Mailing Konzeptblatt gesendet");
      await sendMail(supabase, project, "Mailing Konzeptblatt");
    }
  },
  "Konzeptblatt gesendet": async ({ project, supabase, today }) => {
    if (!isDue(project.faelligkeits_datum, today)) return;
    await performUpdate(supabase, project.id, {
      bucket: "A Erinnerung Konzeptblatt gesendet",
      faelligkeits_datum: addDays(today, 14).toISOString().slice(0, 10),
      notizen: appendNote(project.notizen, `${formatDate(today)} - Erinnerung Konzeptblatt A`)
    });
    await sendMail(supabase, project, "Mailing Konzeptblatt");
  },
  "A Erinnerung Konzeptblatt gesendet": async ({ project, supabase, today }) => {
    if (!isDue(project.faelligkeits_datum, today)) return;
    await performUpdate(supabase, project.id, {
      bucket: "B Erinnerung Konzeptblatt gesendet",
      faelligkeits_datum: addDays(today, 14).toISOString().slice(0, 10),
      notizen: appendNote(project.notizen, `${formatDate(today)} - Erinnerung Konzeptblatt B`)
    });
    await sendMail(supabase, project, "Mailing Konzeptblatt");
  },
  "B Erinnerung Konzeptblatt gesendet": async ({ project, supabase, today }) => {
    if (!isDue(project.faelligkeits_datum, today)) return;
    await performUpdate(supabase, project.id, {
      bucket: "Feedback Kanzlei abwarten"
    });
  },
  "Feedback Kanzlei abwarten": async ({ project, supabase, today }) => {
    if (!isDue(project.faelligkeits_datum, today)) return;
    if (project.status?.toLowerCase() === "positiv") {
      await logAction(supabase, project.id, "Positives Feedback - TM informiert");
    } else {
      await performUpdate(supabase, project.id, { status: "erledigt" });
      await logAction(supabase, project.id, "Projekt geschlossen mangels Feedback");
    }
  },
  "Angebot erstellen": async ({ project, supabase, today }) => {
    if (project.status?.toLowerCase() === "konzeptblatt erhalten") {
      await performUpdate(supabase, project.id, {
        bucket: "Angebot gesendet",
        faelligkeits_datum: addDays(today, 14).toISOString().slice(0, 10),
        notizen: appendNote(project.notizen, `${formatDate(today)} - Angebot gesendet`)
      });
      await sendMail(supabase, project, "Mailing Angebot DUo");
    }
  },
  "Angebot gesendet": async ({ project, supabase, today }) => {
    if (!isDue(project.faelligkeits_datum, today)) return;
    await performUpdate(supabase, project.id, {
      bucket: "A Erinnerung Angebot gesendet",
      faelligkeits_datum: addDays(today, 14).toISOString().slice(0, 10),
      notizen: appendNote(project.notizen, `${formatDate(today)} - Erinnerung Angebot A`)
    });
    await sendMail(supabase, project, "Mailing Angebot DUo");
  },
  "A Erinnerung Angebot gesendet": async ({ project, supabase, today }) => {
    if (!isDue(project.faelligkeits_datum, today)) return;
    await performUpdate(supabase, project.id, {
      bucket: "B Erinnerung Angebot gesendet",
      faelligkeits_datum: addDays(today, 14).toISOString().slice(0, 10),
      notizen: appendNote(project.notizen, `${formatDate(today)} - Erinnerung Angebot B`)
    });
    await sendMail(supabase, project, "Mailing Angebot DUo");
  },
  "B Erinnerung Angebot gesendet": async ({ project, supabase, today }) => {
    if (!isDue(project.faelligkeits_datum, today)) return;
    await performUpdate(supabase, project.id, {
      bucket: "Feedback Kanzlei abwarten"
    });
  },
  "Projekt in Bearbeitung": async ({ project, supabase, today }) => {
    if (project.status?.toLowerCase() === "duo eingeführt" && project.faelligkeits_datum) {
      const due = new Date(project.faelligkeits_datum);
      due.setDate(due.getDate() + 14);
      await performUpdate(supabase, project.id, {
        bucket: "Projekt in Nacharbeitung",
        faelligkeits_datum: due.toISOString().slice(0, 10)
      });
    }
  },
  "Projekt in Nacharbeitung": async ({ project, supabase }) => {
    if (project.status?.toLowerCase() === "abgerechnet") {
      await performUpdate(supabase, project.id, { status: "erledigt" });
    }
  }
};

async function performUpdate(
  supabase: WorkflowSupabase,
  id: string,
  values: Partial<Database["public"]["Tables"]["projekte"]["Update"]>
) {
  const { error } = await supabase.from("projekte").update(values).eq("id", id);
  if (error) {
    console.error("Workflow update error", error.message);
  }
}

async function sendMail(
  supabase: WorkflowSupabase,
  project: Database["public"]["Tables"]["projekte"]["Row"],
  templateName: string
) {
  const { data: template } = await supabase
    .from("vorlagen")
    .select("*")
    .eq("name", templateName)
    .maybeSingle();
  if (!template) return;
  await supabase.from("workflow_logs").insert({
    projekt_id: project.id,
    aktion: `Email ${templateName} versendet`,
    details: { templateName }
  });
}

async function logAction(
  supabase: WorkflowSupabase,
  projectId: string,
  message: string
) {
  await supabase.from("workflow_logs").insert({
    projekt_id: projectId,
    aktion: message
  });
}

function appendNote(existing: string | null, note: string) {
  return existing ? `${existing}\n${note}` : note;
}

function isDue(date: string | null, today: Date) {
  if (!date) return false;
  return new Date(date) <= today;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });
}
