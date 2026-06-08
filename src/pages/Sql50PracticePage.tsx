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
import { useProblemProgress } from "../features/sql50/hooks/useProblemProgress";
import { useSql50 } from "../features/sql50/hooks/useSql50";
import { useSubmissionEngine } from "../features/sql50/hooks/useSubmissionEngine";
import { markSolutionViewed } from "../features/sql50/services/progressStore";
import { notifyProgressUpdate } from "../features/sql50/hooks/useProblemProgress";
import { PACK_ID } from "../features/sql50/services/progressStore";

export default function Sql50PracticePage() {
  const workspace = useSql50();
  const { analytics, getProblemProgress, toggleBookmark } = useProblemProgress();
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [acceptedScore, setAcceptedScore] = useState<number | null>(null);
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

  return (
    <AppBootGate db={workspace.db}>
      <div className="flex h-dvh min-h-0 flex-col bg-surface text-ink">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-line bg-surface-raised px-4 py-2.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <GraduationCap className="size-5 shrink-0 text-accent" aria-hidden />
            <div className="min-w-0">
              <h1 className="truncate font-display text-lg font-semibold">
                Practice SQL 50
              </h1>
              <p className="truncate text-xs text-ink-muted">
                {analytics.solved}/{analytics.total} solved
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

        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5">
          <div className="mx-auto max-w-[90rem] space-y-5">
            {/* Top 3-column section */}
            <div className="grid gap-4 lg:grid-cols-12">
              <div className="lg:col-span-3">
                <ProblemSidebar
                  problems={workspace.problems}
                  activeSlug={workspace.activeProblem.slug}
                  getProgress={getProblemProgress}
                  onSelect={(p) => void workspace.selectProblem(p)}
                />
              </div>

              <div className="space-y-4 lg:col-span-6">
                {workspace.isLoadingProblem ? (
                  <div className="space-y-3 rounded-sm border border-line bg-surface-inset p-4">
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                ) : (
                  <>
                    <div className="rounded-sm border border-line bg-surface-inset p-4">
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
                    </div>
                    <ProblemStatement
                      description={workspace.activeProblem.description}
                    />
                    <HintPanel
                      hints={workspace.activeProblem.hints}
                      hintsUsed={progress.hintsUsed}
                      onUnlockHint={handleUnlockHint}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
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
                  </>
                )}
                {workspace.loadError ? (
                  <StatusMessage variant="error" message={workspace.loadError} />
                ) : null}
              </div>

              <div className="lg:col-span-3">
                <ProgressPanel analytics={analytics} />
                <div className="mt-4 lg:hidden">
                  <SchemaSidebar
                    tables={workspace.tables}
                    onRefresh={() => void workspace.refreshSchema()}
                  />
                </div>
              </div>
            </div>

            {/* Schema sidebar desktop - shown in left area on large screens via sidebar column */}
            <div className="hidden lg:block">
              <SchemaSidebar
                tables={workspace.tables}
                onRefresh={() => void workspace.refreshSchema()}
              />
            </div>

            {/* Editor */}
            <SqlEditor
              value={workspace.query}
              onChange={workspace.setQuery}
              onSelectionChange={workspace.setSelectedText}
              onRun={() => void workspace.handleRunQuery()}
              hasSelection={hasSelection}
              toolbar={
                <div className="flex flex-wrap items-center gap-2">
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
              }
            />

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
                {progress.bestScore > 0 && progress.bestScore !== acceptedScore
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
          </div>
        </div>

        <SolutionModal
          problem={workspace.activeProblem}
          isOpen={solutionOpen}
          onClose={() => setSolutionOpen(false)}
          onVisualize={handleVisualize}
        />
      </div>
    </AppBootGate>
  );
}
