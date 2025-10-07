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
  sachbearbeiter_id: string;
};

const PRIORITIES = ["Hoch", "Mittel", "Niedrig"];
const DEFAULT_STATUSES = ["Nicht begonnen", "In Arbeit", "Abgeschlossen", "Wartet"];

function collectStatusHints(source: unknown): string[] {
  const collected = new Set<string>();

  const visit = (value: unknown, keyPath: string[] = []) => {
    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, keyPath));
      return;
    }

    if (value && typeof value === "object") {
      for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
        visit(nested, [...keyPath, key]);
      }
      return;
    }

    if (typeof value !== "string") {
      return;
    }

    const shouldCollect = keyPath.some((key) => key.toLowerCase().includes("status"));
    if (!shouldCollect) {
      return;
    }

    value
      .split(/[,;\n]/)
      .map((entry) => entry.trim())
      .filter(Boolean)
      .forEach((entry) => collected.add(entry));
  };

  visit(source);

  return Array.from(collected);
}

function formatMetadataValue(value: unknown) {
  if (typeof value === "boolean") {
    return value ? "Ja" : "Nein";
  }

  if (Array.isArray(value)) {
    return value.map((item) => (item == null ? "-" : String(item))).join(", ");
  }

  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }

  return value == null || value === "" ? "-" : String(value);
}

