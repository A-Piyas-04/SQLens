import { cn } from "../../../lib/utils/cn";
import type { PracticeAnalytics } from "../../../lib/practice/types";

type Props = {
  analytics: PracticeAnalytics;
  embedded?: boolean;
};

export default function ProgressPanel({ analytics, embedded = false }: Props) {
  const content = (
    <div className="space-y-4">
      <div>
        <p className="text-2xl font-semibold text-ink">
          {analytics.solved}
          <span className="text-lg font-normal text-ink-muted">
            /{analytics.total}
          </span>
        </p>
        <p className="text-xs text-ink-muted">Problems solved</p>
      </div>

      <div className="space-y-2 text-sm">
        {(["easy", "medium", "hard"] as const).map((d) => (
          <div key={d} className="flex items-center justify-between gap-2">
            <span className="capitalize text-ink-secondary">{d}</span>
            <span className="font-medium text-ink">
              {analytics.byDifficulty[d].solved}/
              {analytics.byDifficulty[d].total}
            </span>
          </div>
        ))}
      </div>

      {analytics.averageBestScore > 0 ? (
        <p className="text-sm text-ink-secondary">
          Avg score:{" "}
          <span className="font-medium text-ink">{analytics.averageBestScore}</span>
        </p>
      ) : null}

      {analytics.topicsMastered.length > 0 ? (
        <section>
          <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Mastered
          </h3>
          <div className="flex flex-wrap gap-1">
            {analytics.topicsMastered.map((t) => (
              <span
                key={t}
                className="rounded-sm border border-success-ink/30 bg-success-surface px-1.5 py-0.5 text-xs text-success-ink"
              >
                {t}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {analytics.topicsNeedingPractice.length > 0 ? (
        <section>
          <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Needs practice
          </h3>
          <div className="flex flex-wrap gap-1">
            {analytics.topicsNeedingPractice.map((t) => (
              <span
                key={t}
                className="rounded-sm border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-xs text-amber-800"
              >
                {t}
              </span>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className={cn("rounded-sm border border-line bg-surface-inset p-4")}>
      <h2 className="mb-3 font-display text-sm font-semibold text-ink">Progress</h2>
      {content}
    </div>
  );
}
