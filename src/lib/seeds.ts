import { BASE_CATEGORIES, BASE_INSTITUTIONS } from "./constants";
import { uid } from "./format";
import type { Category, Institution } from "./types";

export function seedInstitutions(workspaceId: string): Institution[] {
  return BASE_INSTITUTIONS.map((name) => ({
    id: uid("inst"),
    workspaceId,
    name,
    isSystem: true,
  }));
}

export function seedCategories(workspaceId: string): Category[] {
  return BASE_CATEGORIES.map((c) => ({
    id: uid("cat"),
    workspaceId,
    name: c.name,
    kind: c.kind,
    isSystem: true,
    icon: c.icon,
    color: c.color,
    isArchived: false,
  }));
}
