import { Bookmark, Check, Circle, Clock, Search, Star } from "lucide-react";
import { useMemo, useState } from "react";

import Button from "../../../components/common/Button";
import Panel from "../../../components/common/Panel";
import type { PracticeDifficulty } from "../../../lib/practice/types";
import { cn } from "../../../lib/utils/cn";
import { SQL50_TOPICS } from "../data/sql50/topics";
import type { Sql50Problem } from "../types/sql50";
import type { UserProblemProgress } from "../../../lib/practice/types";

type FilterDifficulty = PracticeDifficulty | "all";

type Props = {
  problems: Sql50Problem[];
  activeSlug: string;
  getProgress: (problemId: number) => UserProblemProgress;
  onSelect: (problem: Sql50Problem) => void;
};

export default function ProblemSidebar({
  problems,
  activeSlug,
  getProgress,
  onSelect,
}: Props) {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<FilterDifficulty>("all");
  const [topic, setTopic] = useState<string>("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return problems.filter((p) => {
      if (difficulty !== "all" && p.difficulty !== difficulty) return false;
      if (topic !== "all" && !p.topics.includes(topic)) return false;
      const progress = getProgress(p.id);
      if (favoritesOnly && !progress.bookmarked) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.slug.includes(q) ||
        p.topics.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [problems, search, difficulty, topic, favoritesOnly, getProgress]);

  return (
    <Panel title="Problems" className="flex h-full min-h-0 flex-col">
      <div className="space-y-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-muted"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search problems…"
            className="w-full rounded-sm border border-line bg-surface-inset py-2 pl-8 pr-3 text-sm text-ink placeholder:text-ink-muted focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label="Search problems"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(["all", "easy", "medium", "hard"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDifficulty(d)}
              className={cn(
                "rounded-sm border px-2 py-0.5 text-xs capitalize transition-colors",
                difficulty === d
                  ? "border-accent bg-accent/10 text-accent-ink"
                  : "border-line text-ink-muted hover:border-line-strong"
              )}
            >
              {d}
            </button>
          ))}
        </div>

        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full rounded-sm border border-line bg-surface-inset px-2 py-1.5 text-xs text-ink focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent"
          aria-label="Filter by topic"
        >
          <option value="all">All topics</option>
          {SQL50_TOPICS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <Button
          type="button"
          variant={favoritesOnly ? "primary" : "ghost"}
          size="sm"
          className="w-full"
          onClick={() => setFavoritesOnly((v) => !v)}
        >
          <Star className="size-3.5" aria-hidden />
          Favorites
        </Button>
      </div>

      <ul className="mt-4 max-h-[min(50vh,28rem)] flex-1 space-y-1 overflow-y-auto scrollbar-thin">
        {filtered.map((problem) => {
          const progress = getProgress(problem.id);
          const isActive = problem.slug === activeSlug;
          return (
            <li key={problem.id}>
              <button
                type="button"
                onClick={() => onSelect(problem)}
                className={cn(
                  "flex w-full items-start gap-2 rounded-sm border px-2.5 py-2 text-left text-sm transition-colors",
                  isActive
                    ? "border-accent bg-accent/10 text-ink"
                    : "border-transparent hover:border-line hover:bg-surface-muted"
                )}
              >
                <span className="mt-0.5 shrink-0" aria-hidden>
                  {progress.solved ? (
                    <Check className="size-3.5 text-success-ink" />
                  ) : progress.attempts > 0 ? (
                    <Clock className="size-3.5 text-amber-600" />
                  ) : (
                    <Circle className="size-3.5 text-ink-muted" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 font-medium">{problem.title}</span>
                  <span className="mt-0.5 block text-xs capitalize text-ink-muted">
                    {problem.difficulty}
                  </span>
                </span>
                {progress.bookmarked ? (
                  <Bookmark
                    className="size-3.5 shrink-0 fill-accent text-accent"
                    aria-label="Bookmarked"
                  />
                ) : null}
              </button>
            </li>
          );
        })}
        {filtered.length === 0 ? (
          <li className="px-2 py-4 text-center text-xs text-ink-muted">
            No problems match your filters.
          </li>
        ) : null}
      </ul>
    </Panel>
  );
}
