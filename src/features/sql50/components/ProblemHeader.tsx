import { Bookmark, ChevronLeft, ChevronRight, FileText } from "lucide-react";

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
  compact?: boolean;
  onViewStatement?: () => void;
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
  compact = false,
  onViewStatement,
}: Props) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="shrink-0 text-xs font-medium text-ink-muted">
          {problem.leetcodeId}
        </span>
        <span
          className={cn(
            "shrink-0 rounded-sm border px-2 py-0.5 text-xs font-medium capitalize",
            difficultyStyles[problem.difficulty]
          )}
        >
          {problem.difficulty}
        </span>
        <h2
          className={cn(
            "min-w-0 truncate font-display font-semibold text-ink",
            compact ? "text-sm sm:text-base" : "text-lg sm:text-xl"
          )}
        >
          {problem.title}
        </h2>
        {!compact
          ? problem.topics.map((topic) => (
              <span
                key={topic}
                className="hidden rounded-sm border border-line bg-surface-muted px-2 py-0.5 text-xs text-ink-secondary sm:inline"
              >
                {topic}
              </span>
            ))
          : null}
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        {onViewStatement ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onViewStatement}
            title="Open full problem statement"
          >
            <FileText className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">Problem</span>
          </Button>
        ) : null}
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
