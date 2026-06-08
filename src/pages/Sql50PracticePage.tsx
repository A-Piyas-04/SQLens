import {
  ExternalLink,
  GraduationCap,
  RotateCcw,
  Send,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import SqlEditor from "../components/editor/SqlEditor";
import StatusMessage from "../components/common/StatusMessage";
import Button from "../components/common/Button";
import Skeleton from "../components/common/Skeleton";
import QueryToolbar from "../components/features/QueryToolbar";
import AppBootGate from "../components/layout/AppBootGate";
import ResultTable from "../components/results/ResultTable";
import SchemaSidebar from "../components/schema/SchemaSidebar";
import SimulatorPanel from "../components/simulator/SimulatorPanel";
import AiCoachPanel from "../features/sql50/components/AiCoachPanel";
import HintPanel from "../features/sql50/components/HintPanel";
import ProblemHeader from "../features/sql50/components/ProblemHeader";
import ProblemSidebar from "../features/sql50/components/ProblemSidebar";
import ProblemStatement from "../features/sql50/components/ProblemStatement";
import ProgressPanel from "../features/sql50/components/ProgressPanel";
import SolutionModal from "../features/sql50/components/SolutionModal";
import SubmissionResultPanel from "../features/sql50/components/SubmissionResult";
import Sql50PageLayout, {
  Sql50EditorZone,
  Sql50ResultsZone,
} from "../features/sql50/components/Sql50PageLayout";
import Sql50SidebarSection from "../features/sql50/components/Sql50SidebarSection";
import { useProblemProgress } from "../features/sql50/hooks/useProblemProgress";
import { useSql50 } from "../features/sql50/hooks/useSql50";
import { useSubmissionEngine } from "../features/sql50/hooks/useSubmissionEngine";
import { markSolutionViewed } from "../features/sql50/services/progressStore";
import { notifyProgressUpdate } from "../features/sql50/hooks/useProblemProgress";
import { PACK_ID } from "../features/sql50/services/progressStore";
import { cn } from "../lib/utils/cn";

type MobileTab = "problems" | "schema" | "help";

export default function Sql50PracticePage() {
  const workspace = useSql50();
  const { analytics, getProblemProgress, toggleBookmark } = useProblemProgress();
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [acceptedScore, setAcceptedScore] = useState<number | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("problems");
  const simulatorRef = useRef<HTMLDivElement>(null);

  const progress = getProblemProgress(workspace.activeProblem.id);

  const { submit, isSubmitting, lastResult, clearResult } = useSubmissionEngine({
    db: workspace.db,
    onAccepted: (score) => setAcceptedScore(score),
  });

  const problemIndex = useMemo(
    () =>
      workspace.problems.findIndex((p) => p.id === workspace.activeProblem.id),
    [workspace.problems, workspace.activeProblem.id]
  );

  const handleSubmit = useCallback(async () => {
    clearResult();
    setAcceptedScore(null);
    await submit(workspace.activeProblem, workspace.query);
  }, [clearResult, submit, workspace.activeProblem, workspace.query]);

  const handleUnlockHint = useCallback(() => {
    workspace.unlockHint();
    notifyProgressUpdate();
  }, [workspace]);

  const handleRevealSolution = useCallback(() => {
    if (!progress.solved) {
      markSolutionViewed(PACK_ID, workspace.activeProblem.id);
      notifyProgressUpdate();
    }
    setSolutionOpen(true);
  }, [progress.solved, workspace.activeProblem.id]);

  const handleVisualize = useCallback(
    (sql: string) => {
      workspace.setQuery(sql);
      simulatorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [workspace]
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.shiftKey && event.key === "Enter") {
        event.preventDefault();
        void handleSubmit();
        return;
      }
      if (mod && event.key.toLowerCase() === "b") {
        event.preventDefault();
        toggleBookmark(workspace.activeProblem.id);
        return;
      }
      if (event.key === "[" && !mod) {
        event.preventDefault();
        workspace.goToPrevious();
        return;
      }
      if (event.key === "]" && !mod) {
        event.preventDefault();
        workspace.goToNext();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleSubmit, toggleBookmark, workspace]);

  useEffect(() => {
    clearResult();
    setAcceptedScore(null);
  }, [workspace.activeProblem.id, clearResult]);

  const hasSelection = workspace.selectedText.trim().length > 0;

  const problemSidebar = (
    <ProblemSidebar
      embedded
      problems={workspace.problems}
      activeSlug={workspace.activeProblem.slug}
      getProgress={getProblemProgress}
      onSelect={(p) => void workspace.selectProblem(p)}
    />
  );

  const schemaPanel = (
    <SchemaSidebar
      tables={workspace.tables}
      onRefresh={() => void workspace.refreshSchema()}
    />
  );

  const helpPanel = (
    <div className="space-y-5">
      <ProgressPanel analytics={analytics} embedded />
      <Sql50SidebarSection title="Problem">
        <ProblemStatement
          embedded
          description={workspace.activeProblem.description}
        />
      </Sql50SidebarSection>
      <HintPanel
        embedded
        hints={workspace.activeProblem.hints}
        hintsUsed={progress.hintsUsed}
        onUnlockHint={handleUnlockHint}
      />
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={handleRevealSolution}
        >
          Reveal Solution
        </Button>
        <AiCoachPanel
          problem={workspace.activeProblem}
          hintsUsed={progress.hintsUsed}
          tables={workspace.tables}
          lastError={workspace.error || lastResult?.message}
          isOpen={coachOpen}
          onToggle={() => setCoachOpen((v) => !v)}
        />
      </div>
    </div>
  );

  const editorToolbar = (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <QueryToolbar
        variant="header"
        isRunning={workspace.isRunning}
        hasSelection={hasSelection}
        onRun={() => void workspace.handleRunQuery()}
        onReset={() => void workspace.handleResetProblemDb()}
      />
      <Button
        type="button"
        variant="primary"
        size="sm"
        disabled={isSubmitting || workspace.isRunning}
        onClick={() => void handleSubmit()}
      >
        <Send className="size-3.5" aria-hidden />
        {isSubmitting ? "Submitting…" : "Submit"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={workspace.isRunning}
        onClick={() => void workspace.handleResetProblemDb()}
      >
        <RotateCcw className="size-3.5" aria-hidden />
        Reset DB
      </Button>
    </div>
  );

  return (
    <AppBootGate db={workspace.db}>
      <Sql50PageLayout
        header={
          <header className="flex shrink-0 items-center justify-between gap-4 border-b border-line bg-surface-raised px-4 py-2.5 sm:px-5">
            <div className="flex min-w-0 items-center gap-2.5">
              <GraduationCap className="size-5 shrink-0 text-accent" aria-hidden />
              <div className="min-w-0">
                <h1 className="truncate font-display text-lg font-semibold">
                  Practice SQL 50
                </h1>
                <p className="truncate text-xs text-ink-muted">
                  {analytics.solved}/{analytics.total} solved ·{" "}
                  <span className="hidden sm:inline">
                    Mod+Shift+Enter to submit
                  </span>
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                window.location.href = "/";
              }}
            >
              <ExternalLink className="size-3.5" aria-hidden />
              Workspace
            </Button>
          </header>
        }
        left={
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <Sql50SidebarSection title="Problems" className="min-h-0 flex-[3]">
              {problemSidebar}
            </Sql50SidebarSection>
            <Sql50SidebarSection
              title="Schema"
              className="min-h-0 shrink-0 border-t border-line pt-4"
            >
              <div className="max-h-56 overflow-y-auto scrollbar-thin lg:max-h-72">
                {schemaPanel}
              </div>
            </Sql50SidebarSection>
          </div>
        }
        center={
          <>
            <Sql50EditorZone>
              {workspace.isLoadingProblem ? (
                <div className="space-y-3">
                  <Skeleton className="mx-auto h-8 w-2/3" />
                  <Skeleton className="h-40 w-full" />
                </div>
              ) : (
                <>
                  <ProblemHeader
                    problem={workspace.activeProblem}
                    bookmarked={progress.bookmarked}
                    onToggleBookmark={() =>
                      toggleBookmark(workspace.activeProblem.id)
                    }
                    onPrevious={workspace.goToPrevious}
                    onNext={workspace.goToNext}
                    hasPrevious={problemIndex > 0}
                    hasNext={problemIndex < workspace.problems.length - 1}
                  />
                  <SqlEditor
                    value={workspace.query}
                    onChange={workspace.setQuery}
                    onSelectionChange={workspace.setSelectedText}
                    onRun={() => void workspace.handleRunQuery()}
                    hasSelection={hasSelection}
                    toolbar={editorToolbar}
                  />
                </>
              )}
              {workspace.loadError ? (
                <StatusMessage variant="error" message={workspace.loadError} />
              ) : null}
            </Sql50EditorZone>

            <Sql50ResultsZone>
              {workspace.error ? (
                <StatusMessage variant="error" message={workspace.error} />
              ) : null}
              {workspace.message && !lastResult ? (
                <StatusMessage variant="success" message={workspace.message} />
              ) : null}

              <SubmissionResultPanel result={lastResult} />
              {acceptedScore !== null && lastResult?.verdict === "accepted" ? (
                <p className="text-sm text-success-ink">
                  Score: {acceptedScore}/100
                  {progress.bestScore > 0 &&
                  progress.bestScore !== acceptedScore
                    ? ` (best: ${progress.bestScore})`
                    : null}
                </p>
              ) : null}

              <ResultTable rows={workspace.rows} />

              <div ref={simulatorRef}>
                <SimulatorPanel
                  query={workspace.query}
                  selectedText={workspace.selectedText}
                  db={workspace.db}
                />
              </div>
            </Sql50ResultsZone>
          </>
        }
        right={helpPanel}
        mobilePanels={
          <div className="max-h-[40vh] overflow-hidden">
            <div
              className="flex border-b border-line"
              role="tablist"
              aria-label="Practice panels"
            >
              {(
                [
                  ["problems", "Problems"],
                  ["schema", "Schema"],
                  ["help", "Help"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={mobileTab === id}
                  onClick={() => setMobileTab(id)}
                  className={cn(
                    "flex-1 px-3 py-2.5 text-xs font-medium transition-colors",
                    mobileTab === id
                      ? "border-b-2 border-accent text-accent-ink"
                      : "text-ink-muted hover:text-ink"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="overflow-y-auto p-3 scrollbar-thin" role="tabpanel">
              {mobileTab === "problems" ? problemSidebar : null}
              {mobileTab === "schema" ? schemaPanel : null}
              {mobileTab === "help" ? helpPanel : null}
            </div>
          </div>
        }
      />

      <SolutionModal
        problem={workspace.activeProblem}
        isOpen={solutionOpen}
        onClose={() => setSolutionOpen(false)}
        onVisualize={handleVisualize}
      />
    </AppBootGate>
  );
}
