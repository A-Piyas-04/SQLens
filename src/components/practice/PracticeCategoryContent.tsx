import { SAMPLE_DATABASES } from "../../data/sampleDatabases";
import {
  QUERY_TEMPLATES,
  TEMPLATE_CATEGORIES,
} from "../../data/queryTemplates";
import { SQL_SNIPPETS } from "../../data/sqlSnippets";
import { VISUALIZATION_PRESETS } from "../../data/visualizationPresets";
import type { PracticeCategoryId } from "../../constants/practiceCategories";
import Button from "../common/Button";
import { cn } from "../../lib/utils/cn";

type Props = {
  categoryId: PracticeCategoryId;
  isLoading: boolean;
  onLoadSampleDatabase: (databaseId: string) => void;
  onLoadQuery: (sql: string) => void;
  onInsertSnippet: (sql: string) => void;
  onApplyVisualizationPreset: (presetId: string) => void;
  compact?: boolean;
};

export default function PracticeCategoryContent({
  categoryId,
  isLoading,
  onLoadSampleDatabase,
  onLoadQuery,
  onInsertSnippet,
  onApplyVisualizationPreset,
  compact = false,
}: Props) {
  if (categoryId === "samples") {
    return (
      <div className={cn("space-y-2", compact && "max-h-[min(60vh,420px)] overflow-y-auto scrollbar-thin")}>
        <p className="text-xs text-slate-500">
          Replaces the current project database with a ready-made schema and seed data.
        </p>
        <ul className="space-y-2">
          {SAMPLE_DATABASES.map((sample) => (
            <li key={sample.id}>
              <Button
                variant="secondary"
                size="sm"
                disabled={isLoading}
                onClick={() => onLoadSampleDatabase(sample.id)}
                className="h-auto w-full flex-col items-start gap-1 py-2 text-left"
              >
                <span className="font-medium text-slate-100">{sample.name}</span>
                <span className="text-xs font-normal text-slate-400">
                  {sample.description}
                </span>
              </Button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (categoryId === "templates") {
    return (
      <div className={cn("space-y-3", compact && "max-h-[min(60vh,420px)] overflow-y-auto scrollbar-thin")}>
        <p className="text-xs text-slate-500">
          Load a practice query into the editor. Adapt table names to your schema.
        </p>
        {TEMPLATE_CATEGORIES.map((category) => {
          const templates = QUERY_TEMPLATES.filter((t) => t.category === category);
          return (
            <div key={category} className="space-y-1.5">
              <h3 className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                {category}
              </h3>
              <ul className="space-y-1">
                {templates.map((template) => (
                  <li key={template.id}>
                    <button
                      type="button"
                      onClick={() => onLoadQuery(template.sql)}
                      className="w-full rounded-md px-2 py-1.5 text-left text-xs text-slate-300 transition-colors hover:bg-slate-800/70 hover:text-slate-100"
                    >
                      {template.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    );
  }

  if (categoryId === "snippets") {
    return (
      <div className="space-y-2">
        <p className="text-xs text-slate-500">
          Inserts at the cursor. Add a leading space in the editor if needed.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {SQL_SNIPPETS.map((snippet) => (
            <button
              key={snippet.id}
              type="button"
              onClick={() => onInsertSnippet(snippet.sql)}
              className={cn(
                "rounded-md border border-slate-700/80 bg-slate-800/50 px-2 py-1",
                "font-mono text-[11px] text-slate-300",
                "transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-slate-100"
              )}
              title={snippet.sql}
            >
              {snippet.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", compact && "max-h-[min(60vh,420px)] overflow-y-auto scrollbar-thin")}>
      <p className="text-xs text-slate-500">
        Loads the sample database, runs the query, and prepares results for visualization.
      </p>
      <ul className="space-y-2">
        {VISUALIZATION_PRESETS.map((preset) => (
          <li key={preset.id}>
            <Button
              variant="ghost"
              size="sm"
              disabled={isLoading}
              onClick={() => onApplyVisualizationPreset(preset.id)}
              className="h-auto w-full flex-col items-start gap-1 py-2 text-left"
            >
              <span className="font-medium text-slate-200">{preset.title}</span>
              <span className="text-xs font-normal text-slate-500">
                {preset.description}
              </span>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
