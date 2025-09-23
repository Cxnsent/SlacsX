import { KanbanProject } from "@/components/kanban/types";
import { bucketDefinitions } from "@/components/kanban/workflow";

export type BucketMap = Record<string, KanbanProject[]>;

export function reorderProjectsByBucket(projects: KanbanProject[]): BucketMap {
  const bucketOrder = new Set(bucketDefinitions.map((bucket) => bucket.id));
  return projects.reduce<BucketMap>((acc, project) => {
    const bucket = bucketOrder.has(project.bucket) ? project.bucket : bucketDefinitions[0].id;
    if (!acc[bucket]) {
      acc[bucket] = [];
    }
    acc[bucket]?.push(project);
    return acc;
  }, {});
}
