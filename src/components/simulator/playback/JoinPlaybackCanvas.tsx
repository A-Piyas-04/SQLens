/**
 * Join playback — one bridge flow per match (multi-join aware).
 */

import {
  type CSSProperties,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "../../../lib/utils/cn";
import type { TrackedRow } from "../../../lib/simulator";
import type { PlaybackSpeed } from "../../../hooks/useSimulatorPlayback";
import { getIntermediateResultColumns } from "../stageConstants";
import JoinArrowOverlay, { type PersistentArrow } from "./join/JoinArrowOverlay";
import JoinMatchBridge from "./join/JoinMatchBridge";
import {
  buildJoinMatchSteps,
  countJoinLayers,
  resolvePlaybackJoinKeys,
  type ActiveBridgeLink,
  type JoinMatchStep,
  type MatchPair,
} from "./join/joinPlaybackModel";

const MAX_ANIMATED_STEPS = 6;

type JoinPhase = "idle" | "tables" | "keys" | "matching" | "result" | "done";

const MAX_ROWS = 14;

type RowAnchor = { x: number; y: number };

type KeyTableProps = {
  side: "left" | "right";
  title: string;
  subtitle: string;
  rows: TrackedRow[];
  joinKey: string | null;
  rowRefs: React.MutableRefObject<Map<string, HTMLTableCellElement>>;
  visible: boolean;
  activeRowId: string | null;
  matchedRowIds: Set<string>;
  pendingRowIds: Set<string>;
  pulseHeader: boolean;
  matchCountByRowId: Map<string, number>;
};

function KeyTable({
  side,
  title,
  subtitle,
  rows,
  joinKey,
  rowRefs,
  visible,
  activeRowId,
  matchedRowIds,
  pendingRowIds,
  pulseHeader,
  matchCountByRowId,
}: KeyTableProps) {
  const display = rows.slice(0, MAX_ROWS);
  const overflow = rows.length - display.length;

  return (
    <div
      className={cn(
        "min-w-0",
        side === "left" ? "pb-join-left-row" : "pb-join-right-row"
      )}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translateX(0)"
          : side === "left"
            ? "translateX(-28px)"
            : "translateX(28px)",
        transition: "opacity 380ms ease, transform 380ms cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      <div className="mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
          {title}
        </p>
        <p className="text-[10px] text-ink-muted">{subtitle}</p>
      </div>

      <div
        className={cn(
          "overflow-hidden rounded-sm border",
          activeRowId && side === "left"
            ? "border-join-matched-border"
            : "border-line"
        )}
      >
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-surface-muted">
              <th
                className={cn(
                  "border-b border-b-accent bg-accent-muted px-3 py-2 text-left font-semibold text-accent-ink",
                  pulseHeader && "pb-key-pulse"
                )}
              >
                {joinKey ?? "key"}
              </th>
            </tr>
          </thead>
          <tbody>
            {display.map((row) => {
              const active = activeRowId === row._rowId;
              const matched = matchedRowIds.has(row._rowId);
              const pending = pendingRowIds.has(row._rowId);
              const count = matchCountByRowId.get(row._rowId) ?? 0;
              const val = joinKey ? row[joinKey] : null;

              return (
                <tr
                  key={row._rowId}
                  className={cn(
                    "border-b border-line/50 transition-all duration-200",
                    active && "bg-join-matched-bg ring-1 ring-inset ring-join-matched-border",
                    !active && matched && "bg-join-matched-bg/60",
                    !active && !matched && pending && "opacity-50",
                    !active && !matched && !pending && "opacity-30"
                  )}
                >
                  <td
                    ref={(el) => {
                      if (el) rowRefs.current.set(row._rowId, el);
                      else rowRefs.current.delete(row._rowId);
                    }}
                    className={cn(
                      "relative px-3 py-2 font-mono",
                      active || matched ? "font-semibold text-ink" : "text-ink-muted",
                      val === null && "italic text-join-null"
                    )}
                  >
                    {val === null ? "NULL" : val !== undefined ? String(val) : "—"}
                    {count > 1 && matched && (
                      <span className="ml-2 rounded-sm border border-join-matched-border bg-join-matched-bg px-1.5 text-[9px] text-accent-ink">
                        ×{count}
                      </span>
                    )}
                    {active && side === "left" && (
                      <span
                        className={cn(
                          "absolute top-1/2 -translate-y-1/2 size-2 rounded-full bg-accent",
                          side === "left" ? "-right-3" : "-left-3"
                        )}
                      />
                    )}
                    {active && side === "right" && (
                      <span className="absolute -left-3 top-1/2 size-2 -translate-y-1/2 rounded-full bg-accent" />
                    )}
                  </td>
                </tr>
              );
            })}
            {overflow > 0 && (
              <tr>
                <td className="px-3 py-2 text-center text-[10px] italic text-ink-muted">
                  +{overflow} more rows
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type Props = {
  leftRows: TrackedRow[];
  rightRows: TrackedRow[];
  joinedRows: TrackedRow[];
  joinType: string;
  joinSql: string;
  joinIndex?: number;
  joinRightTable?: string | null;
  animationKey: number;
  speed: PlaybackSpeed;
};

export default function JoinPlaybackCanvas({
  leftRows,
  rightRows,
  joinedRows,
  joinType,
  joinSql,
  joinIndex = 0,
  joinRightTable,
  animationKey,
  speed,
}: Props) {
  const bridgeUid = useId().replace(/:/g, "");
  const isLeftJoin = joinType.toUpperCase().includes("LEFT");
  const joinLayerTotal = useMemo(() => countJoinLayers(joinSql), [joinSql]);

  const panelKeys = useMemo(
    () =>
      resolvePlaybackJoinKeys(
        joinSql,
        joinIndex,
        joinLayerTotal,
        joinRightTable ?? null,
        leftRows,
        rightRows
      ),
    [joinSql, joinIndex, joinLayerTotal, joinRightTable, leftRows, rightRows]
  );

  const matchSteps = useMemo(
    () =>
      buildJoinMatchSteps(
        leftRows,
        rightRows,
        joinedRows,
        panelKeys.leftKey,
        panelKeys.rightKey,
        isLeftJoin
      ),
    [leftRows, rightRows, joinedRows, panelKeys.leftKey, panelKeys.rightKey, isLeftJoin]
  );

  const resultColumns = useMemo(
    () => (joinedRows.length > 0 ? getIntermediateResultColumns(joinedRows[0]) : []),
    [joinedRows]
  );

  const matchCountByRowId = useMemo(() => {
    const m = new Map<string, number>();
    for (const step of matchSteps) {
      if (step.pairs.length > 0) {
        m.set(step.leftId, step.pairs.length);
      }
    }
    return m;
  }, [matchSteps]);

  const [phase, setPhase] = useState<JoinPhase>("idle");
  const [stepIndex, setStepIndex] = useState(-1);
  const [pairIndex, setPairIndex] = useState(0);
  const [persistentArrows, setPersistentArrows] = useState<PersistentArrow[]>([]);
  const [completedSteps, setCompletedSteps] = useState(0);
  const [summaryFlash, setSummaryFlash] = useState(false);
  const [leftAnchors, setLeftAnchors] = useState<Map<string, RowAnchor>>(new Map());
  const [rightAnchors, setRightAnchors] = useState<Map<string, RowAnchor>>(new Map());

  const stageRef = useRef<HTMLDivElement>(null);
  const leftRowRefs = useRef<Map<string, HTMLTableCellElement>>(new Map());
  const rightRowRefs = useRef<Map<string, HTMLTableCellElement>>(new Map());

  const ms = (n: number) => Math.round(n / speed);
  const tablesMs = ms(380);
  const keysMs = ms(320);
  const connectMs = ms(520);
  const holdMs = ms(180);
  const betweenPairsMs = ms(120);

  const animSteps = useMemo(
    () => matchSteps.filter((s) => s.pairs.length > 0),
    [matchSteps]
  );
  const stepsToAnimate = useMemo(
    () => animSteps.slice(0, MAX_ANIMATED_STEPS),
    [animSteps]
  );
  const skippedStepCount = Math.max(0, animSteps.length - stepsToAnimate.length);

  const currentStep: JoinMatchStep | undefined =
    stepIndex >= 0 ? stepsToAnimate[stepIndex] : undefined;
  const currentPair: MatchPair | undefined = currentStep?.pairs[pairIndex];

  const activeLink: ActiveBridgeLink | null = useMemo(() => {
    if (!currentStep || !currentPair || phase !== "matching") return null;
    return {
      leftId: currentStep.leftId,
      rightId: "rightId" in currentPair ? currentPair.rightId : null,
      isNull: "null" in currentPair,
      pairIndex,
      pairCount: currentStep.pairs.length,
    };
  }, [currentStep, currentPair, phase, pairIndex]);

  const measureAnchors = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const sr = stage.getBoundingClientRect();

    const measureSide = (
      refs: Map<string, HTMLTableCellElement>,
      side: "left" | "right"
    ) => {
      const out = new Map<string, RowAnchor>();
      refs.forEach((cell, id) => {
        const r = cell.getBoundingClientRect();
        const pad = 2;
        out.set(id, {
          x: (side === "left" ? r.right - pad : r.left + pad) - sr.left,
          y: r.top + r.height / 2 - sr.top,
        });
      });
      return out;
    };

    setLeftAnchors(measureSide(leftRowRefs.current, "left"));
    setRightAnchors(measureSide(rightRowRefs.current, "right"));
  }, []);

  useLayoutEffect(() => {
    if (phase === "idle") return;
    measureAnchors();
    const raf = requestAnimationFrame(measureAnchors);
    return () => cancelAnimationFrame(raf);
  }, [phase, stepIndex, pairIndex, persistentArrows, measureAnchors, animationKey]);

  useEffect(() => {
    if (phase === "idle") return;
    const stage = stageRef.current;
    if (!stage) return;
    const ro = new ResizeObserver(() => measureAnchors());
    ro.observe(stage);
    return () => ro.disconnect();
  }, [phase, measureAnchors]);

  useEffect(() => {
    setPhase("idle");
    setStepIndex(-1);
    setPairIndex(0);
    setPersistentArrows([]);
    setCompletedSteps(0);
    setSummaryFlash(false);
    setLeftAnchors(new Map());
    setRightAnchors(new Map());

    const timers: ReturnType<typeof setTimeout>[] = [];
    const schedule = (fn: () => void, delay: number) => {
      timers.push(setTimeout(fn, delay));
    };

    let t = 60;
    schedule(() => setPhase("tables"), t);
    t += tablesMs;
    schedule(() => setPhase("keys"), t);
    t += keysMs;
    schedule(() => setPhase("matching"), t);

    const matchingStart = t;
    let cursor = matchingStart;

    for (let si = 0; si < stepsToAnimate.length; si++) {
      const step = stepsToAnimate[si];

      for (let pi = 0; pi < step.pairs.length; pi++) {
        const pair = step.pairs[pi];
        const arrowKey =
          "null" in pair
            ? `${step.leftId}-null-${pi}`
            : `${step.leftId}-${pair.rightId}`;

        schedule(() => {
          setStepIndex(si);
          setPairIndex(pi);
          setPersistentArrows((prev) => [
            ...prev.map((a) => ({ ...a, drawing: false })),
            {
              key: arrowKey,
              leftId: step.leftId,
              rightId: "rightId" in pair ? pair.rightId : null,
              isNull: "null" in pair,
              drawing: true,
            },
          ]);
        }, cursor);
        cursor += connectMs;
        schedule(() => {
          setPersistentArrows((prev) =>
            prev.map((a) => (a.key === arrowKey ? { ...a, drawing: false } : a))
          );
        }, cursor);
        cursor += holdMs;
        if (pi < step.pairs.length - 1) cursor += betweenPairsMs;
      }
      schedule(() => setCompletedSteps(si + 1), cursor);
      cursor += betweenPairsMs;
    }

    if (skippedStepCount > 0) {
      schedule(() => setSummaryFlash(true), cursor);
      cursor += ms(700);
    }

    if (stepsToAnimate.length === 0) {
      cursor += ms(400);
    }

    schedule(() => setPhase("result"), cursor + ms(80));
    schedule(() => setPhase("done"), cursor + ms(520));

    return () => timers.forEach(clearTimeout);
  }, [
    animationKey,
    speed,
    stepsToAnimate,
    skippedStepCount,
    tablesMs,
    keysMs,
    connectMs,
    holdMs,
    betweenPairsMs,
  ]);

  const tablesVisible = phase !== "idle";
  const keysPulse = phase === "keys";
  const resultVisible = phase === "result" || phase === "done";
  const panelsDimmed = resultVisible;

  const activeLeftId = phase === "matching" ? currentStep?.leftId ?? null : null;
  const activeRightId =
    phase === "matching" && currentPair && "rightId" in currentPair
      ? currentPair.rightId
      : null;

  const matchedLeftIds = useMemo(() => {
    const ids = new Set<string>();
    for (let i = 0; i < completedSteps && i < stepsToAnimate.length; i++) {
      ids.add(stepsToAnimate[i].leftId);
    }
    return ids;
  }, [completedSteps, stepsToAnimate]);

  const matchedRightIds = useMemo(() => {
    const ids = new Set<string>();
    for (let i = 0; i < completedSteps && i < stepsToAnimate.length; i++) {
      for (const p of stepsToAnimate[i].pairs) {
        if ("rightId" in p) ids.add(p.rightId);
      }
    }
    if (phase === "matching" && currentStep) {
      for (let pi = 0; pi <= pairIndex; pi++) {
        const p = currentStep.pairs[pi];
        if (p && "rightId" in p) ids.add(p.rightId);
      }
    }
    return ids;
  }, [completedSteps, stepsToAnimate, phase, currentStep, pairIndex]);

  const pendingLeftIds = useMemo(() => {
    const ids = new Set<string>();
    for (let i = completedSteps; i < animSteps.length; i++) {
      ids.add(animSteps[i].leftId);
    }
    return ids;
  }, [completedSteps, animSteps]);

  const leftTitle =
    joinIndex > 0 ? `Working set (after join ${joinIndex})` : "Working set";
  const rightTitle = panelKeys.rightTableName
    ? `New table — ${panelKeys.rightTableName}`
    : "New table";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2 rounded-sm border border-line bg-surface-raised px-4 py-2.5">
        <span className="rounded-sm border border-orange-300 bg-orange-100 px-2.5 py-1 text-[11px] font-semibold text-orange-900">
          {joinType}
        </span>
        {joinLayerTotal > 1 && (
          <span className="rounded-sm border border-line-strong bg-surface-muted px-2 py-1 text-[10px] text-ink-muted">
            Layer {panelKeys.joinLayer} of {panelKeys.joinLayerTotal}
          </span>
        )}
        {panelKeys.display ? (
          <span className="font-mono text-[11px] text-ink-secondary">
            <span className="text-ink-muted">ON </span>
            <span className="text-accent-ink">{panelKeys.display}</span>
          </span>
        ) : null}
      </div>

      <div
        ref={stageRef}
        className={cn(
          "relative grid grid-cols-[minmax(0,1fr)_minmax(88px,140px)_minmax(0,1fr)] items-stretch gap-2 sm:gap-3",
          panelsDimmed && "opacity-45"
        )}
        style={{ transition: "opacity 400ms ease" }}
      >
        {phase === "idle" ? (
          <>
            <div className="h-32 animate-pulse rounded-sm bg-surface-muted" />
            <div className="h-32 animate-pulse rounded-sm bg-surface-muted" />
            <div className="h-32 animate-pulse rounded-sm bg-surface-muted" />
          </>
        ) : (
          <>
            <KeyTable
              side="left"
              title={leftTitle}
              subtitle={`${leftRows.length} rows`}
              rows={leftRows}
              joinKey={panelKeys.leftKey}
              rowRefs={leftRowRefs}
              visible={tablesVisible}
              activeRowId={activeLeftId}
              matchedRowIds={matchedLeftIds}
              pendingRowIds={pendingLeftIds}
              pulseHeader={keysPulse}
              matchCountByRowId={matchCountByRowId}
            />

            <JoinMatchBridge link={activeLink} />

            {rightRows.length === 0 ? (
              <div className="rounded-sm border border-line bg-surface-muted px-3 py-8 text-center text-[11px] italic text-ink-muted">
                Right table unavailable
              </div>
            ) : (
              <KeyTable
                side="right"
                title={rightTitle}
                subtitle={`${rightRows.length} rows`}
                rows={rightRows}
                joinKey={panelKeys.rightKey}
                rowRefs={rightRowRefs}
                visible={tablesVisible}
                activeRowId={activeRightId}
                matchedRowIds={matchedRightIds}
                pendingRowIds={new Set()}
                pulseHeader={keysPulse}
                matchCountByRowId={new Map()}
              />
            )}
          </>
        )}

        {persistentArrows.length > 0 &&
          (phase === "matching" || phase === "result" || phase === "done") && (
          <JoinArrowOverlay
            stageRef={stageRef}
            arrows={persistentArrows}
            leftAnchors={leftAnchors}
            rightAnchors={rightAnchors}
            overlayUid={bridgeUid}
          />
        )}
      </div>

      {summaryFlash && skippedStepCount > 0 && (
        <p className="text-center text-[10px] italic text-ink-muted">
          +{skippedStepCount} more matched row{skippedStepCount !== 1 ? "s" : ""} in the
          result below
        </p>
      )}

      {joinedRows.length > 0 && (
        <div
          style={{
            opacity: resultVisible ? 1 : 0,
            transform: resultVisible ? "translateY(0)" : "translateY(28px)",
            transition: "opacity 420ms ease, transform 420ms cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          <div className="mb-3 flex items-center gap-3">
            <div className="h-px flex-1 bg-surface-muted/40" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
              Intermediate result — {joinedRows.length} rows
            </span>
            <div className="h-px flex-1 bg-surface-muted/40" />
          </div>

          <div className="max-h-[300px] overflow-auto rounded-sm border border-line">
            <table className="w-full border-collapse text-xs">
              <thead className="sticky top-0 bg-surface-muted ">
                <tr>
                  {resultColumns.map(({ key, label }) => (
                    <th
                      key={key}
                      className={cn(
                        "border-b px-3 py-2 text-left font-semibold whitespace-nowrap",
                        key === panelKeys.leftKey || key === panelKeys.rightKey
                          ? "border-b-accent bg-accent-muted text-accent-ink"
                          : "border-b-line text-ink-secondary"
                      )}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {joinedRows.map((row, i) => (
                  <tr
                    key={row._rowId}
                    className="pb-join-result-row border-b border-line/40"
                    style={{ animationDelay: `${i * 45}ms` } as CSSProperties}
                  >
                    {resultColumns.map(({ key }) => (
                      <td
                        key={key}
                        className={cn(
                          "px-3 py-1.5 font-mono whitespace-nowrap",
                          key === panelKeys.leftKey || key === panelKeys.rightKey
                            ? "font-semibold text-accent-ink"
                            : "text-ink-secondary",
                          row[key] === null && "italic text-join-null"
                        )}
                      >
                        {row[key] === null ? "NULL" : String(row[key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-[10px] text-ink-muted">
        Arrows stay visible through the intermediate result; lines clear on the next query.
      </p>
    </div>
  );
}
