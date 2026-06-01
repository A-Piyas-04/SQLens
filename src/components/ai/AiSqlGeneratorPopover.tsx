import { useEffect, useState } from "react";
import { AlertTriangle, Lightbulb, X } from "lucide-react";

import { AiSqlIcon } from "../icons";
import { requestSqlGuidance } from "../../lib/api/aiClient";
import { formatSchemaForAi } from "../../lib/api/formatSchemaForAi";
import type { SqlGuidance } from "../../lib/api/sqlGuidanceTypes";
import type { SchemaTable } from "../../lib/db/schema";
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
  tables: SchemaTable[];
  disabled?: boolean;
};

export default function AiSqlGeneratorPopover({
  isOpen,
  onToggle,
  tables,
  disabled = false,
}: Props) {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [guidance, setGuidance] = useState<SqlGuidance | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onToggle();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onToggle]);

  async function handleGetSuggestions() {
    const trimmed = prompt.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    setError("");
    setGuidance(null);

    try {
      const schema = formatSchemaForAi(tables);
      const result = await requestSqlGuidance(trimmed, schema || undefined);
      setGuidance(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to get suggestions."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative z-50 shrink-0">
      {isOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-surface-inset"
          aria-label="Close SQL assistant"
          onClick={onToggle}
        />
      ) : null}

      {isOpen ? (
        <div
          className={cn(
            "practice-radial-panel absolute right-0 top-full z-50 mt-2",
            "w-[min(calc(100vw-2rem),380px)]",
            "max-h-[min(70vh,520px)] overflow-y-auto",
            "rounded-sm border border-line bg-surface-elevated p-4",
            "shadow-md scrollbar-thin"
          )}
        >
          <div className="mb-3 flex items-center justify-between gap-2 border-b border-line pb-2">
            <div className="flex min-w-0 items-center gap-2">
              <AiSqlIcon size={22} className="shrink-0" />
              <h2 className="truncate text-sm font-semibold text-ink">
                SQL Assistant
              </h2>
            </div>
            <button
              type="button"
              onClick={onToggle}
              className="shrink-0 rounded p-1 text-ink-muted hover:bg-surface-muted hover:text-ink"
              aria-label="Close SQL assistant"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-ink-muted">
                Ask about a query goal
              </span>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder='e.g. Show courses taken by students in the CSE department'
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
              onClick={() => void handleGetSuggestions()}
            >
              <Lightbulb className="size-4 shrink-0" aria-hidden />
              {isLoading ? "Thinking…" : "Get suggestions"}
            </Button>

            {error ? (
              <p className="text-xs text-red-600" role="alert">
                {error}
              </p>
            ) : null}

            {guidance ? (
              <div className="space-y-4 border-t border-line pt-3">
                <p className="text-sm leading-relaxed text-ink-secondary">
                  {guidance.summary}
                </p>

                {guidance.problemBreakdown.length > 0 ? (
                  <section>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Break it down
                    </h3>
                    <ol className="list-decimal space-y-1.5 pl-4 text-sm text-ink-secondary">
                      {guidance.problemBreakdown.map((step) => (
                        <li key={step} className="leading-relaxed">
                          {step}
                        </li>
                      ))}
                    </ol>
                  </section>
                ) : null}

                {guidance.techniques.length > 0 ? (
                  <section>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Techniques to consider
                    </h3>
                    <ul className="space-y-2">
                      {guidance.techniques.map((technique) => (
                        <li
                          key={`${technique.name}-${technique.whenToUse}`}
                          className="rounded-sm border border-line bg-surface-muted/50 px-3 py-2"
                        >
                          <p className="text-sm font-semibold text-accent-ink">
                            {technique.name}
                          </p>
                          <p className="mt-0.5 text-sm leading-relaxed text-ink-secondary">
                            {technique.whenToUse}
                          </p>
                          {technique.notes ? (
                            <p className="mt-1 text-xs text-ink-muted">
                              {technique.notes}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {guidance.tablesAndColumns.length > 0 ? (
                  <section>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Tables & columns
                    </h3>
                    <ul className="space-y-1 text-sm text-ink-secondary">
                      {guidance.tablesAndColumns.map((item) => (
                        <li key={item} className="leading-relaxed">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {guidance.pitfalls.length > 0 ? (
                  <section>
                    <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      <AlertTriangle className="size-3.5" aria-hidden />
                      Pitfalls
                    </h3>
                    <ul className="space-y-1 text-sm text-ink-secondary">
                      {guidance.pitfalls.map((item) => (
                        <li key={item} className="leading-relaxed">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </div>
            ) : null}

            <p className="text-xs text-ink-muted">
              Suggestions only — write the SQL yourself in the editor.
            </p>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        title={disabled ? "SQL assistant unavailable while query runs" : "SQL assistant"}
        aria-label={isOpen ? "Close SQL assistant" : "Open SQL assistant"}
        aria-expanded={isOpen}
        className={cn(
          headerActionButtonClass,
          "practice-hub-toggle",
          isOpen && headerActionButtonOpenClass,
          disabled && "cursor-not-allowed opacity-60"
        )}
      >
        {isOpen ? (
          <X className="size-4 shrink-0" aria-hidden />
        ) : (
          <AiSqlIcon size={HEADER_ACTION_ICON_SIZE} className="shrink-0" />
        )}
        <span>{isOpen ? "Close" : "AI SQL"}</span>
      </button>
    </div>
  );
}
