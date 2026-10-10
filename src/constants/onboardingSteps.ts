export type OnboardingPlacement = "top" | "bottom" | "left" | "right" | "center";

export type OnboardingAccent = "blue" | "purple";

export type OnboardingStep = {
  id: string;
  title: string;
  body: string;
  /** Matches `data-tour` on a DOM element; omit for centered modal steps */
  target?: string;
  placement?: OnboardingPlacement;
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
    id: "sql50",
    title: "Practice SQL 50",
    body: "Open the LeetCode SQL 50 study plan in a dedicated workspace — 50 problems, auto-grading, hints, and bookmarks.",
    target: "sql50-promo",
    highlights: [
      "Separate practice page at /practice/sql50",
      "Progress saved in your browser",
    ],
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
    body: "Write SQL here. Press Ctrl+Enter to run the full query, or select part of a query to run only that selection.",
    target: "sql-editor",
  },
  {
    id: "import-sql",
    title: "Import SQL",
    body: "Load a local .sql or .txt file into the editor. Replaces the buffer after confirm; does not auto-run.",
    target: "import-sql",
    highlights: ["Max 1 MB per file", "Draft auto-saves per project"],
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
    highlights: [
      "Recent queries appear in Query History below after you run",
    ],
  },
  {
    id: "simulator",
    accent: "purple",
    title: "SQL Execution Simulator",
    body: "SQLens's core experience — visualize exactly how PostgreSQL runs your query, one stage at a time.",
    target: "simulator-panel",
    highlights: [
      "Stage-by-stage playback (FROM → JOIN → WHERE → …)",
      "Rows animate as they're filtered, joined, or aggregated",
      "Press Simulate to open fullscreen playback, then scrub at your pace",
    ],
  },
  {
    id: "erd",
    title: "Entity Relationship Diagram",
    body: "Visualize tables and foreign keys. Use View ERD in the editor toolbar to jump here, or maximize on the canvas for fullscreen.",
    target: "erd-section",
  },
  {
    id: "finish",
    title: "You're all set",
    body: "Try Practice SQL 50 or import a .sql file. Start with a sample database from the Practice menu, or write your own SQL. Open Help anytime to replay this tour.",
    placement: "center",
  },
];

export function getOnboardingTargetSelector(target: string): string {
  return `[data-tour="${target}"]`;
}

/** Padding from viewport edges when deciding if a tour target is "on screen". */
export const TOUR_VIEWPORT_MARGIN = 48;

const TOUR_MIN_VISIBLE_PX = 72;
const TOUR_MIN_VISIBLE_FLOOR_PX = 20;

/** How much of an axis must be visible (adapts to small header controls). */
function requiredVisiblePx(visible: number, total: number): boolean {
  const required = Math.min(TOUR_MIN_VISIBLE_PX, Math.max(TOUR_MIN_VISIBLE_FLOOR_PX, total * 0.5));
  return visible >= required;
}

export function isTourTargetInViewport(
  el: Element,
  margin: number = TOUR_VIEWPORT_MARGIN
): boolean {
  const rect = el.getBoundingClientRect();
  if (rect.width <= 4 || rect.height <= 4) return false;

  const viewTop = margin;
  const viewLeft = margin;
  const viewBottom = window.innerHeight - margin;
  const viewRight = window.innerWidth - margin;

  const visibleTop = Math.max(rect.top, viewTop);
  const visibleLeft = Math.max(rect.left, viewLeft);
  const visibleBottom = Math.min(rect.bottom, viewBottom);
  const visibleRight = Math.min(rect.right, viewRight);

  const visibleWidth = visibleRight - visibleLeft;
  const visibleHeight = visibleBottom - visibleTop;

  return requiredVisiblePx(visibleWidth, rect.width) && requiredVisiblePx(visibleHeight, rect.height);
}

function tourScrollBehavior(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
}

/** Prefer an on-screen match when desktop/mobile duplicate the same tour id. */
export function findVisibleTourTarget(target: string): Element | null {
  const nodes = document.querySelectorAll(getOnboardingTargetSelector(target));
  let fallback: Element | null = null;

  for (const node of nodes) {
    const box = node.getBoundingClientRect();
    if (box.width <= 4 || box.height <= 4) continue;
    if (!fallback) fallback = node;
    if (isTourTargetInViewport(node)) return node;
  }

  return fallback;
}

/** Scroll nested containers / page until the tour target is visible. No-op if already on screen. */
export function ensureTourTargetVisible(target: string): Promise<void> {
  const el = findVisibleTourTarget(target);
  if (!el || isTourTargetInViewport(el)) {
    return Promise.resolve();
  }

  const targetEl = el;
  const behavior = tourScrollBehavior();

  targetEl.scrollIntoView({
    behavior,
    block: "nearest",
    inline: "nearest",
  });

  if (behavior === "auto") {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      window.removeEventListener("scrollend", done);
      clearTimeout(timer);
      resolve();
    };

    let frame = 0;
    const maxFrames = 45;

    function tick() {
      frame += 1;
      if (isTourTargetInViewport(targetEl) || frame >= maxFrames) {
        done();
        return;
      }
      requestAnimationFrame(tick);
    }

    window.addEventListener("scrollend", done, { once: true });
    requestAnimationFrame(tick);
    const timer = window.setTimeout(done, 450);
  });
}
