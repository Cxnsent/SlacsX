"use client";

import { KanbanProject } from "@/components/kanban/types";
import { KanbanProjectCard } from "@/components/kanban/project-card";
import { BucketDefinition } from "@/components/kanban/workflow";
import { useMemo, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

interface KanbanColumnProps {
  definition: BucketDefinition;
  projects: KanbanProject[];
  kanzleien: Array<{ id: string; name: string }>;
  sachbearbeiter: Array<{ id: string; kanzlei_id: string; name: string }>;
  vorlagen: Array<{ id: string; name: string; betreff: string | null; inhalt: string | null }>;
  isPending: boolean;
}

export function KanbanColumn({
  definition,
  projects,
  kanzleien,
  sachbearbeiter,
  vorlagen,
  isPending
}: KanbanColumnProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { setNodeRef, isOver } = useDroppable({ id: definition.id });

  const filtered = useMemo(() => {
    if (!searchTerm) return projects;
    return projects.filter((project) =>
      project.titel.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [projects, searchTerm]);

  return (
    <section
      ref={setNodeRef}
      className={`min-w-[340px] rounded-3xl bg-surface p-5 text-slate-200 transition ${
        isOver ? "ring-2 ring-accent/60" : ""
      }`}
    >
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">{definition.title}</h2>
          <p className="text-xs text-slate-400">{definition.description}</p>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs text-slate-300">
          {projects.length}
        </span>
      </header>
      <div className="mb-4">
        <input
          className="w-full rounded-xl bg-muted px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/60"
          placeholder="Suchen..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>
      <SortableContext
        id={definition.id}
        items={filtered.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4">
          {filtered.map((project) => (
            <KanbanProjectCard
              key={project.id}
              project={project}
              kanzleien={kanzleien}
              sachbearbeiter={sachbearbeiter}
              vorlagen={vorlagen}
              isUpdating={isPending}
            />
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-slate-500">Keine Projekte in diesem Status.</p>
          )}
        </div>
      </SortableContext>
    </section>
  );
}
