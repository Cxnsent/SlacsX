import { Database } from "@/types/database";

export type KanbanProject = Database["public"]["Tables"]["projekte"]["Row"] & {
  dokumente?: Database["public"]["Tables"]["dokumente"]["Row"][] | null;
  kanzleien?: { id: string; name: string } | null;
};

export type Kanzlei = Database["public"]["Tables"]["kanzleien"]["Row"];
export type Sachbearbeiter = Database["public"]["Tables"]["sachbearbeiter"]["Row"];
