"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanColumn } from "@/components/kanban/kanban-column";
import { KanbanProject } from "@/components/kanban/types";
import { toast } from "sonner";
import { reorderProjectsByBucket } from "@/components/kanban/utils";
import { BucketDefinition, bucketDefinitions } from "@/components/kanban/workflow";
import { PdfUploadDropzone } from "@/components/ocr/pdf-dropzone";

interface KanbanBoardProps {
  projects: KanbanProject[];
  kanzleien: Array<{ id: string; name: string }>;
  sachbearbeiter: Array<{ id: string; kanzlei_id: string; name: string }>;
  vorlagen: Array<{ id: string; name: string; betreff: string | null; inhalt: string | null }>;
}

export function KanbanBoard({ projects, kanzleien, sachbearbeiter, vorlagen }: KanbanBoardProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const [items, setItems] = useState(() => reorderProjectsByBucket(projects));
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setItems(reorderProjectsByBucket(projects));
  }, [projects]);

  const bucketOrder = useMemo(
    () => bucketDefinitions.map((definition: BucketDefinition) => definition.id),
    []
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const overContainer = (over.data?.current as any)?.sortable?.containerId ?? over.id;
    if (active.data.current?.bucket === overContainer) {
      return;
    }

    startTransition(async () => {
      setItems((prev) => {
        const sourceBucket = active.data.current?.bucket as string;
        const targetBucket = overContainer as string;
        if (!sourceBucket || !targetBucket) {
          return prev;
        }
        const updated = { ...prev };
        const sourceItems = [...(updated[sourceBucket] ?? [])];
        const targetItems = [...(updated[targetBucket] ?? [])];
        const activeIndex = sourceItems.findIndex((item) => item.id === active.id);
        if (activeIndex === -1) {
          return prev;
        }
        const [moved] = sourceItems.splice(activeIndex, 1);
        moved.bucket = targetBucket;
        targetItems.push(moved);
        updated[sourceBucket] = sourceItems;
        updated[targetBucket] = targetItems;
        if (active.data.current) {
          active.data.current.bucket = targetBucket;
        }
        return updated;
      });

      const response = await fetch("/api/projects/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: active.id, bucket: overContainer })
      });

      if (!response.ok) {
        const { error } = await response.json();
        toast.error(error ?? "Projekt konnte nicht verschoben werden");
      } else {
        toast.success("Projekt aktualisiert");
      }
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex-1 space-y-2">
          <h1 className="text-3xl font-semibold text-slate-100">Mandanten Pipeline</h1>
          <p className="max-w-2xl text-slate-400">
            Koordiniere Konzeptblatt, Angebot und Onboarding in einem Board. Ziehe Karten zwischen
            den Buckets, um den Fortschritt zu dokumentieren. PDFs können direkt hochgeladen
            werden, um neue Projekte zu erzeugen.
          </p>
        </div>
        <PdfUploadDropzone kanzleien={kanzleien} />
      </header>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="scrollbar-thin flex gap-4 overflow-x-auto pb-4">
          <SortableContext items={bucketOrder} strategy={horizontalListSortingStrategy}>
            {bucketDefinitions.map((definition) => (
              <KanbanColumn
                key={definition.id}
                definition={definition}
                projects={items[definition.id] ?? []}
                kanzleien={kanzleien}
                sachbearbeiter={sachbearbeiter}
                vorlagen={vorlagen}
                isPending={isPending}
              />
            ))}
          </SortableContext>
        </div>
      </DndContext>
    </div>
  );
}
