import { Bookmark, ChevronLeft, ChevronRight } from "lucide-react";

import Button from "../../../components/common/Button";
import { cn } from "../../../lib/utils/cn";
import type { Sql50Problem } from "../types/sql50";

type Props = {
  problem: Sql50Problem;
  bookmarked: boolean;
  onToggleBookmark: () => void;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
};

const difficultyStyles = {
  easy: "bg-success-surface text-success-ink border-success-ink/30",
  medium: "bg-amber-50 text-amber-800 border-amber-200",
  hard: "bg-danger-surface text-danger-ink border-danger-ink/30",
};

export default function ProblemHeader({
  problem,
  bookmarked,
  onToggleBookmark,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: Props) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-ink-muted">
            #{problem.id}
          </span>
          <span
            className={cn(
              "rounded-sm border px-2 py-0.5 text-xs font-medium capitalize",
              difficultyStyles[problem.difficulty]
            )}
          >
            {problem.difficulty}
          </span>
          {problem.topics.map((topic) => (
            <span
              key={topic}
              className="rounded-sm border border-line bg-surface-muted px-2 py-0.5 text-xs text-ink-secondary"
            >
              {topic}
            </span>
          ))}
        </div>
        <h2 className="mt-2 font-display text-lg font-semibold text-ink sm:text-xl">
          {problem.title}
        </h2>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onToggleBookmark}
          aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
          aria-pressed={bookmarked}
        >
          <Bookmark
            className={cn("size-4", bookmarked && "fill-accent text-accent")}
            aria-hidden
          />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onPrevious}
          disabled={!hasPrevious}
          aria-label="Previous problem"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onNext}
          disabled={!hasNext}
          aria-label="Next problem"
        >
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
