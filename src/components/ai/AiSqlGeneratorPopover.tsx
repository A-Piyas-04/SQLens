import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { AiSqlIcon } from "../icons";
import { generateSql } from "../../lib/api/aiClient";
import { assertSafeSql } from "../../lib/sql/assertSafeSql";
import { cn } from "../../lib/utils/cn";
import {
  HEADER_ACTION_ICON_SIZE,
  headerActionButtonClass,
  headerActionButtonOpenClass,
} from "../layout/headerActionButton";
import Button from "../common/Button";

type Props = {
  isOpen: boolean;
  onToggle: () => void;
  onApplySql: (sql: string) => void;
  disabled?: boolean;
};

export default function AiSqlGeneratorPopover({
  isOpen,
  onToggle,
  onApplySql,
  disabled = false,
}: Props) {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onToggle();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onToggle]);

  async function handleGenerate() {
    const trimmed = prompt.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    setError("");

    try {
      const sql = await generateSql(trimmed);
      assertSafeSql(sql);
      onApplySql(sql);
      onToggle();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate SQL.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative z-50 shrink-0">
      {isOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-surface-inset "
          aria-label="Close AI SQL generator"
          onClick={onToggle}
        />
      ) : null}

      {isOpen ? (
        <div
          className={cn(
            "practice-radial-panel absolute right-0 top-full z-50 mt-2",
            "w-[min(calc(100vw-2rem),320px)]",
            "rounded-sm border border-line bg-surface-elevated p-4",
            "shadow-md"
          )}
        >
          <div className="mb-3 flex items-center justify-between gap-2 border-b border-line pb-2">
            <div className="flex min-w-0 items-center gap-2">
              <AiSqlIcon size={22} className="shrink-0" />
              <h2 className="truncate text-sm font-semibold text-ink">
                AI SQL Generator
              </h2>
            </div>
            <button
              type="button"
              onClick={onToggle}
              className="shrink-0 rounded p-1 text-ink-muted hover:bg-surface-muted hover:text-ink"
              aria-label="Close AI SQL generator"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-ink-muted">
                Describe the query you want
              </span>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Show students with GPA above 3.5"
                rows={3}
                disabled={disabled || isLoading}
                className="w-full resize-none rounded-sm border border-line bg-surface-inset px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
              />
            </label>

            <Button
              type="button"
              variant="primary"
              size="sm"
              className="w-full"
              disabled={disabled || isLoading || !prompt.trim()}
              onClick={() => void handleGenerate()}
            >
              <AiSqlIcon size={16} className="shrink-0" />
              {isLoading ? "Generating…" : "Generate SQL"}
            </Button>

            {error ? (
              <p className="text-xs text-red-300" role="alert">
                {error}
              </p>
            ) : (
              <p className="text-xs text-ink-muted">
                SQL is inserted into the editor. Review and run manually.
              </p>
            )}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        disabled
        title="coming soon"
        aria-label="AI SQL generator — coming soon"
        aria-disabled
        className={cn(
          headerActionButtonClass,
          "practice-hub-toggle cursor-not-allowed opacity-60",
          isOpen && headerActionButtonOpenClass
        )}
      >
        {isOpen ? (
          <X className="size-6" aria-hidden />
        ) : (
          <AiSqlIcon size={HEADER_ACTION_ICON_SIZE} />
        )}
      </button>
    </div>
  );
}
