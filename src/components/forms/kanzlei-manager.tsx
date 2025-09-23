"use client";

import { Database } from "@/types/database";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import clsx from "clsx";

type Kanzlei = Database["public"]["Tables"]["kanzleien"]["Row"];
type Sachbearbeiter = Database["public"]["Tables"]["sachbearbeiter"]["Row"];

interface KanzleiManagerProps {
  kanzleien: Kanzlei[];
  sachbearbeiter: Sachbearbeiter[];
}

interface KanzleiFormValues {
  id?: string;
  name: string;
  ansprechpartner?: string | null;
  allgemeine_infos?: string | null;
}

interface SachbearbeiterFormValues {
  id?: string;
  kanzlei_id: string;
  name: string;
  email?: string | null;
  telefon?: string | null;
}

export function KanzleiManager({ kanzleien, sachbearbeiter }: KanzleiManagerProps) {
  const [kanzleiList, setKanzleiList] = useState<Kanzlei[]>(kanzleien);
  const [contactList, setContactList] = useState<Sachbearbeiter[]>(sachbearbeiter);
  const [selectedKanzlei, setSelectedKanzlei] = useState<Kanzlei | null>(kanzleiList[0] ?? null);
  const kanzleiForm = useForm<KanzleiFormValues>({
    defaultValues: {
      name: "",
      ansprechpartner: "",
      allgemeine_infos: ""
    }
  });
  const kontaktForm = useForm<SachbearbeiterFormValues>({
    defaultValues: {
      kanzlei_id: kanzleiList[0]?.id ?? "",
      name: "",
      email: "",
      telefon: ""
    }
  });

  const contactsForSelected = useMemo(() => {
    if (!selectedKanzlei) return [] as Sachbearbeiter[];
    return contactList.filter((contact) => contact.kanzlei_id === selectedKanzlei.id);
  }, [contactList, selectedKanzlei]);

  useEffect(() => {
    if (selectedKanzlei) {
      kontaktForm.setValue("kanzlei_id", selectedKanzlei.id);
    }
  }, [selectedKanzlei, kontaktForm]);

  const resetForms = () => {
    kanzleiForm.reset({ name: "", ansprechpartner: "", allgemeine_infos: "" });
    kontaktForm.reset({
      kanzlei_id: selectedKanzlei?.id ?? kanzleiList[0]?.id ?? "",
      name: "",
      email: "",
      telefon: ""
    });
  };

  const createKanzlei = kanzleiForm.handleSubmit(async (values) => {
    const response = await fetch("/api/kanzleien", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });

    const payload = await response.json();

    if (!response.ok) {
      const { error } = payload;
      toast.error(error ?? "Kanzlei konnte nicht angelegt werden");
      return;
    }

    toast.success("Kanzlei angelegt");
    const { data } = payload;
    if (data) {
      setKanzleiList((prev) => [...prev, data]);
      setSelectedKanzlei(data);
    }
    resetForms();
  });

  const createContact = kontaktForm.handleSubmit(async (values) => {
    const response = await fetch("/api/sachbearbeiter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    const payload = await response.json();
    if (!response.ok) {
      const { error } = payload;
      toast.error(error ?? "Sachbearbeiter konnte nicht angelegt werden");
      return;
    }
    toast.success("Sachbearbeiter angelegt");
    const { data } = payload;
    if (data) {
      setContactList((prev) => [...prev, data]);
    }
    resetForms();
  });

  const deleteContact = async (id: string) => {
    const response = await fetch(`/api/sachbearbeiter?id=${id}`, { method: "DELETE" });
    const payload = await response.json();
    if (!response.ok) {
      const { error } = payload;
      toast.error(error ?? "Sachbearbeiter konnte nicht gelöscht werden");
      return;
    }
    toast.success("Sachbearbeiter gelöscht");
    setContactList((prev) => prev.filter((contact) => contact.id !== id));
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-slate-100">Kanzleien</h1>
        <p className="text-slate-400">
          Verwalte Kanzleien und zugehörige Sachbearbeiter. Änderungen werden in Supabase gespeichert.
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-3xl border border-slate-800 bg-surface p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-200">Kanzleiliste</h2>
          <ul className="space-y-2 text-sm">
            {kanzleiList.map((kanzlei) => (
              <li key={kanzlei.id}>
                <button
                  onClick={() => setSelectedKanzlei(kanzlei)}
                  className={clsx(
                    "w-full rounded-xl px-4 py-3 text-left transition",
                    selectedKanzlei?.id === kanzlei.id
                      ? "bg-accent/20 text-accent"
                      : "bg-muted text-slate-300 hover:bg-muted/60"
                  )}
                >
                  <p className="font-semibold">{kanzlei.name}</p>
                  {kanzlei.ansprechpartner && (
                    <p className="text-xs text-slate-400">Ansprechpartner: {kanzlei.ansprechpartner}</p>
                  )}
                </button>
              </li>
            ))}
            {kanzleiList.length === 0 && (
              <li className="text-xs text-slate-500">Noch keine Kanzleien angelegt.</li>
            )}
          </ul>
        </aside>
        <section className="space-y-6">
          {selectedKanzlei && (
            <div className="rounded-3xl border border-slate-800 bg-surface p-6">
              <h2 className="text-lg font-semibold text-slate-100">{selectedKanzlei.name}</h2>
              <p className="text-sm text-slate-400">
                Ansprechpartner: {selectedKanzlei.ansprechpartner ?? "–"}
              </p>
              <p className="mt-2 text-sm text-slate-400">
                {selectedKanzlei.allgemeine_infos ?? "Keine zusätzlichen Informationen"}
              </p>
            </div>
          )}
          <div className="grid gap-6 lg:grid-cols-2">
            <form onSubmit={createKanzlei} className="space-y-4 rounded-3xl border border-slate-800 bg-surface p-6">
              <h3 className="text-sm font-semibold text-slate-100">Neue Kanzlei</h3>
              <div className="space-y-2">
                <label className="text-xs text-slate-400">Name</label>
                <input
                  {...kanzleiForm.register("name", { required: true })}
                  className="w-full rounded-xl bg-muted px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/60"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-400">Ansprechpartner</label>
                <input
                  {...kanzleiForm.register("ansprechpartner")}
                  className="w-full rounded-xl bg-muted px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/60"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-400">Allgemeine Infos</label>
                <textarea
                  rows={4}
                  {...kanzleiForm.register("allgemeine_infos")}
                  className="w-full rounded-xl bg-muted px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/60"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-full bg-accent px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-accent/90"
              >
                Speichern
              </button>
            </form>
            <form onSubmit={createContact} className="space-y-4 rounded-3xl border border-slate-800 bg-surface p-6">
              <h3 className="text-sm font-semibold text-slate-100">Neuer Sachbearbeiter</h3>
              <div className="space-y-2">
                <label className="text-xs text-slate-400">Kanzlei</label>
                <select
                  {...kontaktForm.register("kanzlei_id", { required: true })}
                  className="w-full rounded-xl bg-muted px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/60"
                >
                  {kanzleiList.map((kanzlei) => (
                    <option key={kanzlei.id} value={kanzlei.id}>
                      {kanzlei.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-400">Name</label>
                <input
                  {...kontaktForm.register("name", { required: true })}
                  className="w-full rounded-xl bg-muted px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/60"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-400">E-Mail</label>
                <input
                  type="email"
                  {...kontaktForm.register("email")}
                  className="w-full rounded-xl bg-muted px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/60"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-400">Telefon</label>
                <input
                  {...kontaktForm.register("telefon")}
                  className="w-full rounded-xl bg-muted px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/60"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-full bg-accent px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-accent/90"
              >
                Speichern
              </button>
            </form>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-surface p-6">
            <h3 className="mb-4 text-sm font-semibold text-slate-100">Sachbearbeiter</h3>
            <ul className="space-y-3 text-sm text-slate-300">
              {contactsForSelected.map((contact) => (
                <li key={contact.id} className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
                  <div>
                    <p className="font-semibold text-slate-100">{contact.name}</p>
                    <p className="text-xs text-slate-400">{contact.email ?? "Keine E-Mail"}</p>
                  </div>
                  <button
                    onClick={() => deleteContact(contact.id)}
                    className="text-xs text-rose-400 hover:text-rose-300"
                  >
                    Löschen
                  </button>
                </li>
              ))}
              {contactsForSelected.length === 0 && (
                <li className="text-xs text-slate-500">Keine Sachbearbeiter für diese Kanzlei.</li>
              )}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
