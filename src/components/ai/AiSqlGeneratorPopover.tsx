import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";

import { generateSql } from "../../lib/api/aiClient";
import { assertSafeSql } from "../../lib/sql/assertSafeSql";
import { cn } from "../../lib/utils/cn";
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
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px]"
          aria-label="Close AI SQL generator"
          onClick={onToggle}
        />
      ) : null}

      {isOpen ? (
        <div
          className={cn(
            "practice-radial-panel absolute right-0 top-full z-50 mt-2",
            "w-[min(calc(100vw-2rem),320px)]",
            "rounded-xl border border-slate-700/80 bg-slate-900/95 p-4",
            "shadow-2xl shadow-slate-950/60 backdrop-blur-md"
          )}
        >
          <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
            <div className="flex min-w-0 items-center gap-2">
              <Sparkles className="size-4 shrink-0 text-blue-400" aria-hidden />
              <h2 className="truncate text-sm font-semibold text-slate-100">
                AI SQL Generator
              </h2>
            </div>
            <button
              type="button"
              onClick={onToggle}
              className="shrink-0 rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-200"
              aria-label="Close AI SQL generator"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-400">
                Describe the query you want
              </span>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Show students with GPA above 3.5"
                rows={3}
                disabled={disabled || isLoading}
                className="w-full resize-none rounded-lg border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50"
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
              <Sparkles className="size-3.5" aria-hidden />
              {isLoading ? "Generating…" : "Generate SQL"}
            </Button>

            {error ? (
              <p className="text-xs text-red-300" role="alert">
                {error}
              </p>
            ) : (
              <p className="text-xs text-slate-500">
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
          "practice-hub-toggle relative z-20 flex size-14 cursor-not-allowed items-center justify-center rounded-full",
          "border border-slate-600/80 bg-slate-800/95 text-blue-300 opacity-60",
          "shadow-xl shadow-slate-950/60 backdrop-blur-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
        )}
      >
        {isOpen ? (
          <X className="size-5" aria-hidden />
        ) : (
          <Sparkles className="size-5" aria-hidden />
        )}
      </button>
    </div>
  );
}
