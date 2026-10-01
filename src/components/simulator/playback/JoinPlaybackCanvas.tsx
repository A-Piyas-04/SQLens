/**
 * JOIN playback canvas — LEFT | MATCH LANE | RIGHT, then the joined result.
 * Purely presentational: the JOIN animator drives `view` through the global
 * stage controller, so pause, speed, cancel and completion are shared.
 */

import { useCallback, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { cn } from "../../../lib/utils/cn";
import type { TrackedRow } from "../../../lib/simulator";
import { getIntermediateResultColumns } from "../stageConstants";
import JoinArrowOverlay, { type ArrowGeometry } from "./join/JoinArrowOverlay";
import type { JoinViewState } from "./animation/stageAnimationTypes";
import { JOIN_PANEL_ROWS, type JoinModel } from "./animation/joinModel";
import { formatValue } from "./animation/groupModel";
import { windowRows } from "./animation/rowWindow";

type Anchor = { x: number; y: number };

type PanelProps = {
  side: "left" | "right";
  title: string;
  rows: TrackedRow[];
  joinKey: string | null;
  identity: string | null;
  cellRefs: React.MutableRefObject<Map<string, HTMLElement>>;
  activeId: string | null;
  matchedIds: Set<string>;
  keysFocused: boolean;
};

function KeyPanel({ side, title, rows, joinKey, identity, cellRefs, activeId, matchedIds, keysFocused }: PanelProps) {
  const important = activeId ? [activeId, ...matchedIds] : [...matchedIds];
  const win = windowRows(rows, important, JOIN_PANEL_ROWS);
  return (
    <div data-join-panel={side} className="min-w-0">
      <div className="mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">{title}</p>
        <p className="text-[10px] text-ink-muted">{rows.length} rows</p>
      </div>
      <div role="table" aria-label={title} className="overflow-hidden rounded-sm border border-line">
        <div role="row" className="pb-join-panel-row bg-surface-muted">
          <div
            role="columnheader"
            data-join-key-header
            data-focused={keysFocused || undefined}
            className="pb-join-key-header"
          >
            {joinKey ?? "key"}
          </div>
          {identity && (
            <div role="columnheader" className="px-3 py-2 text-left font-semibold text-ink-muted">
              {identity}
            </div>
          )}
        </div>
        {win.rows.map((row) => {
          const active = activeId === row._rowId;
          const matched = matchedIds.has(row._rowId);
          const val = joinKey ? row[joinKey] : undefined;
          return (
            <div
              key={row._rowId}
              role="row"
              data-join-row={row._rowId}
              data-state={active ? "active" : matched ? "matched" : undefined}
              className="pb-join-panel-row"
              aria-current={active || undefined}
            >
              <div
                role="cell"
                ref={(el) => {
                  if (el) cellRefs.current.set(row._rowId, el);
                  else cellRefs.current.delete(row._rowId);
                }}
                className={cn("px-3 py-1.5 font-mono", val === null && "italic text-join-null")}
              >
                {val === undefined ? "—" : formatValue(val)}
              </div>
              {identity && (
                <div role="cell" className="truncate px-3 py-1.5 text-ink-secondary">
                  {formatValue(row[identity])}
                </div>
              )}
            </div>
          );
        })}
        {win.hiddenCount > 0 && (
          <div role="row" className="px-3 py-1.5 text-center text-[10px] italic text-ink-muted">
            <div role="cell">+{win.hiddenCount} more rows</div>
          </div>
        )}
      </div>
    </div>
  );
}

type Props = {
  model: JoinModel;
  view: JoinViewState;
};

export default function JoinPlaybackCanvas({ model, view }: Props) {
  const uid = useId().replace(/:/g, "");
  const stageRef = useRef<HTMLDivElement>(null);
  const leftRefs = useRef<Map<string, HTMLElement>>(new Map());
  const rightRefs = useRef<Map<string, HTMLElement>>(new Map());
  const [geometry, setGeometry] = useState<{ w: number; h: number; arrows: ArrowGeometry[] }>({
    w: 0,
    h: 0,
    arrows: [],
  });

  const { keys, animatedSteps } = model;
  const currentStep = view.stepIndex >= 0 ? animatedSteps[view.stepIndex] : undefined;
  const currentPair = currentStep?.pairs[view.pairIndex];
  const matching = view.joinPhase === "matching";
  const activeLeftId = matching ? currentStep?.leftId ?? null : null;
  const activeRightId = matching && currentPair && "rightId" in currentPair ? currentPair.rightId : null;

  const matchedLeft = useMemo(() => {
    const s = new Set<string>();
    for (let i = 0; i < view.completedSteps && i < animatedSteps.length; i++) s.add(animatedSteps[i].leftId);
    return s;
  }, [view.completedSteps, animatedSteps]);

  const matchedRight = useMemo(() => {
    const s = new Set<string>();
    for (const a of view.arrows) if (a.rightId && a.status !== "drawing") s.add(a.rightId);
    return s;
  }, [view.arrows]);

  const measure = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const sr = stage.getBoundingClientRect();
    const anchor = (el: HTMLElement | undefined, side: "left" | "right"): Anchor | null => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        x: (side === "left" ? r.right - 2 : r.left + 2) - sr.left,
        y: r.top + r.height / 2 - sr.top,
      };
    };
    const arrows: ArrowGeometry[] = [];
    for (const a of view.arrows) {
      const l = anchor(leftRefs.current.get(a.leftId), "left");
      if (!l) continue;
      const r = a.isNull ? { x: l.x + 56, y: l.y } : anchor(a.rightId ? rightRefs.current.get(a.rightId) : undefined, "right");
      if (!r) continue;
      arrows.push({ key: a.key, x1: l.x, y1: l.y, x2: r.x, y2: r.y, isNull: a.isNull, status: a.status });
    }
    setGeometry({ w: sr.width, h: sr.height, arrows });
  }, [view.arrows]);

  useLayoutEffect(() => {
    measure();
  }, [measure, view.joinPhase]);

  // Re-measure on resize so connectors never point at stale coordinates.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(stage);
    return () => ro.disconnect();
  }, [measure]);

  const resultColumns = useMemo(
    () => (model.joinedRows.length > 0 ? getIntermediateResultColumns(model.joinedRows[0]) : []),
    [model.joinedRows]
  );
  const resultVisible = view.joinPhase === "result";
  const keysFocused = view.joinPhase !== "tables";
  const leftTitle = (model.keys.joinIndex ?? 0) > 0 ? `Working set (after join ${keys.joinIndex})` : "Working set";
  const rightTitle = keys.rightTableName ? `New table — ${keys.rightTableName}` : "New table";

  const activeLeftRow = activeLeftId ? model.leftRows.find((r) => r._rowId === activeLeftId) : undefined;
  const activeRightRow = activeRightId ? model.rightRows.find((r) => r._rowId === activeRightId) : undefined;
  const ident = (row: TrackedRow | undefined, col: string | null, key: string | null) =>
    row ? formatValue(row[col ?? key ?? ""] ?? row[key ?? ""]) : "";

  return (
    <div className="flex flex-col gap-4">
      <div
        ref={stageRef}
        data-join-stage
        className={cn(
          "relative grid grid-cols-[minmax(0,1fr)_minmax(110px,170px)_minmax(0,1fr)] items-start gap-3",
          resultVisible && "pb-join-receded"
        )}
      >
        <KeyPanel
          side="left"
          title={leftTitle}
          rows={model.leftRows}
          joinKey={keys.leftKey}
          identity={model.leftIdentity}
          cellRefs={leftRefs}
          activeId={activeLeftId}
          matchedIds={matchedLeft}
          keysFocused={keysFocused}
        />

        <div className="pb-join-lane" aria-live="polite">
          <div className="pb-join-lane-line" aria-hidden />
          {matching && currentStep && (
            <div className="pb-join-lane-card">
              <p className="font-mono text-[11px] text-ink">
                {formatValue(currentStep.leftKeyValue)}
                {currentPair && "rightId" in currentPair && activeRightRow && keys.rightKey
                  ? ` = ${formatValue(activeRightRow[keys.rightKey])}`
                  : ""}
              </p>
              {view.laneMessage && (
                <p data-join-lane-message className="pb-join-lane-message">
                  {view.laneMessage}
                </p>
              )}
              {view.laneMessage && activeLeftRow && (
                <p className="mt-1 truncate text-[10px] text-ink-secondary">
                  {ident(activeLeftRow, model.leftIdentity, keys.leftKey)}
                  {" + "}
                  {activeRightRow ? ident(activeRightRow, model.rightIdentity, keys.rightKey) : "NULL"}
                </p>
              )}
              {currentStep.pairs.length > 1 && (
                <p className="mt-1 text-[9px] text-ink-muted">
                  match {view.pairIndex + 1} of {currentStep.pairs.length}
                </p>
              )}
            </div>
          )}
        </div>

        {model.rightRows.length === 0 ? (
          <div data-join-panel="right" className="rounded-sm border border-line bg-surface-muted px-3 py-8 text-center text-[11px] italic text-ink-muted">
            Right table unavailable
          </div>
        ) : (
          <KeyPanel
            side="right"
            title={rightTitle}
            rows={model.rightRows}
            joinKey={keys.rightKey}
            identity={model.rightIdentity}
            cellRefs={rightRefs}
            activeId={activeRightId}
            matchedIds={matchedRight}
            keysFocused={keysFocused}
          />
        )}

        <JoinArrowOverlay width={geometry.w} height={geometry.h} arrows={geometry.arrows} overlayUid={uid} />
      </div>

      {view.showSkippedSummary && model.skippedStepCount > 0 && (
        <p className="text-center text-[10px] italic text-ink-muted">
          +{model.skippedStepCount} more matched row{model.skippedStepCount !== 1 ? "s" : ""} — see the result below
        </p>
      )}

      {resultVisible && model.joinedRows.length > 0 && (
        <div data-join-result>
          <div className="mb-2 flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
              Joined result — {model.joinedRows.length} rows
            </span>
            <div className="h-px flex-1 bg-line" />
          </div>
          <div className="max-h-[320px] overflow-auto rounded-sm border border-line">
            <table className="w-full border-collapse text-xs">
              <thead className="sticky top-0 bg-surface-muted">
                <tr>
                  {resultColumns.map(({ key, label }) => (
                    <th
                      key={key}
                      className={cn(
                        "border-b px-3 py-2 text-left font-semibold whitespace-nowrap",
                        key === keys.leftKey || key === keys.rightKey
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
                {model.joinedRows.map((row) => (
                  <tr key={row._rowId} data-row-id={row._rowId} className="border-b border-line/40">
                    {resultColumns.map(({ key }) => (
                      <td
                        key={key}
                        className={cn(
                          "px-3 py-1.5 font-mono whitespace-nowrap",
                          key === keys.leftKey || key === keys.rightKey ? "font-semibold text-accent-ink" : "text-ink-secondary",
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
    </div>
  );
}
