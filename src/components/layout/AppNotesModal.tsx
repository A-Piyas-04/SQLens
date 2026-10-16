import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "../../lib/utils/cn";
import Button from "../common/Button";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

type TabId = "good-to-know" | "simulate" | "coming-next";

const TABS: { id: TabId; label: string }[] = [
  { id: "good-to-know", label: "Good to know" },
  { id: "simulate", label: "What you can simulate" },
  { id: "coming-next", label: "Coming next" },
];

const DATA_PRECAUTIONS = [
  "Clearing this site’s browsing data will remove your work.",
  "Private or incognito sessions usually do not keep your work after you close them.",
  "Opening SQLens on another device or browser will not show work from here.",
  "Using Clear Local Data removes everything on purpose.",
  "Deleting a project removes that project’s drafts, history, and tables.",
  "Reset database clears the tables in the current project. Your saved query text and practice progress stay.",
];

const WHAT_CAN_BE_LOST =
  "What can be lost: projects, saved editor drafts, recent query history, practice progress (solved problems, bookmarks, and scores), and tables or rows you created.";

const SIMULATE_TODAY = [
  { label: "Select rows from a table", sql: "SELECT / FROM" },
  { label: "Filter rows", sql: "WHERE" },
  { label: "Combine tables with matching rows", sql: "JOIN / INNER JOIN" },
  { label: "Keep all rows from the left table when combining", sql: "LEFT JOIN" },
  { label: "Several joins in one query", sql: null },
  { label: "Group and summarize", sql: "GROUP BY" },
  { label: "Filter groups", sql: "HAVING" },
  { label: "Sort results", sql: "ORDER BY" },
  { label: "Cap how many rows you see", sql: "LIMIT" },
];

const COMING_NEXT = [
  { label: "Right, full, and cross joins", sql: null },
  { label: "Combining result sets", sql: "UNION" },
  { label: "Reusable query steps", sql: "WITH" },
  { label: "Subqueries as a data source", sql: null },
  { label: "Window-style analytics (ranking, running totals)", sql: null },
  {
    label: "Simulating changes to data and table setup",
    sql: "INSERT / UPDATE / DELETE",
  },
];

export default function AppNotesModal({ isOpen, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("good-to-know");

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) setActiveTab("good-to-know");
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <button
        type="button"
        className="retro-scrim fixed inset-0 z-50"
        aria-label="Close notes"
        onClick={onClose}
      />
      <div
        className="retro-panel fixed left-1/2 top-1/2 z-50 flex max-h-[min(90vh,42rem)] w-[min(calc(100vw-2rem),36rem)] -translate-x-1/2 -translate-y-1/2 flex-col bg-surface-elevated p-5 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notes-modal-title"
      >
        <div className="mb-4 flex shrink-0 items-center justify-between gap-2">
          <h2
            id="notes-modal-title"
            className="font-display text-lg font-semibold text-ink"
          >
            Notes
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm border border-danger-ink bg-danger-ink p-1 text-white transition-colors hover:border-red-800 hover:bg-red-800"
            aria-label="Close"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div
          className="mb-4 flex shrink-0 gap-1 border-b border-line"
          role="tablist"
          aria-label="Notes sections"
        >
          {TABS.map(({ id, label }) => {
            const selected = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                id={`notes-tab-${id}`}
                aria-selected={selected}
                aria-controls={`notes-panel-${id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "-mb-px border-b-2 px-2.5 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] transition-colors sm:px-3 sm:text-[11px]",
                  selected
                    ? "border-accent text-ink"
                    : "border-transparent text-ink-muted hover:text-ink-secondary"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
          {activeTab === "good-to-know" ? (
            <div
              role="tabpanel"
              id="notes-panel-good-to-know"
              aria-labelledby="notes-tab-good-to-know"
            >
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Keep your work safe
              </h3>
              <p className="mb-3 text-sm leading-relaxed text-ink-secondary">
                Your work stays on this browser on this device. A few habits help
                you keep it:
              </p>
              <ul className="space-y-2 rounded-sm border border-line bg-surface-inset p-3 text-sm leading-relaxed text-ink-secondary">
                {DATA_PRECAUTIONS.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-accent"
                      aria-hidden
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
                {WHAT_CAN_BE_LOST}
              </p>
            </div>
          ) : null}

          {activeTab === "simulate" ? (
            <div
              role="tabpanel"
              id="notes-panel-simulate"
              aria-labelledby="notes-tab-simulate"
            >
              <p className="mb-3 text-sm leading-relaxed text-ink-secondary">
                Step-by-step simulation walks through these query shapes. You
                can still run a wider range of day-to-day SQL in the workspace —
                create tables, change data, and more — while simulation focuses
                on the guided walkthrough below.
              </p>
              <ul className="space-y-2 rounded-sm border border-line bg-surface-inset p-3 text-sm">
                {SIMULATE_TODAY.map(({ label, sql }) => (
                  <li
                    key={label}
                    className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5"
                  >
                    <span className="text-ink-secondary">{label}</span>
                    {sql ? (
                      <span className="shrink-0 font-mono text-[11px] font-medium uppercase tracking-wide text-ink-muted">
                        {sql}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {activeTab === "coming-next" ? (
            <div
              role="tabpanel"
              id="notes-panel-coming-next"
              aria-labelledby="notes-tab-coming-next"
            >
              <p className="mb-3 text-sm leading-relaxed text-ink-secondary">
                These are on the roadmap for simulation:
              </p>
              <ul className="space-y-2 rounded-sm border border-dashed border-line bg-surface p-3 text-sm">
                {COMING_NEXT.map(({ label, sql }) => (
                  <li
                    key={label}
                    className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5"
                  >
                    <span className="text-ink-secondary">{label}</span>
                    {sql ? (
                      <span className="shrink-0 font-mono text-[11px] font-medium uppercase tracking-wide text-ink-muted">
                        {sql}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="mt-5 shrink-0">
          <Button type="button" variant="primary" size="sm" onClick={onClose}>
            Got it
          </Button>
        </div>
      </div>
    </>
  );
}
