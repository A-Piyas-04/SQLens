import type { RefObject } from "react";

import type { PracticeCategoryId } from "../../constants/practiceCategories";
import type { SqlEditorHandle } from "../editor/SqlEditor";
import SchemaSidebar from "../schema/SchemaSidebar";
import type { SchemaTable } from "../../lib/db/schema";
import PracticeCategoryContent from "./PracticeCategoryContent";
import PracticeNavList from "./PracticeNavList";

type Props = {
  tables: SchemaTable[];
  activeCategory: PracticeCategoryId | null;
  onSelectCategory: (id: PracticeCategoryId | null) => void;
  isLoading: boolean;
  onRefreshSchema: () => void;
  onLoadSampleDatabase: (databaseId: string) => void;
  onLoadQuery: (sql: string) => void;
  onApplyVisualizationPreset: (presetId: string) => void;
  editorRef: RefObject<SqlEditorHandle | null>;
};

export default function PracticeSidebar({
  tables,
  activeCategory,
  onSelectCategory,
  isLoading,
  onRefreshSchema,
  onLoadSampleDatabase,
  onLoadQuery,
  onApplyVisualizationPreset,
  editorRef,
}: Props) {
  function handleInsertSnippet(sql: string) {
    const needsSpace = sql.match(/^(INNER|LEFT|RIGHT|JOIN|GROUP|HAVING|ORDER|LIMIT)/i);
    const text = needsSpace ? ` ${sql}` : sql;
    editorRef.current?.insertAtCursor(text);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <SchemaSidebar tables={tables} onRefresh={onRefreshSchema} />

      <PracticeNavList
        activeCategory={activeCategory}
        onSelectCategory={onSelectCategory}
      />

      {activeCategory ? (
        <div className="min-h-0 flex-1 overflow-y-auto border-t border-slate-800/60 pt-4 scrollbar-thin">
          <PracticeCategoryContent
            categoryId={activeCategory}
            isLoading={isLoading}
            onLoadSampleDatabase={onLoadSampleDatabase}
            onLoadQuery={onLoadQuery}
            onInsertSnippet={handleInsertSnippet}
            onApplyVisualizationPreset={onApplyVisualizationPreset}
          />
        </div>
      ) : null}
    </div>
  );
}
