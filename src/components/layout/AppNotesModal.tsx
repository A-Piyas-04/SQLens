import { Check, Copy, X } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "../../lib/utils/cn";
import Button from "../common/Button";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

type TabId = "good-to-know" | "simulate" | "feedback";

const FEEDBACK_EMAIL = "ahnafpias@iut-dhaka.edu";

const TABS: { id: TabId; label: string }[] = [
  { id: "good-to-know", label: "Good to know" },
  { id: "simulate", label: "What you can simulate" },
  { id: "feedback", label: "Feedback" },
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

export default function AppNotesModal({ isOpen, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("good-to-know");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab("good-to-know");
      setCopied(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function handleCopyEmail() {
    try {
      await navigator.clipboard.writeText(FEEDBACK_EMAIL);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

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

          {activeTab === "feedback" ? (
            <div
              role="tabpanel"
              id="notes-panel-feedback"
              aria-labelledby="notes-tab-feedback"
            >
              <p className="mb-4 text-sm leading-relaxed text-ink-secondary">
                Have ideas to improve SQLens?? new features, upgrades, or
                something you wish worked better? I would love to hear from
                you. Share your suggestions and I will take them into account
                as I keep building.
              </p>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Send feedback by email
              </p>
              <div className="flex flex-wrap items-center gap-2 rounded-sm border border-line bg-surface-inset p-3">
                <span className="min-w-0 flex-1 break-all font-mono text-sm text-ink">
                  {FEEDBACK_EMAIL}
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => void handleCopyEmail()}
                  aria-label={copied ? "Email copied" : "Copy email address"}
                >
                  {copied ? (
                    <Check className="size-3.5" aria-hidden />
                  ) : (
                    <Copy className="size-3.5" aria-hidden />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
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
