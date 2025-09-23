"use client";

import { KanbanProject, Kanzlei, Sachbearbeiter } from "@/components/kanban/types";
import { ProjectSheet } from "@/components/kanban/project-sheet";
import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface KanbanProjectCardProps {
  project: KanbanProject;
  kanzleien: Kanzlei[];
  sachbearbeiter: Sachbearbeiter[];
  vorlagen: Array<{ id: string; name: string; betreff: string | null; inhalt: string | null }>;
  isUpdating: boolean;
}

export function KanbanProjectCard({
  project,
  kanzleien,
  sachbearbeiter,
  vorlagen,
  isUpdating
}: KanbanProjectCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { attributes, listeners, setNodeRef: setSortableRef, transform, transition } = useSortable({
    id: project.id,
    data: { bucket: project.bucket }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <>
      <article
        ref={setSortableRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => setIsOpen(true)}
        className="card-shadow cursor-pointer rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-900/40 p-4 transition hover:border-accent/60 hover:shadow-xl"
      >
        <header className="mb-2 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-100">{project.titel}</h3>
          {project.projekt_typ && (
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs text-accent">
              {project.projekt_typ}
            </span>
          )}
        </header>
        <dl className="space-y-1 text-xs text-slate-400">
          {project.kanzleien?.name && (
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Kanzlei</dt>
              <dd className="text-slate-300">{project.kanzleien.name}</dd>
            </div>
          )}
          {project.faelligkeits_datum && (
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Fällig</dt>
              <dd className="text-slate-300">{new Date(project.faelligkeits_datum).toLocaleDateString("de-DE")}</dd>
            </div>
          )}
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Priorität</dt>
            <dd className="text-slate-300">{project.prioritaet}</dd>
          </div>
        </dl>
      </article>
      <ProjectSheet
        project={project}
        open={isOpen}
        onOpenChange={setIsOpen}
        kanzleien={kanzleien}
        sachbearbeiter={sachbearbeiter}
        vorlagen={vorlagen}
        isUpdating={isUpdating}
      />
    </>
  );
}
