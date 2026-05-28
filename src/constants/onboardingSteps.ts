export type OnboardingPlacement = "top" | "bottom" | "left" | "right" | "center";

export type OnboardingAccent = "blue" | "purple";

export type OnboardingStep = {
  id: string;
  title: string;
  body: string;
  /** Matches `data-tour` on a DOM element; omit for centered modal steps */
  target?: string;
  placement?: OnboardingPlacement;
  /** Scroll target into view before showing (e.g. ERD below the fold) */
  scrollIntoView?: boolean;
  /** Card + spotlight accent — purple for signature MVP step only */
  accent?: OnboardingAccent;
  /** Short bullets (optional) */
  highlights?: string[];
};

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to SQLens",
    body: "Learn the workspace in a quick tour. You can skip anytime or replay later from Help.",
    placement: "center",
  },
  {
    id: "projects",
    title: "Projects",
    body: "Each project is an isolated workspace with its own database, drafts, and query history. Create or switch projects here.",
    target: "project-switcher",
  },
  {
    id: "practice",
    title: "Practice menu",
    body: "Open sample databases, query templates, SQL snippets, and visualization presets to get started quickly.",
    target: "practice-menu",
  },
  {
    id: "schema",
    title: "Schema explorer",
    body: "Browse tables and columns for the active project. Refresh after loading data or changing the schema.",
    target: "workspace-sidebar",
  },
  {
    id: "editor",
    title: "SQL editor",
    body: "Write SQL here. Press Ctrl+Enter to run. Select part of a query to run only the selection.",
    target: "sql-editor",
  },
  {
    id: "run",
    title: "Run query",
    body: "Execute the full query or only your selection. Reset DB restores the project database to a clean state.",
    target: "run-query",
  },
  {
    id: "results",
    title: "Results",
    body: "Query output appears here. Copy or export results as JSON when rows are returned.",
    target: "results-panel",
  },
  {
    id: "simulator",
    accent: "purple",
    title: "SQL Execution Simulator",
    body: "SQLens’s core experience — visualize exactly how PostgreSQL runs your query, one stage at a time.",
    target: "simulator-panel",
    scrollIntoView: true,
    highlights: [
      "Stage-by-stage playback (FROM → JOIN → WHERE → …)",
      "Rows animate as they’re filtered, joined, or aggregated",
      "Run Simulate Query, then scrub the timeline at your pace",
    ],
  },
  {
    id: "erd",
    title: "Entity Relationship Diagram",
    body: "Visualize tables and foreign keys. Use View ERD in the editor toolbar to jump here anytime.",
    target: "erd-section",
    scrollIntoView: true,
  },
  {
    id: "finish",
    title: "You're all set",
    body: "Start with a sample database from the Practice menu, or write your own SQL. Open Help anytime to take this tour again.",
    placement: "center",
  },
];

export function getOnboardingTargetSelector(target: string): string {
  return `[data-tour="${target}"]`;
}

/** Prefer the visible match when desktop/mobile duplicate the same tour id. */
export function findVisibleTourTarget(target: string): Element | null {
  const nodes = document.querySelectorAll(getOnboardingTargetSelector(target));
  for (const node of nodes) {
    const box = node.getBoundingClientRect();
    if (box.width > 4 && box.height > 4) return node;
  }
  return null;
}
