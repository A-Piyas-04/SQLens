/**
 * JoinPlaybackCanvas — row-by-row matching narrative.
 */

import {
  type CSSProperties,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "../../../lib/utils/cn";
import type { TrackedRow } from "../../../lib/simulator";
import type { PlaybackSpeed } from "../../../hooks/useSimulatorPlayback";
import { getIntermediateResultColumns } from "../stageConstants";

type JoinPhase = "idle" | "tables" | "key-highlight" | "matching" | "result" | "done";

type MatchInfo = {
  leftId: string;
  rightId: string | null;
  isNullRow: boolean;
};

type LineCoords = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isNull: boolean;
  length: number;
  key: string;
};

type JoinCondition = {
  leftTable: string | null;
  leftKey: string | null;
  rightTable: string | null;
  rightKey: string | null;
  display: string;
};

function parseJoinCondition(sql: string): JoinCondition {
  const empty: JoinCondition = {
    leftTable: null,
    leftKey: null,
    rightTable: null,
    rightKey: null,
    display: "",
  };

  const onRe =
    /\bON\b\s+(.+?)(?=\s+(?:(?:LEFT|RIGHT|INNER|FULL|CROSS)\s+)?JOIN\b|\s+WHERE\b|\s+GROUP\s+BY\b|\s+ORDER\s+BY\b|\s+LIMIT\b|;?\s*$)/gi;

  let lastMatch: RegExpExecArray | null = null;
  let m: RegExpExecArray | null;
  while ((m = onRe.exec(sql)) !== null) lastMatch = m;

  if (!lastMatch) return empty;

  const clean = lastMatch[1].trim().replace(/["`]/g, "").replace(/\s+/g, " ");
  const parts = clean.match(/(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/i);
  if (!parts) return { ...empty, display: clean };

  const aliasMap = new Map<string, string>();
  const fromRe = /\b(?:FROM|JOIN)\s+"?(\w+)"?\s+(?:AS\s+)?"?(\w+)"?/gi;
  let tm: RegExpExecArray | null;
  while ((tm = fromRe.exec(sql)) !== null) {
    aliasMap.set(tm[2].toLowerCase(), tm[1]);
  }
  const resolve = (a: string) => aliasMap.get(a.toLowerCase()) ?? a;

  return {
    leftTable: resolve(parts[1]),
    leftKey: parts[2],
    rightTable: resolve(parts[3]),
    rightKey: parts[4],
    display: `${resolve(parts[1])}.${parts[2]} = ${resolve(parts[3])}.${parts[4]}`,
  };
}

function buildMatchMap(
  leftRows: TrackedRow[],
  rightRows: TrackedRow[],
  joinedRows: TrackedRow[]
): MatchInfo[] {
  if (joinedRows.length === 0) return [];

  const leftCols =
    leftRows.length > 0
      ? Object.keys(leftRows[0]).filter((k) => k !== "_rowId")
      : [];
  const rightCols =
    rightRows.length > 0
      ? Object.keys(rightRows[0]).filter((k) => k !== "_rowId")
      : [];

  return joinedRows.map((joined) => {
    const isNullRow =
      rightCols.length > 0 && rightCols.every((c) => joined[c] === null);

    const leftRow =
      leftCols.length > 0
        ? leftRows.find((l) =>
            leftCols.every((lc) => lc in joined && String(l[lc]) === String(joined[lc]))
          )
        : undefined;

    const rightRow =
      !isNullRow && rightCols.length > 0
        ? rightRows.find((r) =>
            rightCols.every((rc) => rc in joined && String(r[rc]) === String(joined[rc]))
          )
        : undefined;

    return {
      leftId: leftRow?._rowId ?? joined._rowId,
      rightId: rightRow?._rowId ?? null,
      isNullRow,
    };
  });
}

type MatchPair =
  | { rightId: string }
  | { null: true };

type LeftRowMatchStep = {
  leftId: string;
  leftIndex: number;
  pairs: MatchPair[];
};

/** One step per left row; pairs include every matching right row (one-to-many). */
function buildLeftRowMatchSteps(
  leftRows: TrackedRow[],
  rightRows: TrackedRow[],
  leftKey: string | null,
  rightKey: string | null,
  isLeftJoin: boolean
): LeftRowMatchStep[] {
  if (!leftKey || !rightKey) {
    return leftRows.map((left, leftIndex) => ({
      leftId: left._rowId,
      leftIndex,
      pairs: isLeftJoin ? [{ null: true }] : [],
    }));
  }

  return leftRows.map((left, leftIndex) => {
    const keyVal = left[leftKey];
    const matchingRights = rightRows.filter(
      (r) => String(r[rightKey]) === String(keyVal)
    );

    if (matchingRights.length > 0) {
      return {
        leftId: left._rowId,
        leftIndex,
        pairs: matchingRights.map((r) => ({ rightId: r._rowId })),
      };
    }

    if (isLeftJoin) {
      return { leftId: left._rowId, leftIndex, pairs: [{ null: true }] };
    }

    return { leftId: left._rowId, leftIndex, pairs: [] };
  });
}

function lineKeyForPair(leftIndex: number, pair: MatchPair): string {
  if ("null" in pair) return `line-L${leftIndex}-null`;
  return `line-L${leftIndex}-R${pair.rightId}`;
}

function allLineKeysForStep(step: LeftRowMatchStep): string[] {
  return step.pairs.map((pair) => lineKeyForPair(step.leftIndex, pair));
}

const MAX_KEY_ROWS = 14;
const MATCH_BATCH = 8;

type KeyPanelProps = {
  side: "left" | "right";
  label: string;
  rows: TrackedRow[];
  joinKey: string | null;
  rowRefs: React.MutableRefObject<Map<string, HTMLTableRowElement>>;
  visible: boolean;
  highlightedIds: Set<string>;
  matchedIds: Set<string>;
  keyPulse: boolean;
  nullRowIds: Set<string>;
};

function KeyPanel({
  side,
  label,
  rows,
  joinKey,
  rowRefs,
  visible,
  highlightedIds,
  matchedIds,
  keyPulse,
  nullRowIds,
}: KeyPanelProps) {
  const display = rows.slice(0, MAX_KEY_ROWS);
  const overflow = rows.length - display.length;

  return (
    <div
      className={cn(side === "left" ? "pb-join-left-row" : "pb-join-right-row")}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : side === "left" ? "translateX(-40px)" : "translateX(40px)",
        transition: "opacity 400ms ease, transform 400ms cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      <div className="mb-1.5 flex items-baseline gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {side === "left" ? "Left" : "Right"} table
        </span>
        <span className="text-[10px] text-slate-600">— {label}</span>
        <span className="ml-1 text-[10px] text-slate-700">{rows.length} rows</span>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-700/50">
        <table className="border-collapse text-xs">
          <thead>
            <tr className="bg-slate-800/80">
              <th
                className={cn(
                  "border-b border-b-sky-500/40 bg-sky-500/10 px-4 py-2 text-left font-semibold text-sky-300 whitespace-nowrap",
                  keyPulse && "pb-key-pulse"
                )}
              >
                {joinKey ?? "—"}
                <span className="ml-1.5 rounded bg-sky-500/20 px-1 py-px text-[9px] font-normal text-sky-400/80">
                  key
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {display.map((row) => {
              const highlighted = highlightedIds.has(row._rowId);
              const matched = matchedIds.has(row._rowId);
              const isNull = nullRowIds.has(row._rowId);
              const val = joinKey !== null ? row[joinKey] : null;
              return (
                <tr
                  key={row._rowId}
                  ref={(el) => {
                    if (el) rowRefs.current.set(row._rowId, el);
                    else rowRefs.current.delete(row._rowId);
                  }}
                  className={cn(
                    "border-b border-slate-800/40 transition-all duration-150",
                    highlighted && "scale-[1.02] border-l-2 border-l-emerald-400 bg-emerald-500/30",
                    !highlighted && matched && "bg-emerald-500/8",
                    !highlighted && !matched && "opacity-35",
                    isNull && highlighted && "border-l-2 border-dashed border-l-amber-400"
                  )}
                >
                  <td
                    className={cn(
                      "relative px-4 py-1.5 font-mono whitespace-nowrap",
                      matched || highlighted ? "font-semibold text-sky-200" : "text-slate-500",
                      val === null && "italic text-amber-400"
                    )}
                  >
                    {val === null ? "NULL" : val !== undefined ? String(val) : "—"}
                    {isNull && highlighted && side === "left" && (
                      <span className="absolute -right-1 top-1/2 ml-2 -translate-y-1/2 rounded border border-amber-500/40 bg-amber-500/15 px-1 text-[9px] text-amber-300">
                        NULL
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {overflow > 0 && (
              <tr>
                <td className="px-4 py-1.5 text-center text-[10px] italic text-slate-700">
                  ┄ {overflow} more ┄
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
  animationKey: number;
  speed: PlaybackSpeed;
};

export default function JoinPlaybackCanvas({
  leftRows,
  rightRows,
  joinedRows,
  joinType,
  joinSql,
  animationKey,
  speed,
}: Props) {
  const condition = parseJoinCondition(joinSql);
  const isLeftJoin = joinType.toUpperCase().includes("LEFT");

  const leftSteps = useMemo(
    () =>
      buildLeftRowMatchSteps(
        leftRows,
        rightRows,
        condition.leftKey,
        condition.rightKey,
        isLeftJoin
      ),
    [leftRows, rightRows, condition.leftKey, condition.rightKey, isLeftJoin]
  );

  const joinedMatchMap = useMemo(
    () => buildMatchMap(leftRows, rightRows, joinedRows),
    [leftRows, rightRows, joinedRows]
  );

  const resultColumns = useMemo(
    () => (joinedRows.length > 0 ? getIntermediateResultColumns(joinedRows[0]) : []),
    [joinedRows]
  );

  const [phase, setPhase] = useState<JoinPhase>("idle");
  const [currentLeftIndex, setCurrentLeftIndex] = useState(-1);
  const [drawnLineKeys, setDrawnLineKeys] = useState<Set<string>>(new Set());
  const [fastForward, setFastForward] = useState(false);
  const [scanY, setScanY] = useState<number | null>(null);

  const leftWrapperEl = useRef<HTMLDivElement | null>(null);
  const rightWrapperEl = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const matchZoneRef = useRef<HTMLDivElement>(null);
  const leftRowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());
  const rightRowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());
  const [lines, setLines] = useState<LineCoords[]>([]);

  const ms = (base: number) => Math.round(base / speed);
  const rowStepMs = ms(150 + 250 + 300 + 80);
  const tablesMs = ms(400);
  const keyPauseMs = ms(400);

  useEffect(() => {
    setPhase("idle");
    setCurrentLeftIndex(-1);
    setDrawnLineKeys(new Set());
    setFastForward(false);
    setScanY(null);
    setLines([]);

    const ids: ReturnType<typeof setTimeout>[] = [];
    const schedule = (fn: () => void, delay: number) => {
      ids.push(setTimeout(fn, delay));
    };

    schedule(() => setPhase("tables"), 80);
    schedule(() => setPhase("key-highlight"), 80 + tablesMs);
    schedule(() => setPhase("matching"), 80 + tablesMs + keyPauseMs);

    const matchStart = 80 + tablesMs + keyPauseMs;
    const n = leftSteps.length;
    const batchEnd = Math.min(MATCH_BATCH, n);

    for (let i = 0; i < batchEnd; i++) {
      schedule(() => setCurrentLeftIndex(i), matchStart + i * rowStepMs);
    }

    if (n > MATCH_BATCH) {
      schedule(() => {
        setFastForward(true);
        setCurrentLeftIndex(n - 1);
        const keys = new Set<string>();
        for (let j = MATCH_BATCH; j < n; j++) {
          for (const k of allLineKeysForStep(leftSteps[j])) keys.add(k);
        }
        setDrawnLineKeys(keys);
      }, matchStart + batchEnd * rowStepMs);
    }

    const matchDuration =
      n > MATCH_BATCH
        ? matchStart + batchEnd * rowStepMs + ms(300)
        : matchStart + Math.max(n, 1) * rowStepMs;

    schedule(() => setPhase("result"), matchDuration + 100);
    schedule(() => setPhase("done"), matchDuration + ms(450) + 200);

    return () => ids.forEach(clearTimeout);
  }, [animationKey, speed, leftSteps, rowStepMs, tablesMs, keyPauseMs]);

  useLayoutEffect(() => {
    if (phase !== "matching" && phase !== "result" && phase !== "done") return;

    const raf = requestAnimationFrame(() => {
      const container = containerRef.current;
      const leftWrapper = leftWrapperEl.current;
      const rightWrapper = rightWrapperEl.current;
      if (!container || !leftWrapper || !rightWrapper) return;

      const cr = container.getBoundingClientRect();
      const x1Base = leftWrapper.getBoundingClientRect().right - cr.left + 6;
      const x2Base = rightWrapper.getBoundingClientRect().left - cr.left - 6;
      const zoneWidth = (rightWrapper.getBoundingClientRect().left - leftWrapper.getBoundingClientRect().right) || 60;

      const computed: LineCoords[] = [];

      leftSteps.forEach((step) => {
        if (phase === "matching" && !fastForward && step.leftIndex > currentLeftIndex) {
          return;
        }

        const lEl = leftRowRefs.current.get(step.leftId);
        if (!lEl) return;
        const y1 = lEl.getBoundingClientRect().top + lEl.getBoundingClientRect().height / 2 - cr.top;

        step.pairs.forEach((pair) => {
          const lineKey = lineKeyForPair(step.leftIndex, pair);

          if (
            phase === "matching" &&
            !fastForward &&
            step.leftIndex === currentLeftIndex &&
            !drawnLineKeys.has(lineKey)
          ) {
            return;
          }
          if (
            phase === "matching" &&
            !fastForward &&
            step.leftIndex > currentLeftIndex
          ) {
            return;
          }

          if ("null" in pair) {
            computed.push({
              x1: x1Base,
              y1,
              x2: x1Base + zoneWidth * 0.4,
              y2: y1,
              isNull: true,
              length: zoneWidth * 0.4,
              key: lineKey,
            });
            return;
          }

          const rEl = rightRowRefs.current.get(pair.rightId);
          if (!rEl) return;
          const y2 = rEl.getBoundingClientRect().top + rEl.getBoundingClientRect().height / 2 - cr.top;
          const length = Math.max(1, Math.hypot(x2Base - x1Base, y2 - y1));
          computed.push({
            x1: x1Base,
            y1,
            x2: x2Base,
            y2,
            isNull: false,
            length,
            key: lineKey,
          });
        });
      });

      setLines(computed);

      if (phase === "matching" && currentLeftIndex >= 0 && !fastForward) {
        const step = leftSteps[currentLeftIndex];
        const lEl = step ? leftRowRefs.current.get(step.leftId) : null;
        if (lEl) {
          setScanY(lEl.getBoundingClientRect().top + lEl.getBoundingClientRect().height / 2 - cr.top);
        }
      }
    });

    return () => cancelAnimationFrame(raf);
  }, [phase, currentLeftIndex, drawnLineKeys, fastForward, leftSteps, animationKey]);

  useEffect(() => {
    if (phase !== "matching" || currentLeftIndex < 0 || fastForward) return;
    const step = leftSteps[currentLeftIndex];
    if (!step) return;
    const keys = allLineKeysForStep(step);
    const timer = setTimeout(() => {
      setDrawnLineKeys((prev) => new Set([...prev, ...keys]));
    }, ms(250 + 300));
    return () => clearTimeout(timer);
  }, [phase, currentLeftIndex, fastForward, speed, leftSteps]);

  const tablesVisible = phase !== "idle";
  const keyPulse = phase === "key-highlight";
  const panelsDimmed = phase === "result" || phase === "done";
  const resultVisible = phase === "result" || phase === "done";
  const isDone = phase === "done";

  const currentStep =
    phase === "matching" && currentLeftIndex >= 0 && !fastForward
      ? leftSteps[currentLeftIndex]
      : undefined;

  const highlightedLeftId = currentStep?.leftId ?? null;

  const highlightedRightIds = useMemo(() => {
    if (!currentStep) return new Set<string>();
    const ids = new Set<string>();
    for (const pair of currentStep.pairs) {
      if ("rightId" in pair) ids.add(pair.rightId);
    }
    return ids;
  }, [currentStep]);

  const completedLeftCount =
    phase === "matching" && !fastForward
      ? currentLeftIndex + 1
      : leftSteps.length;

  const matchedLeftIds = new Set(
    leftSteps.slice(0, completedLeftCount).filter((s) => s.pairs.some((p) => "rightId" in p)).map((s) => s.leftId)
  );
  const matchedRightIds = new Set(
    leftSteps
      .slice(0, completedLeftCount)
      .flatMap((s) => s.pairs)
      .filter((p): p is { rightId: string } => "rightId" in p)
      .map((p) => p.rightId)
  );
  const nullLeftIds = new Set(
    leftSteps
      .slice(0, completedLeftCount)
      .filter((s) => s.pairs.some((p) => "null" in p))
      .map((s) => s.leftId)
  );

  const leftLabel = condition.leftTable ?? "left";
  const rightLabel = condition.rightTable ?? "right";
  const remainingLeftRows =
    leftSteps.length > MATCH_BATCH ? leftSteps.length - MATCH_BATCH : 0;

  return (
    <div
      className="flex flex-col gap-5"
      style={{ "--pb-scan-ms": `${ms(250)}ms` } as CSSProperties}
    >
      <div className="flex flex-wrap items-center gap-2.5 rounded-lg border border-slate-700/50 bg-slate-900/50 px-4 py-2.5">
        <span className="rounded-md border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-[11px] font-semibold text-purple-300">
          {joinType}
        </span>
        {condition.display ? (
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-slate-300">
            <span className="text-slate-500">ON</span>
            <span className="font-semibold text-sky-300">{condition.display}</span>
          </span>
        ) : (
          <span className="font-mono text-[11px] text-slate-500">ON condition</span>
        )}
      </div>

      <div
        ref={containerRef}
        className="relative flex items-start gap-6 min-h-[60px]"
        style={{ opacity: panelsDimmed ? 0.45 : 1, transition: "opacity 450ms ease" }}
      >
        <div ref={(el) => { leftWrapperEl.current = el; }} className="w-40 shrink-0">
          {phase === "idle" ? (
            <div className="space-y-1.5">
              <div className="h-3 w-24 animate-pulse rounded bg-slate-800/60" />
              <div className="h-28 w-full animate-pulse rounded-lg bg-slate-800/40" />
            </div>
          ) : (
            <KeyPanel
              side="left"
              label={leftLabel}
              rows={leftRows}
              joinKey={condition.leftKey}
              rowRefs={leftRowRefs}
              visible={tablesVisible}
              highlightedIds={
                highlightedLeftId ? new Set([highlightedLeftId]) : new Set()
              }
              matchedIds={matchedLeftIds}
              keyPulse={keyPulse}
              nullRowIds={nullLeftIds}
            />
          )}
        </div>

        <div ref={matchZoneRef} className="relative flex-1 min-w-[60px] min-h-[60px]">
          {phase === "matching" && scanY !== null && !fastForward && (
            <div
              className="pointer-events-none absolute left-0 right-0 h-0.5 overflow-visible"
              style={{ top: scanY }}
            >
              <div
                className="pb-scan-beam h-0.5 w-full bg-gradient-to-r from-emerald-400/80 to-transparent"
                style={{ transformOrigin: "left center" }}
              />
            </div>
          )}
        </div>

        <div ref={(el) => { rightWrapperEl.current = el; }} className="w-40 shrink-0">
          {rightRows.length === 0 ? (
            <div className="rounded-lg border border-slate-700/30 bg-slate-800/20 px-3 py-4 text-center text-[11px] italic text-slate-600">
              right table data
              <br />
              not available
            </div>
          ) : phase === "idle" ? (
            <div className="space-y-1.5">
              <div className="h-3 w-24 animate-pulse rounded bg-slate-800/60" />
              <div className="h-28 w-full animate-pulse rounded-lg bg-slate-800/40" />
            </div>
          ) : (
            <KeyPanel
              side="right"
              label={rightLabel}
              rows={rightRows}
              joinKey={condition.rightKey}
              rowRefs={rightRowRefs}
              visible={tablesVisible}
              highlightedIds={highlightedRightIds}
              matchedIds={matchedRightIds}
              keyPulse={keyPulse}
              nullRowIds={new Set()}
            />
          )}
        </div>

        <svg
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          aria-hidden
        >
          <defs>
            <marker id="pb-arr-m" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="#10b981" fillOpacity="0.75" />
            </marker>
            <marker id="pb-arr-n" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="#f59e0b" fillOpacity="0.5" />
            </marker>
          </defs>

          {lines.map((line) =>
            isDone || fastForward ? (
              <line
                key={line.key}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke={line.isNull ? "#f59e0b" : "#10b981"}
                strokeWidth={1.5}
                strokeOpacity={line.isNull ? 0.45 : 0.72}
                strokeDasharray={line.isNull ? "4 3" : undefined}
                markerEnd={line.isNull ? "url(#pb-arr-n)" : "url(#pb-arr-m)"}
              />
            ) : (
              <line
                key={line.key}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke={line.isNull ? "#f59e0b" : "#10b981"}
                strokeWidth={1.5}
                strokeOpacity={line.isNull ? 0.45 : 0.72}
                strokeDasharray={line.isNull ? "4 3" : `${line.length}`}
                strokeDashoffset={line.isNull ? undefined : `${line.length}`}
                markerEnd={line.isNull ? "url(#pb-arr-n)" : "url(#pb-arr-m)"}
                style={{
                  animation: "pb-line-draw 300ms cubic-bezier(0.22, 1, 0.36, 1) forwards",
                  "--line-length": line.length,
                } as CSSProperties}
              />
            )
          )}
        </svg>
      </div>

      {fastForward && remainingLeftRows > 0 && phase === "matching" && (
        <p className="text-center text-[10px] italic text-slate-500">
          … and {remainingLeftRows} more left row{remainingLeftRows !== 1 ? "s" : ""}
        </p>
      )}

      {joinedRows.length > 0 && (
        <div
          style={{
            opacity: resultVisible ? 1 : 0,
            transform: resultVisible ? "translateY(0)" : "translateY(40px)",
            transition: "opacity 450ms ease, transform 450ms cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          <div className="mb-3 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-700/40" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              intermediate result — {joinedRows.length} row{joinedRows.length !== 1 ? "s" : ""}
            </span>
            <div className="h-px flex-1 bg-slate-700/40" />
          </div>

          <div className="overflow-auto rounded-lg border border-slate-700/50 max-h-[300px]">
            <table className="w-full border-collapse text-xs">
              <thead className="sticky top-0 bg-slate-800/95 backdrop-blur-sm">
                <tr>
                  {resultColumns.map(({ key, label }) => {
                      const isKey =
                        key === condition.leftKey || key === condition.rightKey;
                      return (
                        <th
                          key={key}
                          className={cn(
                            "border-b px-3 py-2 text-left font-semibold whitespace-nowrap",
                            isKey
                              ? "border-b-sky-500/40 bg-sky-500/8 text-sky-300"
                              : "border-b-slate-700/60 text-slate-300"
                          )}
                        >
                          {label}
                        </th>
                      );
                    })}
                </tr>
              </thead>
              <tbody>
                {joinedRows.map((row, i) => {
                  const rightCols =
                    rightRows.length > 0
                      ? Object.keys(rightRows[0]).filter((k) => k !== "_rowId")
                      : [];
                  const isNullRow =
                    rightCols.length > 0 && rightCols.every((c) => row[c] === null);
                  const match = joinedMatchMap[i];
                  const flashColor = match?.isNullRow ? "amber" : "emerald";

                  return (
                    <tr
                      key={row._rowId}
                      className={cn(
                        "pb-join-result-row border-b border-slate-800/40",
                        isNullRow && "border-l-2 border-l-amber-400 bg-amber-500/5",
                        resultVisible && flashColor === "emerald" && "pb-result-flash-emerald",
                        resultVisible && flashColor === "amber" && "pb-result-flash-amber"
                      )}
                      style={
                        {
                          animationDelay: `${i * 50}ms`,
                          "--pb-row-index": i,
                        } as CSSProperties
                      }
                    >
                      {resultColumns.map(({ key }) => (
                        <td
                          key={key}
                          className={cn(
                            "px-3 py-1.5 font-mono whitespace-nowrap",
                            key === condition.leftKey || key === condition.rightKey
                              ? "font-semibold text-sky-300"
                              : "text-slate-300",
                            row[key] === null && "italic text-amber-400 pb-null-fade-in"
                          )}
                        >
                          {row[key] === null ? "NULL" : String(row[key])}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-center gap-5 text-[10px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <svg width="22" height="8" className="overflow-visible" aria-hidden>
            <defs>
              <marker id="pb-leg-m" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
                <path d="M0,0 L0,5 L5,2.5 z" fill="#10b981" fillOpacity="0.75" />
              </marker>
            </defs>
            <line
              x1="0"
              y1="4"
              x2="17"
              y2="4"
              stroke="#10b981"
              strokeWidth="1.5"
              strokeOpacity="0.72"
              markerEnd="url(#pb-leg-m)"
            />
          </svg>
          matched
        </span>
        {isLeftJoin && (
          <span className="flex items-center gap-1.5">
            <svg width="22" height="8" className="overflow-visible" aria-hidden>
              <defs>
                <marker id="pb-leg-n" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
                  <path d="M0,0 L0,5 L5,2.5 z" fill="#f59e0b" fillOpacity="0.5" />
                </marker>
              </defs>
              <line
                x1="0"
                y1="4"
                x2="17"
                y2="4"
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeOpacity="0.45"
                strokeDasharray="4 3"
                markerEnd="url(#pb-leg-n)"
              />
            </svg>
            unmatched → NULL row
          </span>
        )}
      </div>
    </div>
  );
}
