import { lazy, Suspense, useCallback, useState } from "react";
import type { PGlite } from "@electric-sql/pglite";
import { AlertTriangle, Cpu, Info, Loader2, Play } from "lucide-react";

import Panel from "../common/Panel";
import Button from "../common/Button";
import SimulatorSnapshotViewer from "./SimulatorSnapshotViewer";
import SimulatorDebugPanel from "./SimulatorDebugPanel";
import { generateSnapshots } from "../../lib/simulator/snapshot/generateSnapshots";
import type { SimulatorSnapshot, StageDiff } from "../../lib/simulator/types/snapshotTypes";
import { cn } from "../../lib/utils/cn";

const SimulatorPlaybackModal = lazy(
  () => import("./playback/SimulatorPlaybackModal")
);

type Props = {
  query: string;
  selectedText: string;
  db: PGlite;
};

type PanelState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string; sql: string }
  | {
      status: "success";
      snapshots: SimulatorSnapshot[];
      diffs: StageDiff[];
      isSelection: boolean;
    };

export default function SimulatorPanel({
  query,
  selectedText,
  db,
}: Props) {
  const [state, setState] = useState<PanelState>({ status: "idle" });

  const isSelection = !!selectedText.trim();
  const isEmpty = !query.trim() && !selectedText.trim();

  const handleSimulate = useCallback(async () => {
    const sqlToSimulate = selectedText.trim() || query;

    setState({ status: "loading" });

    const result = await generateSnapshots({ sql: sqlToSimulate, db });

    if (!result.success) {
      setState({ status: "error", message: result.error, sql: sqlToSimulate });
      return;
    }

    setState({
      status: "success",
      snapshots: result.snapshots,
      diffs: result.diffs,
      isSelection,
    });
  }, [db, isSelection, query, selectedText]);

  return (
    <Panel
      title="SQL Execution Simulator"
      dataTour="simulator-panel"
      action={
        <Button
          variant="secondary"
          size="sm"
          onClick={handleSimulate}
          disabled={isEmpty || state.status === "loading"}
          title={
            isSelection ? "Simulate selected SQL" : "Simulate query structure"
          }
        >
          {state.status === "loading" ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <Cpu className="size-3.5" aria-hidden />
          )}
          {state.status === "loading"
            ? "Simulating…"
            : isSelection
              ? "Simulate Selection"
              : "Simulate Query"}
        </Button>
      }
    >
      <div className="space-y-4">
        {state.status === "idle" && <IdleState />}
        {state.status === "loading" && <LoadingState />}
        {state.status === "error" && (
          <ErrorState message={state.message} sql={state.sql} />
        )}
        {state.status === "success" && (
          <SuccessState
            snapshots={state.snapshots}
            diffs={state.diffs}
            isSelection={state.isSelection}
            originalSql={selectedText.trim() || query}
          />
        )}
      </div>
    </Panel>
  );
}

function IdleState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
      <div className="retro-inset p-3">
        <Cpu className="size-5 text-ink-muted" aria-hidden />
      </div>
      <p className="text-sm text-ink-muted">
        Click{" "}
        <strong className="text-ink-secondary">Simulate Query</strong> to step
        through each logical execution stage.
      </p>
      <p className="text-xs text-ink-muted">
        Supports SELECT · FROM · JOIN · WHERE · GROUP BY · HAVING · ORDER BY · LIMIT
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
      <Loader2 className="size-6 animate-spin text-ink-muted" aria-hidden />
      <p className="text-sm text-ink-muted">Running stage snapshots…</p>
    </div>
  );
}

type ErrorStateProps = { message: string; sql: string };

function ErrorState({ message, sql }: ErrorStateProps) {
  return (
    <div className="space-y-3">
      <div className="inline-flex w-fit max-w-full items-start gap-2 rounded-sm border border-amber-700/50 bg-surface-elevated px-3 py-2">
        <AlertTriangle
          className="mt-0.5 size-4 shrink-0 text-amber-700"
          aria-hidden
        />
        <p className="text-sm text-ink-secondary">{message}</p>
      </div>
      {sql && <SqlPreview sql={sql} />}
    </div>
  );
}

type SuccessStateProps = {
  snapshots: SimulatorSnapshot[];
  diffs: StageDiff[];
  isSelection: boolean;
  originalSql: string;
};

function SuccessState({ snapshots, diffs, isSelection, originalSql }: SuccessStateProps) {
  const [showPlayback, setShowPlayback] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-ink-muted">
            {snapshots.length} execution{" "}
            {snapshots.length === 1 ? "stage" : "stages"}
          </span>
          {isSelection && (
            <span className="rounded-sm border border-amber-700/50 px-2 py-0.5 font-mono text-[10px] font-medium text-amber-800">
              selection
            </span>
          )}
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowPlayback(true)}
        >
          <Play className="size-3.5" aria-hidden />
          Play Simulation
        </Button>
      </div>

      {/* Existing snapshot viewer — untouched */}
      <SimulatorSnapshotViewer snapshots={snapshots} diffs={diffs} />
      <SimulatorDebugPanel snapshots={snapshots} diffs={diffs} />

      {/* Immersive playback modal — lazy loaded, zero cost until opened */}
      {showPlayback && (
        <Suspense fallback={null}>
          <SimulatorPlaybackModal
            snapshots={snapshots}
            diffs={diffs}
            originalSql={originalSql}
            onClose={() => setShowPlayback(false)}
          />
        </Suspense>
      )}
    </div>
  );
}

type SqlPreviewProps = { sql: string };

function SqlPreview({ sql }: SqlPreviewProps) {
  const preview = sql.length > 160 ? `${sql.slice(0, 157)}…` : sql;
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-sm border border-line bg-surface-inset px-3 py-2"
      )}
    >
      <Info
        className="mt-0.5 size-3.5 shrink-0 text-ink-muted"
        aria-hidden
      />
      <p className="break-all font-mono text-[11px] leading-relaxed text-ink-muted">
        {preview}
      </p>
    </div>
  );
}