function extractContactFromMetadata(metadata: Record<string, unknown>) {
  const getString = (key: string) => {
    const value = metadata[key];
    return typeof value === "string" && value.trim() !== "" ? value : null;
  };

  return {
    id: getString("sachbearbeiter_id"),
    name: getString("sachbearbeiter_name"),
    email: getString("sachbearbeiter_email"),
    telefon: getString("sachbearbeiter_telefon")
  };
}

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
  const metadata = useMemo(() => {
    if (!project.metadaten || typeof project.metadaten !== "object") {
      return {} as Record<string, unknown>;
    }
    return project.metadaten as Record<string, unknown>;
  }, [project.metadaten]);

  const metadataContact = useMemo(() => extractContactFromMetadata(metadata), [metadata]);

  const metadataEntries = useMemo(
    () =>
      Object.entries(metadata).filter(
        ([key]) =>
          !["sachbearbeiter_id", "sachbearbeiter_name", "sachbearbeiter_email", "sachbearbeiter_telefon"].includes(key)
      ),
    [metadata]
  );

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
      projekt_typ: project.projekt_typ,
      sachbearbeiter_id: metadataContact.id ?? ""
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
      projekt_typ: project.projekt_typ,
      sachbearbeiter_id: metadataContact.id ?? ""
    });
  }, [project, form, metadataContact.id]);

  const checklist = useMemo(() => {
    if (!Array.isArray(project.checkliste)) {
      return [] as Array<{ text: string; erledigt: boolean }>;
    }
    return project.checkliste as Array<{ text: string; erledigt: boolean }>;
  }, [project.checkliste]);

  const watchedKanzleiId = form.watch("kanzlei_id");
  const selectedKanzleiId =
    watchedKanzleiId !== undefined ? watchedKanzleiId : project.kanzlei_id ?? "";
  const effectiveKanzleiId =
    selectedKanzleiId && selectedKanzleiId.trim() !== "" ? selectedKanzleiId : "";

  const assignedContacts = useMemo(
    () =>
      effectiveKanzleiId
        ? sachbearbeiter.filter((item) => item.kanzlei_id === effectiveKanzleiId)
        : [],
    [sachbearbeiter, effectiveKanzleiId]
  );

  const watchedContactId = form.watch("sachbearbeiter_id");
  const selectedContactId = watchedContactId && watchedContactId.trim() !== "" ? watchedContactId : null;

  useEffect(() => {
    if (!effectiveKanzleiId && watchedContactId !== "") {
      form.setValue("sachbearbeiter_id", "");
      return;
    }

    if (selectedContactId && !assignedContacts.some((contact) => contact.id === selectedContactId)) {
      form.setValue("sachbearbeiter_id", "");
    }
  }, [effectiveKanzleiId, assignedContacts, selectedContactId, watchedContactId, form]);

  const contactDetails = useMemo<
    | { source: "selection"; contact: Sachbearbeiter }
    | { source: "persisted"; contact: ReturnType<typeof extractContactFromMetadata> }
    | { source: "none"; contact: null }
  >(() => {
    if (selectedContactId) {
      const match = sachbearbeiter.find((contact) => contact.id === selectedContactId);
      if (match) {
        return { source: "selection" as const, contact: match };
      }
    }

    if (metadataContact.id || metadataContact.name || metadataContact.email || metadataContact.telefon) {
      return { source: "persisted" as const, contact: metadataContact };
    }

    return { source: "none" as const, contact: null };
  }, [selectedContactId, sachbearbeiter, metadataContact]);

  const statusOptions = useMemo(() => {
    const options = new Set<string>(DEFAULT_STATUSES);
    if (project.status) {
      options.add(project.status);
    }

    collectStatusHints(project.metadaten).forEach((status) => {
      if (status) {
        options.add(status);
      }
    });

    return Array.from(options);
  }, [project.status, project.metadaten]);

  const statusDatalistId = useMemo(() => `status-options-${project.id}`, [project.id]);

  const handleSubmit = form.handleSubmit(async (values) => {
    const { sachbearbeiter_id, ...restValues } = values;
    const normalizedContactId = sachbearbeiter_id && sachbearbeiter_id.trim() !== "" ? sachbearbeiter_id.trim() : null;

    const contact = normalizedContactId
      ? sachbearbeiter.find((item) => item.id === normalizedContactId) ?? null
      : null;

    const nextMetadata: Record<string, unknown> = { ...metadata };

    if (contact) {
      nextMetadata.sachbearbeiter_id = contact.id;
      nextMetadata.sachbearbeiter_name = contact.name;
      nextMetadata.sachbearbeiter_email = contact.email ?? null;
      nextMetadata.sachbearbeiter_telefon = contact.telefon ?? null;
    } else {
      delete nextMetadata.sachbearbeiter_id;
      delete nextMetadata.sachbearbeiter_name;
      delete nextMetadata.sachbearbeiter_email;
      delete nextMetadata.sachbearbeiter_telefon;
    }

    const payload = {
      id: project.id,
      ...restValues,
      kanzlei_id:
        restValues.kanzlei_id && restValues.kanzlei_id.trim() !== "" ? restValues.kanzlei_id : null,
      projekt_typ:
        restValues.projekt_typ && restValues.projekt_typ.trim() !== "" ? restValues.projekt_typ : null,
      start_datum: restValues.start_datum || null,
      faelligkeits_datum: restValues.faelligkeits_datum || null,
      notizen: restValues.notizen || null,
      metadaten: nextMetadata
    };

    const response = await fetch("/api/projects/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
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
                  <div className="w-full">
                    <input
                      list={statusOptions.length ? statusDatalistId : undefined}
                      {...form.register("status")}
                      className="w-full rounded-xl bg-muted px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/60"
                    />
                    {statusOptions.length > 0 && (
                      <datalist id={statusDatalistId}>
                        {statusOptions.map((status) => (
                          <option key={status} value={status} />
                        ))}
                      </datalist>
                    )}
                  </div>
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
              <div className="space-y-2">
                <label className="text-xs text-slate-400">Sachbearbeiter</label>
                <select
                  {...form.register("sachbearbeiter_id")}
                  className="w-full rounded-xl bg-muted px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/60 disabled:opacity-50"
                  disabled={!effectiveKanzleiId || assignedContacts.length === 0}
                >
                  <option value="">{effectiveKanzleiId ? "Bitte wählen" : "Zuerst Kanzlei wählen"}</option>
                  {assignedContacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name}
                    </option>
                  ))}
                </select>
                {effectiveKanzleiId && assignedContacts.length === 0 && (
                  <p className="text-[11px] text-slate-500">
                    Für diese Kanzlei sind noch keine Sachbearbeiter hinterlegt.
                  </p>
                )}
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <h3 className="mb-2 text-sm font-semibold text-slate-100">Eckpunkte</h3>
                <dl className="space-y-2 text-xs text-slate-400">
                  {metadataEntries.map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between gap-2">
                      <dt className="capitalize text-slate-500">{key.replace(/_/g, " ")}</dt>
                      <dd className="text-right text-slate-300">{formatMetadataValue(value)}</dd>
                    </div>
                  ))}
                  {metadataEntries.length === 0 && (
                    <p className="text-xs text-slate-500">Noch keine Eckpunkte hinterlegt.</p>
                  )}
                </dl>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <h3 className="mb-2 text-sm font-semibold text-slate-100">Sachbearbeiter</h3>
                {contactDetails.contact ? (
                  <dl className="space-y-2 text-xs text-slate-300">
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-slate-500">Name</dt>
                      <dd className="text-right">{contactDetails.contact.name ?? "–"}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-slate-500">E-Mail</dt>
                      <dd className="text-right text-slate-300">
                        {contactDetails.contact.email ?? "–"}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-slate-500">Telefon</dt>
                      <dd className="text-right text-slate-300">
                        {contactDetails.contact.telefon ?? "–"}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-xs text-slate-500">
                    {effectiveKanzleiId
                      ? assignedContacts.length === 0
                        ? "Keine Sachbearbeiter zugeordnet."
                        : "Bitte einen Sachbearbeiter auswählen."
                      : "Bitte zuerst eine Kanzlei auswählen."}
                  </p>
                )}
                {contactDetails.source === "persisted" && (
                  <p className="mt-2 text-[11px] text-amber-400">
                    Gespeicherte Kontaktdaten – bitte prüfen, ob sie noch aktuell sind.
                  </p>
                )}
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
