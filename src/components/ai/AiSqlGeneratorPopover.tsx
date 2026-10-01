import { useEffect, useState } from "react";
import { AlertTriangle, Lightbulb, X } from "lucide-react";

import { AiSqlIcon } from "../icons";
import AiPrivacyNotice from "./AiPrivacyNotice";
import AiSchemaToggle from "./AiSchemaToggle";
import { useAiPrivacy } from "../../hooks/useAiPrivacy";
import { MAX_AI_PROMPT_CHARS, requestSqlGuidance } from "../../lib/api/aiClient";
import { formatSchemaForAi } from "../../lib/api/formatSchemaForAi";
import type { SqlGuidance } from "../../lib/api/sqlGuidanceTypes";
import type { SchemaTable } from "../../lib/db/schema";
import { cn } from "../../lib/utils/cn";
import {
  HEADER_ACTION_ICON_SIZE,
  headerActionButtonClass,
  headerActionButtonOpenClass,
  headerActionIconAccentClass,
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
  const privacy = useAiPrivacy();

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onToggle();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onToggle]);

  function handleGetSuggestions() {
    if (!prompt.trim() || isLoading) return;
    privacy.runWithConsent(() => void requestSuggestions());
  }

  async function requestSuggestions() {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError("");
    setGuidance(null);

    try {
      const schema = privacy.includeSchema ? formatSchemaForAi(tables) : "";
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
            "w-[min(calc(100vw-1.5rem),32rem)] sm:w-[min(calc(100vw-2rem),36rem)]",
            "max-h-[min(85vh,42rem)] overflow-y-auto",
            "rounded-sm border border-line bg-surface-elevated p-5 sm:p-6",
            "shadow-md scrollbar-thin"
          )}
        >
          <div className="mb-4 flex items-center justify-between gap-2 border-b border-line pb-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <AiSqlIcon size={24} className="shrink-0" />
              <h2 className="truncate text-base font-semibold text-ink sm:text-lg">
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

          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink-muted">
                Ask about a query goal
              </span>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder='e.g. Show courses taken by students in the CSE department'
                rows={4}
                maxLength={MAX_AI_PROMPT_CHARS}
                disabled={disabled || isLoading}
                className="min-h-[6.5rem] w-full resize-y rounded-sm border border-line bg-surface-inset px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 sm:text-base"
              />
            </label>

            <AiSchemaToggle
              checked={privacy.includeSchema}
              onChange={privacy.setIncludeSchema}
              disabled={disabled || isLoading}
            />

            {privacy.isConsentPending ? (
              <AiPrivacyNotice
                onContinue={privacy.continueWithConsent}
                onCancel={privacy.cancelConsent}
              />
            ) : (
              <Button
                type="button"
                variant="primary"
                size="md"
                className="w-full"
                disabled={disabled || isLoading || !prompt.trim()}
                onClick={handleGetSuggestions}
              >
                <Lightbulb className="size-4 shrink-0" aria-hidden />
                {isLoading ? "Thinking…" : "Get suggestions"}
              </Button>
            )}

            {error ? (
              <p className="text-xs text-red-600" role="alert">
                {error}
              </p>
            ) : null}

            {guidance ? (
              <div className="space-y-5 border-t border-line pt-4">
                <p className="text-sm leading-relaxed text-ink-secondary sm:text-base">
                  {guidance.summary}
                </p>

                {guidance.problemBreakdown.length > 0 ? (
                  <section>
                    <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-ink-muted sm:text-sm">
                      Break it down
                    </h3>
                    <ol className="list-decimal space-y-2 pl-5 text-sm text-ink-secondary sm:text-base">
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
                    <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-ink-muted sm:text-sm">
                      Techniques to consider
                    </h3>
                    <ul className="space-y-2.5">
                      {guidance.techniques.map((technique) => (
                        <li
                          key={`${technique.name}-${technique.whenToUse}`}
                          className="rounded-sm border border-line bg-surface-muted/50 px-4 py-3"
                        >
                          <p className="text-sm font-semibold text-accent-ink sm:text-base">
                            {technique.name}
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-ink-secondary sm:text-base">
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
                    <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-ink-muted sm:text-sm">
                      Tables & columns
                    </h3>
                    <ul className="space-y-1.5 text-sm text-ink-secondary sm:text-base">
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
                    <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted sm:text-sm">
                      <AlertTriangle className="size-4" aria-hidden />
                      Pitfalls
                    </h3>
                    <ul className="space-y-1.5 text-sm text-ink-secondary sm:text-base">
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

            <p className="text-sm text-ink-muted">
              Suggestions only — write the SQL yourself in the editor.
            </p>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        data-tour="ai-sql"
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
          <AiSqlIcon size={HEADER_ACTION_ICON_SIZE} className={cn("shrink-0", headerActionIconAccentClass)} />
        )}
        <span>{isOpen ? "Close" : "AI SQL"}</span>
      </button>
    </div>
  );
}
