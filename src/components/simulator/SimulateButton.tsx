import { lazy, Suspense, useCallback, useState } from "react";
import type { PGlite } from "@electric-sql/pglite";
import { Cpu, Loader2 } from "lucide-react";

import { generateSnapshots } from "../../lib/simulator/snapshot/generateSnapshots";
import type { SimulatorSnapshot, StageDiff } from "../../lib/simulator/types/snapshotTypes";

const SimulatorPlaybackModal = lazy(
  () => import("./playback/SimulatorPlaybackModal")
);

type Props = {
  query: string;
  selectedText: string;
  db: PGlite;
};

type SimulateState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "open";
      snapshots: SimulatorSnapshot[];
      diffs: StageDiff[];
      sql: string;
    };

export default function SimulateButton({ query, selectedText, db }: Props) {
  const [state, setState] = useState<SimulateState>({ status: "idle" });

  const isSelection = !!selectedText.trim();
  const isEmpty = !query.trim() && !isSelection;
  const isLoading = state.status === "loading";

  const handleSimulate = useCallback(async () => {
    const sql = selectedText.trim() || query;
    setState({ status: "loading" });

    const result = await generateSnapshots({ sql, db });
    if (!result.success) {
      setState({ status: "error", message: result.error });
      return;
    }

    setState({
      status: "open",
      snapshots: result.snapshots,
      diffs: result.diffs,
      sql,
    });
  }, [db, query, selectedText]);

  const ledState =
    state.status === "loading"
      ? "busy"
      : state.status === "error"
        ? "error"
        : isEmpty
          ? "off"
          : "ready";

  const statusText =
    state.status === "error"
      ? state.message
      : isLoading
        ? "Building stage snapshots…"
        : isEmpty
          ? "Write a query to enable."
          : isSelection
            ? "Ready · selection only"
            : "Ready · full query";

  return (
    <div className="retro-console" data-tour="simulator-panel">
      <div className="retro-console__label">
        <span>Exec · Sim</span>
        <span className="retro-led" data-state={ledState} aria-hidden />
      </div>

      <div className="retro-well">
        <button
          type="button"
          className="retro-key"
          onClick={handleSimulate}
          disabled={isEmpty || isLoading}
          data-pressed={isLoading}
          aria-busy={isLoading}
          title={isSelection ? "Simulate selected SQL" : "Simulate query execution"}
        >
          <span className="retro-key__cap">
            {isLoading ? (
              <Loader2 className="size-6 animate-spin" aria-hidden />
            ) : (
              <Cpu className="size-6" aria-hidden />
            )}
            <span className="retro-key__text">Simulate</span>
            <span className="retro-key__hint">
              {isSelection ? "Selection" : "Step by step"}
            </span>
          </span>
        </button>
      </div>

      <p
        className="retro-console__status line-clamp-3"
        data-state={state.status === "error" ? "error" : undefined}
        title={state.status === "error" ? state.message : undefined}
        role="status"
      >
        {statusText}
      </p>

      {state.status === "open" && (
        <Suspense fallback={null}>
          <SimulatorPlaybackModal
            snapshots={state.snapshots}
            diffs={state.diffs}
            originalSql={state.sql}
            onClose={() => setState({ status: "idle" })}
          />
        </Suspense>
      )}
    </div>
  );
}
