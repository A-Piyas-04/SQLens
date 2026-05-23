import {
  Braces,
  Database,
  FileCode2,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type PracticeCategoryId =
  | "samples"
  | "templates"
  | "snippets"
  | "presets";

export type PracticeCategory = {
  id: PracticeCategoryId;
  title: string;
  icon: LucideIcon;
};

export const PRACTICE_CATEGORIES: PracticeCategory[] = [
  { id: "samples", title: "Sample Databases", icon: Database },
  { id: "templates", title: "Query Templates", icon: FileCode2 },
  { id: "snippets", title: "SQL Snippets", icon: Braces },
  { id: "presets", title: "Visualization Presets", icon: Sparkles },
];

export function getPracticeCategory(id: PracticeCategoryId): PracticeCategory {
  const category = PRACTICE_CATEGORIES.find((c) => c.id === id);
  if (!category) throw new Error(`Unknown practice category: ${id}`);
  return category;
}
