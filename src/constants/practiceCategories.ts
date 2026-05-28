import type { AppIconComponent } from "../components/icons";
import {
  QueryTemplateIcon,
  SampleDatabaseIcon,
  SqlSnippetIcon,
  VisualizationPresetIcon,
} from "../components/icons";

export type PracticeCategoryId =
  | "samples"
  | "templates"
  | "snippets"
  | "presets";

export type PracticeCategory = {
  id: PracticeCategoryId;
  title: string;
  icon: AppIconComponent;
};

export const PRACTICE_CATEGORIES: PracticeCategory[] = [
  { id: "samples", title: "Sample Databases", icon: SampleDatabaseIcon },
  { id: "templates", title: "Query Templates", icon: QueryTemplateIcon },
  { id: "snippets", title: "SQL Snippets", icon: SqlSnippetIcon },
  { id: "presets", title: "Visualization Presets", icon: VisualizationPresetIcon },
];

export function getPracticeCategory(id: PracticeCategoryId): PracticeCategory {
  const category = PRACTICE_CATEGORIES.find((c) => c.id === id);
  if (!category) throw new Error(`Unknown practice category: ${id}`);
  return category;
}
