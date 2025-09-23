"use client";

import { KanbanProject, Kanzlei, Sachbearbeiter } from "@/components/kanban/types";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import clsx from "clsx";

interface ProjectSheetProps {
  project: KanbanProject;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kanzleien: Kanzlei[];
  sachbearbeiter: Sachbearbeiter[];
  vorlagen: Array<{ id: string; name: string; betreff: string | null; inhalt: string | null }>;
  isUpdating: boolean;
}

type FormValues = {
  titel: string;
  status: string;
  prioritaet: string;
  bucket: string;
  start_datum: string | null;
  faelligkeits_datum: string | null;
  notizen: string | null;
  kanzlei_id: string | null;
  projekt_typ: string | null;
};

const PRIORITIES = ["Hoch", "Mittel", "Niedrig"];
const STATUS = ["Nicht begonnen", "In Arbeit", "Abgeschlossen", "Wartet"];

function normalizeDate(value: string | null) {
  if (!value) return "";
  return value.split("T")[0];
}

export function ProjectSheet({
  project,
  open,
  onOpenChange,
  kanzleien,
  sachbearbeiter,
  vorlagen,
  isUpdating
}: ProjectSheetProps) {
  const [activeTab, setActiveTab] = useState<"details" | "checklist" | "comments">("details");
  const form = useForm<FormValues>({
    defaultValues: {
      titel: project.titel,
      status: project.status,
      prioritaet: project.prioritaet,
      bucket: project.bucket,
      start_datum: normalizeDate(project.start_datum),
      faelligkeits_datum: normalizeDate(project.faelligkeits_datum),
      notizen: project.notizen,
      kanzlei_id: project.kanzlei_id,
      projekt_typ: project.projekt_typ
    }
  });

  useEffect(() => {
    form.reset({
      titel: project.titel,
      status: project.status,
      prioritaet: project.prioritaet,
      bucket: project.bucket,
      start_datum: normalizeDate(project.start_datum),
      faelligkeits_datum: normalizeDate(project.faelligkeits_datum),
      notizen: project.notizen,
      kanzlei_id: project.kanzlei_id,
      projekt_typ: project.projekt_typ
    });
  }, [project, form]);

  const metadata = useMemo(() => {
    if (!project.metadaten || typeof project.metadaten !== "object") {
      return {} as Record<string, string | boolean | number | null>;
    }
    return project.metadaten as Record<string, string | boolean | number | null>;
  }, [project.metadaten]);

  const checklist = useMemo(() => {
    if (!Array.isArray(project.checkliste)) {
      return [] as Array<{ text: string; erledigt: boolean }>;
    }
    return project.checkliste as Array<{ text: string; erledigt: boolean }>;
  }, [project.checkliste]);

  const selectedKanzleiId = form.watch("kanzlei_id") ?? project.kanzlei_id;
  const assignedContacts = sachbearbeiter.filter((item) => item.kanzlei_id === selectedKanzleiId);

  const handleSubmit = form.handleSubmit(async (values) => {
    const response = await fetch("/api/projects/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: project.id,
        ...values,
        start_datum: values.start_datum || null,
        faelligkeits_datum: values.faelligkeits_datum || null,
        notizen: values.notizen || null
      })
    });

    if (!response.ok) {
      const { error } = await response.json();
      toast.error(error ?? "Speichern fehlgeschlagen");
      return;
    }

    toast.success("Projekt gespeichert");
    onOpenChange(false);
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/80 px-4 py-10 backdrop-blur">
      <div className="w-full max-w-5xl rounded-3xl border border-slate-800 bg-surface p-8 shadow-2xl">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-accent">Projekt</p>
            <h2 className="text-2xl font-semibold text-slate-100">{project.titel}</h2>
            <p className="text-sm text-slate-400">Zuletzt aktualisiert: {new Date(project.created_at).toLocaleString("de-DE")}</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-300 hover:border-accent/60"
          >
            Schließen
          </button>
        </header>

        <div className="mb-6 flex flex-wrap gap-2">
          {(["details", "checklist", "comments"] as const).map((tab) => (
            <button
              key={tab}
              className={clsx(
                "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition",
                activeTab === tab
                  ? "bg-accent/20 text-accent"
                  : "bg-muted text-slate-400 hover:bg-muted/60"
              )}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "details" && "Details"}
              {tab === "checklist" && "Checkliste"}
              {tab === "comments" && "Kommentare"}
            </button>
          ))}
        </div>

        {activeTab === "details" && (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <section className="space-y-5 lg:col-span-2">
              <div className="space-y-2">
                <label className="text-xs text-slate-400">Titel</label>
                <input
                  {...form.register("titel", { required: true })}
                  className="w-full rounded-xl bg-muted px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/60"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs text-slate-400">Bucket</label>
                  <input
                    {...form.register("bucket")}
                    className="w-full rounded-xl bg-muted px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/60"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-400">Status</label>
                  <select
                    {...form.register("status")}
                    className="w-full rounded-xl bg-muted px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/60"
                  >
                    {STATUS.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-400">Priorität</label>
                  <select
                    {...form.register("prioritaet")}
                    className="w-full rounded-xl bg-muted px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/60"
                  >
                    {PRIORITIES.map((priority) => (
                      <option key={priority}>{priority}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-400">Projekt Typ</label>
                  <select
                    {...form.register("projekt_typ")}
                    className="w-full rounded-xl bg-muted px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/60"
                  >
                    <option value="">Ohne</option>
                    <option value="Selbstbucher">Selbstbucher</option>
                    <option value="Auftragsbuchhaltung">Auftragsbuchhaltung</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs text-slate-400">Startdatum</label>
                  <input
                    type="date"
                    {...form.register("start_datum")}
                    className="w-full rounded-xl bg-muted px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/60"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-400">Fälligkeitsdatum</label>
                  <input
                    type="date"
                    {...form.register("faelligkeits_datum")}
                    className="w-full rounded-xl bg-muted px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/60"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-400">Notizen</label>
                <textarea
                  rows={6}
                  {...form.register("notizen")}
                  className="w-full rounded-xl bg-muted px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/60"
                />
              </div>
            </section>
            <aside className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs text-slate-400">Kanzlei</label>
                <select
                  {...form.register("kanzlei_id")}
                  className="w-full rounded-xl bg-muted px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/60"
                >
                  <option value="">Keine</option>
                  {kanzleien.map((kanzlei) => (
                    <option key={kanzlei.id} value={kanzlei.id}>
                      {kanzlei.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <h3 className="mb-2 text-sm font-semibold text-slate-100">Eckpunkte</h3>
                <dl className="space-y-2 text-xs text-slate-400">
                  {Object.entries(metadata).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between gap-2">
                      <dt className="capitalize text-slate-500">{key.replace(/_/g, " ")}</dt>
                      <dd className="text-right text-slate-300">
                        {typeof value === "boolean" ? (value ? "Ja" : "Nein") : String(value ?? "-")}
                      </dd>
                    </div>
                  ))}
                  {Object.keys(metadata).length === 0 && (
                    <p className="text-xs text-slate-500">Noch keine Eckpunkte hinterlegt.</p>
                  )}
                </dl>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <h3 className="mb-2 text-sm font-semibold text-slate-100">Sachbearbeiter</h3>
                <ul className="space-y-2 text-xs text-slate-300">
                  {assignedContacts.map((contact) => (
                    <li key={contact.id} className="flex items-center justify-between">
                      <span>{contact.name}</span>
                      <span className="text-slate-500">{contact.email ?? "-"}</span>
                    </li>
                  ))}
                  {assignedContacts.length === 0 && (
                    <li className="text-slate-500">Keine Sachbearbeiter zugeordnet.</li>
                  )}
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <h3 className="mb-2 text-sm font-semibold text-slate-100">E-Mail-Vorlagen</h3>
                <ul className="space-y-2 text-xs text-slate-300">
                  {vorlagen.map((template) => (
                    <li key={template.id} className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-100">{template.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof navigator !== "undefined" && navigator.clipboard) {
                            navigator.clipboard.writeText(template.inhalt ?? "");
                            toast.success("Vorlage in die Zwischenablage kopiert");
                          } else {
                            toast.error("Zwischenablage nicht verfügbar");
                          }
                        }}
                        className="text-xs text-accent hover:underline"
                      >
                        Kopieren
                      </button>
                    </li>
                  ))}
                  {vorlagen.length === 0 && (
                    <li className="text-slate-500">Keine Vorlagen hinterlegt.</li>
                  )}
                </ul>
              </div>
              <button
                type="submit"
                className="w-full rounded-full bg-accent px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-accent/90"
                disabled={isUpdating}
              >
                Speichern
              </button>
            </aside>
          </form>
        )}

        {activeTab === "checklist" && (
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-100">Checkliste</h3>
              <ul className="space-y-3">
                {checklist.map((item, index) => (
                  <li key={`${item.text}-${index}`} className="flex items-center gap-3">
                    <input type="checkbox" checked={item.erledigt} readOnly className="h-4 w-4" />
                    <span className={clsx("text-sm", item.erledigt ? "text-slate-400 line-through" : "text-slate-200")}>
                      {item.text}
                    </span>
                  </li>
                ))}
                {checklist.length === 0 && (
                  <li className="text-sm text-slate-500">
                    Noch keine Checklistenpunkte. Die OCR kann diese Felder automatisch vorbelegen.
                  </li>
                )}
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-100">Dokumente</h3>
              <ul className="space-y-3 text-sm text-slate-300">
                {project.dokumente?.map((document) => (
                  <li key={document.id} className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
                    <span>{document.file_name}</span>
                    <a
                      href={`https://supabase.storage/${document.storage_path}`}
                      className="text-xs text-accent hover:underline"
                    >
                      Anzeigen
                    </a>
                  </li>
                ))}
                {(!project.dokumente || project.dokumente.length === 0) && (
                  <li className="text-sm text-slate-500">Keine Dokumente vorhanden.</li>
                )}
              </ul>
            </div>
          </section>
        )}

        {activeTab === "comments" && (
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-100">Kommentare</h3>
            <p className="text-sm text-slate-400">
              Kommentare werden über Supabase Realtime synchronisiert. Diese Ansicht ist ein
              Platzhalter und zeigt, wo die Echtzeit-Kommunikation integriert wird.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
