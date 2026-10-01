import { AlertTriangle, Lightbulb, MessageCircle, X } from "lucide-react";
import { useEffect, useState } from "react";

import Button from "../../../components/common/Button";
import Panel from "../../../components/common/Panel";
import AiPrivacyNotice from "../../../components/ai/AiPrivacyNotice";
import AiSchemaToggle from "../../../components/ai/AiSchemaToggle";
import { useAiPrivacy } from "../../../hooks/useAiPrivacy";
import { MAX_AI_PROMPT_CHARS, requestSql50Coaching } from "../../../lib/api/aiClient";
import { formatSchemaForAi } from "../../../lib/api/formatSchemaForAi";
import type { SqlGuidance } from "../../../lib/api/sqlGuidanceTypes";
import type { SchemaTable } from "../../../lib/db/schema";
import type { Sql50Problem } from "../types/sql50";

type Props = {
  problem: Sql50Problem;
  hintsUsed: number;
  tables: SchemaTable[];
  lastError?: string;
  isOpen: boolean;
  onToggle: () => void;
};

export default function AiCoachPanel({
  problem,
  hintsUsed,
  tables,
  lastError,
  isOpen,
  onToggle,
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

  function handleAskCoach() {
    if (!prompt.trim() || isLoading) return;
    privacy.runWithConsent(() => void requestCoaching());
  }

  async function requestCoaching() {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError("");
    setGuidance(null);

    try {
      const schema = privacy.includeSchema ? formatSchemaForAi(tables) : "";
      const unlockedHints = problem.hints.slice(0, hintsUsed);
      const result = await requestSql50Coaching({
        problemTitle: problem.title,
        problemDescription: problem.description,
        topics: problem.topics,
        userPrompt: trimmed,
        userError: lastError,
        hintsUsed,
        unlockedHints,
        schema: schema || undefined,
      });
      setGuidance(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to get coaching."
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) {
    return (
      <Button type="button" variant="secondary" size="sm" onClick={onToggle}>
        <MessageCircle className="size-3.5" aria-hidden />
        AI Coach
      </Button>
    );
  }

  return (
    <Panel
      title="AI Coach"
      action={
        <button
          type="button"
          onClick={onToggle}
          className="rounded-sm border border-danger-ink bg-danger-ink p-1 text-white transition-colors hover:border-red-800 hover:bg-red-800"
          aria-label="Close AI coach"
        >
          <X className="size-4" aria-hidden />
        </button>
      }
    >
      <p className="mb-3 text-xs text-ink-muted">
        Tutor mode — concepts and guidance only, never full SQL solutions.
      </p>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="What are you stuck on?"
        rows={3}
        maxLength={MAX_AI_PROMPT_CHARS}
        disabled={isLoading}
        className="mb-3 w-full resize-y rounded-sm border border-line bg-surface-inset px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent"
      />

      <div className="mb-3">
        <AiSchemaToggle
          checked={privacy.includeSchema}
          onChange={privacy.setIncludeSchema}
          disabled={isLoading}
        />
      </div>

      {privacy.isConsentPending ? (
        <AiPrivacyNotice
          onContinue={privacy.continueWithConsent}
          onCancel={privacy.cancelConsent}
        />
      ) : (
        <Button
          type="button"
          variant="primary"
          size="sm"
          className="w-full"
          disabled={isLoading || !prompt.trim()}
          onClick={handleAskCoach}
        >
          <Lightbulb className="size-3.5" aria-hidden />
          {isLoading ? "Thinking…" : "Ask coach"}
        </Button>
      )}

      {error ? (
        <p className="mt-3 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {guidance ? (
        <div className="mt-4 space-y-4 border-t border-line pt-4">
          <p className="text-sm leading-relaxed text-ink-secondary">
            {guidance.summary}
          </p>

          {guidance.problemBreakdown.length > 0 ? (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Break it down
              </h3>
              <ol className="list-decimal space-y-1.5 pl-5 text-sm text-ink-secondary">
                {guidance.problemBreakdown.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>
          ) : null}

          {guidance.techniques.length > 0 ? (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Techniques
              </h3>
              <ul className="space-y-2">
                {guidance.techniques.map((t) => (
                  <li
                    key={`${t.name}-${t.whenToUse}`}
                    className="rounded-sm border border-line bg-surface-muted/50 px-3 py-2 text-sm"
                  >
                    <span className="font-semibold text-accent-ink">{t.name}</span>
                    <p className="mt-0.5 text-ink-secondary">{t.whenToUse}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {guidance.pitfalls.length > 0 ? (
            <section>
              <h3 className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                <AlertTriangle className="size-3.5" aria-hidden />
                Pitfalls
              </h3>
              <ul className="list-disc space-y-1 pl-4 text-sm text-ink-secondary">
                {guidance.pitfalls.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}
    </Panel>
  );
}
