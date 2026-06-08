import { Bookmark, Check, Circle, Clock, ChevronDown, Search, Star } from "lucide-react";
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
  embedded?: boolean;
};

function ProblemFilters({
  search,
  onSearchChange,
  difficulty,
  onDifficultyChange,
  topic,
  onTopicChange,
  favoritesOnly,
  onFavoritesToggle,
  showAdvanced,
  onToggleAdvanced,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  difficulty: FilterDifficulty;
  onDifficultyChange: (value: FilterDifficulty) => void;
  topic: string;
  onTopicChange: (value: string) => void;
  favoritesOnly: boolean;
  onFavoritesToggle: () => void;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
}) {
  return (
    <div className="shrink-0 space-y-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-muted"
          aria-hidden
        />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
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
            onClick={() => onDifficultyChange(d)}
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

      <Button
        type="button"
        variant={favoritesOnly ? "primary" : "ghost"}
        size="sm"
        className="w-full"
        onClick={onFavoritesToggle}
      >
        <Star className="size-3.5" aria-hidden />
        Favorites
      </Button>

      <button
        type="button"
        onClick={onToggleAdvanced}
        className="flex w-full items-center justify-between rounded-sm border border-line px-2.5 py-1.5 text-xs font-medium text-ink-secondary hover:bg-surface-muted"
        aria-expanded={showAdvanced}
      >
        Filters
        <ChevronDown
          className={cn(
            "size-3.5 transition-transform",
            showAdvanced && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {showAdvanced ? (
        <select
          value={topic}
          onChange={(e) => onTopicChange(e.target.value)}
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
      ) : null}
    </div>
  );
}

function ProblemList({
  filtered,
  activeSlug,
  getProgress,
  onSelect,
  className,
}: {
  filtered: Sql50Problem[];
  activeSlug: string;
  getProgress: (problemId: number) => UserProblemProgress;
  onSelect: (problem: Sql50Problem) => void;
  className?: string;
}) {
  return (
    <ul className={cn("space-y-1 overflow-y-auto scrollbar-thin", className)}>
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
                <span className="line-clamp-2 font-medium">
                  <span className="text-ink-muted">{problem.leetcodeId}. </span>
                  {problem.title}
                </span>
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
  );
}

export default function ProblemSidebar({
  problems,
  activeSlug,
  getProgress,
  onSelect,
  embedded = false,
}: Props) {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<FilterDifficulty>("all");
  const [topic, setTopic] = useState<string>("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

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

  const filters = (
    <ProblemFilters
      search={search}
      onSearchChange={setSearch}
      difficulty={difficulty}
      onDifficultyChange={setDifficulty}
      topic={topic}
      onTopicChange={setTopic}
      favoritesOnly={favoritesOnly}
      onFavoritesToggle={() => setFavoritesOnly((v) => !v)}
      showAdvanced={showAdvanced}
      onToggleAdvanced={() => setShowAdvanced((v) => !v)}
    />
  );

  const list = (
    <ProblemList
      filtered={filtered}
      activeSlug={activeSlug}
      getProgress={getProgress}
      onSelect={onSelect}
      className={embedded ? "min-h-0 flex-1 overflow-y-auto" : "mt-4 max-h-[min(50vh,28rem)]"}
    />
  );

  if (embedded) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
        <div className="shrink-0">{filters}</div>
        {list}
      </div>
    );
  }

  return (
    <Panel title="Problems" className="flex h-full min-h-0 flex-col">
      {filters}
      {list}
    </Panel>
  );
}
