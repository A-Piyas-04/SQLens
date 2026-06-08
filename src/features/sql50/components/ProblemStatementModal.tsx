import { ExternalLink, X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

import Button from "../../../components/common/Button";
import { cn } from "../../../lib/utils/cn";
import type { Sql50Problem } from "../types/sql50";

type Props = {
  problem: Sql50Problem;
  isOpen: boolean;
  onClose: () => void;
};

const difficultyStyles = {
  easy: "bg-success-surface text-success-ink border-success-ink/30",
  medium: "bg-amber-50 text-amber-800 border-amber-200",
  hard: "bg-danger-surface text-danger-ink border-danger-ink/30",
};

export default function ProblemStatementModal({
  problem,
  isOpen,
  onClose,
}: Props) {
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const leetcodeUrl = `https://leetcode.com/problems/${problem.slug}/`;

  return createPortal(
    <>
      <button
        type="button"
        className="fixed inset-0 z-[200] bg-surface-inset/80"
        aria-label="Close problem statement"
        onClick={onClose}
      />
      <div
        className="fixed left-1/2 top-1/2 z-[201] flex max-h-[min(90vh,42rem)] w-[min(calc(100vw-2rem),44rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-sm border border-line bg-surface-elevated shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="problem-statement-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-ink-muted">
                #{problem.leetcodeId}
              </span>
              <span
                className={cn(
                  "rounded-sm border px-2 py-0.5 text-xs font-medium capitalize",
                  difficultyStyles[problem.difficulty]
                )}
              >
                {problem.difficulty}
              </span>
              {problem.topics.slice(0, 2).map((topic) => (
                <span
                  key={topic}
                  className="rounded-sm border border-line bg-surface-muted px-2 py-0.5 text-xs text-ink-secondary"
                >
                  {topic}
                </span>
              ))}
            </div>
            <h2
              id="problem-statement-modal-title"
              className="font-display text-lg font-semibold text-ink"
            >
              {problem.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded p-1 text-ink-muted hover:bg-surface-muted hover:text-ink"
            aria-label="Close"
          >
            <X className="size-4" aria-hidden />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">
          <div className="max-w-none whitespace-pre-wrap text-sm leading-relaxed text-ink-secondary">
            {problem.statement}
          </div>
        </div>

        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3">
          <a
            href={leetcodeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-ink hover:underline"
          >
            <ExternalLink className="size-3.5" aria-hidden />
            Open on LeetCode
          </a>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </footer>
      </div>
    </>,
    document.body
  );
}
