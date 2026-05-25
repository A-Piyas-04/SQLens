/**
 * JoinPlaybackCanvas
 *
 * Layout:
 *   [join condition bar]
 *   [left panel 160px] [flex-1 gap — SVG arrows here] [right panel 160px]
 *   [joined result table]
 *
 * Multi-JOIN support:
 *   snapshot.sql is the cumulative SQL up to (and including) this join.
 *   parseJoinCondition finds the LAST ON clause → always the current join's
 *   condition, even when the SQL contains previous joins too.
 *
 * Layout design (fixes "right panel off-screen" bug):
 *   Both panels use fixed-width wrapper divs (w-40). A flex-1 center spacer
 *   fills the gap. Arrows live in that gap, measured from wrapper bounds —
 *   NOT from justify-between pushed to screen edges.
 *
 * Phase machine: idle → tables → lines → result → done
 *   - Row visibility is React-state driven (opacity/transform CSS transitions),
 *     NOT class-based CSS animations. This prevents the animation-restart bug
 *     where class changes sent rows back to opacity:0.
 *   - Both panels mount from the `tables` phase so refs exist when SVG measures.
 *   - `done` is the stable terminal state; SVG lines are static there.
 */

import {
  type CSSProperties,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cn } from "../../../lib/utils/cn";
import type { TrackedRow } from "../../../lib/simulator";
import type { PlaybackSpeed } from "../../../hooks/useSimulatorPlayback";

// ── Phase ──────────────────────────────────────────────────────────────────────
type JoinPhase = "idle" | "tables" | "lines" | "result" | "done";

type MatchInfo = {
  leftId:    string;
  rightId:   string | null;
  isNullRow: boolean;
};

type LineCoords = {
  x1: number; y1: number;
  x2: number; y2: number;
  isNull: boolean;
  length: number;
  key:    string;
};

// ── ON-clause parser ───────────────────────────────────────────────────────────

type JoinCondition = {
  leftTable:  string | null;
  leftKey:    string | null;
  rightTable: string | null;
  rightKey:   string | null;
  display:    string;
};

/**
 * Parses the join condition from SQL.
 * For multi-JOIN SQL (contains multiple ON clauses) we take the LAST one,
 * which always corresponds to the most recently added join.
 */
function parseJoinCondition(sql: string): JoinCondition {
  const empty: JoinCondition = {
    leftTable: null, leftKey: null,
    rightTable: null, rightKey: null,
    display: "",
  };

  // Match all ON clauses; stop each match at the next JOIN keyword or end-of-SQL.
  const onRe =
    /\bON\b\s+(.+?)(?=\s+(?:(?:LEFT|RIGHT|INNER|FULL|CROSS)\s+)?JOIN\b|\s+WHERE\b|\s+GROUP\s+BY\b|\s+ORDER\s+BY\b|\s+LIMIT\b|;?\s*$)/gi;

  let lastMatch: RegExpExecArray | null = null;
  let m: RegExpExecArray | null;
  while ((m = onRe.exec(sql)) !== null) lastMatch = m;

  if (!lastMatch) return empty;

  const clean = lastMatch[1].trim().replace(/["`]/g, "").replace(/\s+/g, " ");
  const parts = clean.match(/(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/i);
  if (!parts) return { ...empty, display: clean };

  // Build alias → real table name map
  const aliasMap = new Map<string, string>();
  const fromRe = /\b(?:FROM|JOIN)\s+"?(\w+)"?\s+(?:AS\s+)?"?(\w+)"?/gi;
  let tm: RegExpExecArray | null;
  while ((tm = fromRe.exec(sql)) !== null) {
    aliasMap.set(tm[2].toLowerCase(), tm[1]);
  }
  const resolve = (a: string) => aliasMap.get(a.toLowerCase()) ?? a;

  const leftTable  = resolve(parts[1]);
  const leftKey    = parts[2];
  const rightTable = resolve(parts[3]);
  const rightKey   = parts[4];

  return {
    leftTable, leftKey, rightTable, rightKey,
    display: `${leftTable}.${leftKey} = ${rightTable}.${rightKey}`,
  };
}

// ── Match map ──────────────────────────────────────────────────────────────────
function buildMatchMap(
  leftRows:   TrackedRow[],
  rightRows:  TrackedRow[],
  joinedRows: TrackedRow[],
): MatchInfo[] {
  if (joinedRows.length === 0) return [];

  const leftCols  = leftRows.length  > 0 ? Object.keys(leftRows[0]).filter( (k) => k !== "_rowId") : [];
  const rightCols = rightRows.length > 0 ? Object.keys(rightRows[0]).filter((k) => k !== "_rowId") : [];

  return joinedRows.map((joined) => {
    const isNullRow = rightCols.length > 0 && rightCols.every((c) => joined[c] === null);

    const leftRow = leftCols.length > 0
      ? leftRows.find((l) => leftCols.every((lc) => lc in joined && String(l[lc]) === String(joined[lc])))
      : undefined;

    const rightRow = !isNullRow && rightCols.length > 0
      ? rightRows.find((r) => rightCols.every((rc) => rc in joined && String(r[rc]) === String(joined[rc])))
      : undefined;

    return {
      leftId:    leftRow?._rowId  ?? joined._rowId,
      rightId:   rightRow?._rowId ?? null,
      isNullRow,
    };
  });
}

// ── KeyPanel ───────────────────────────────────────────────────────────────────
/**
 * Compact table showing ONLY the join-key column.
 * Matched rows are highlighted green; unmatched rows are dimmed.
 */
const MAX_KEY_ROWS = 14;

type KeyPanelProps = {
  side:        "left" | "right";
  label:       string;
  rows:        TrackedRow[];
  matchedIds:  Set<string>;
  joinKey:     string | null;
  rowRefs:     React.MutableRefObject<Map<string, HTMLTableRowElement>>;
  visible:     boolean;
};

function KeyPanel({ side, label, rows, matchedIds, joinKey, rowRefs, visible }: KeyPanelProps) {
  const display  = rows.slice(0, MAX_KEY_ROWS);
  const overflow = rows.length - display.length;

  return (
    <div
      style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? "translateX(0)" : side === "left" ? "translateX(-10px)" : "translateX(10px)",
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
              <th className="border-b border-b-sky-500/40 bg-sky-500/10 px-4 py-2 text-left font-semibold text-sky-300 whitespace-nowrap">
                {joinKey ?? "—"}
                <span className="ml-1.5 rounded bg-sky-500/20 px-1 py-px text-[9px] font-normal text-sky-400/80">
                  key
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {display.map((row) => {
              const matched = matchedIds.has(row._rowId);
              const val = joinKey !== null ? row[joinKey] : null;
              return (
                <tr
                  key={row._rowId}
                  ref={(el) => {
                    if (el) rowRefs.current.set(row._rowId, el);
                    else    rowRefs.current.delete(row._rowId);
                  }}
                  className={cn(
                    "border-b border-slate-800/40 transition-colors",
                    matched ? "bg-emerald-500/8" : "opacity-35",
                  )}
                >
                  <td className={cn(
                    "px-4 py-1.5 font-mono whitespace-nowrap",
                    matched ? "font-semibold text-sky-200" : "text-slate-500",
                    val === null && "italic text-amber-400",
                  )}>
                    {val === null ? "NULL" : val !== undefined ? String(val) : "—"}
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

// ── Props ──────────────────────────────────────────────────────────────────────
type Props = {
  leftRows:     TrackedRow[];
  rightRows:    TrackedRow[];
  joinedRows:   TrackedRow[];
  joinType:     string;
  /** Full SQL for this stage (cumulative up to this join). Used to parse condition. */
  joinSql:      string;
  animationKey: number;
  speed:        PlaybackSpeed;
};

// ── Main component ─────────────────────────────────────────────────────────────
export default function JoinPlaybackCanvas({
  leftRows, rightRows, joinedRows,
  joinType, joinSql,
  animationKey, speed,
}: Props) {
  const condition  = parseJoinCondition(joinSql);
  const matches    = buildMatchMap(leftRows, rightRows, joinedRows);
  const isLeftJoin = joinType.toUpperCase().includes("LEFT");

  const matchedLeftIds  = new Set(matches.map((m) => m.leftId));
  const matchedRightIds = new Set(
    matches.filter((m) => m.rightId !== null).map((m) => m.rightId!),
  );

  const leftLabel  = condition.leftTable  ?? "left";
  const rightLabel = condition.rightTable ?? "right";

  // ── Phase machine ──────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<JoinPhase>("idle");
  const matchesRef        = useRef(matches);
  matchesRef.current      = matches;

  useEffect(() => {
    setPhase("idle");
    setLines([]);

    const matchDelay   = Math.round(200 / speed);
    const lineDuration = 520;
    const drawnLines   = matches.filter((m) => !m.isNullRow).length;

    const t1 = setTimeout(() => setPhase("tables"), 80);
    const t2 = setTimeout(() => setPhase("lines"),  80 + 500);
    const t3 = setTimeout(() => setPhase("result"), 80 + 500 + drawnLines * matchDelay + lineDuration + 200);
    const t4 = setTimeout(() => setPhase("done"),   80 + 500 + drawnLines * matchDelay + lineDuration + 800);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animationKey, speed]);

  // ── Refs ───────────────────────────────────────────────────────────────────
  /**
   * Outer wrapper div refs — used for x-coordinates of SVG arrows.
   * Using wrapper divs (not pill divs) keeps arrows in the GAP between panels,
   * not inside the tables.
   */
  const leftWrapperEl  = useRef<HTMLDivElement | null>(null);
  const rightWrapperEl = useRef<HTMLDivElement | null>(null);
  const containerRef   = useRef<HTMLDivElement>(null);

  const leftRowRefs  = useRef<Map<string, HTMLTableRowElement>>(new Map());
  const rightRowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

  const [lines, setLines] = useState<LineCoords[]>([]);

  // ── SVG measurement ────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    if (phase !== "lines" && phase !== "result" && phase !== "done") return;

    const raf = requestAnimationFrame(() => {
      const container    = containerRef.current;
      const leftWrapper  = leftWrapperEl.current;
      const rightWrapper = rightWrapperEl.current;
      if (!container || !leftWrapper || !rightWrapper) return;

      const cr  = container.getBoundingClientRect();
      // x-endpoints come from WRAPPER div bounds so arrows span the inter-panel gap.
      const x1Base = leftWrapper.getBoundingClientRect().right  - cr.left + 6;
      const x2Base = rightWrapper.getBoundingClientRect().left  - cr.left - 6;

      const computed: LineCoords[] = [];
      matchesRef.current.forEach((m, i) => {
        const lEl = leftRowRefs.current.get(m.leftId);
        if (!lEl) return;
        const y1 = lEl.getBoundingClientRect().top + lEl.getBoundingClientRect().height / 2 - cr.top;

        if (m.rightId === null) {
          // LEFT JOIN unmatched: short dashed stub from left panel edge
          computed.push({ x1: x1Base, y1, x2: x1Base + 32, y2: y1, isNull: true, length: 32, key: `null-${i}` });
          return;
        }

        const rEl = rightRowRefs.current.get(m.rightId);
        if (!rEl) return;
        const y2     = rEl.getBoundingClientRect().top + rEl.getBoundingClientRect().height / 2 - cr.top;
        const length = Math.max(1, Math.hypot(x2Base - x1Base, y2 - y1));
        computed.push({ x1: x1Base, y1, x2: x2Base, y2, isNull: false, length, key: `match-${i}` });
      });

      setLines(computed);
    });

    return () => cancelAnimationFrame(raf);
  }, [phase, animationKey]);

  // ── Flags ──────────────────────────────────────────────────────────────────
  const tablesVisible = phase !== "idle";
  const linesVisible  = phase === "lines" || phase === "result" || phase === "done";
  const resultVisible = phase === "result" || phase === "done";
  const isDone        = phase === "done";
  const matchDelay    = Math.round(200 / speed);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5">

      {/* ── Join condition bar ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2.5 rounded-lg border border-slate-700/50 bg-slate-900/50 px-4 py-2.5">
        <span className="rounded-md border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-[11px] font-semibold text-purple-300">
          {joinType}
        </span>

        {condition.display ? (
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-slate-300">
            <span className="text-slate-500">ON</span>
            <span className="flex items-center">
              <span className="text-slate-500">{leftLabel}</span>
              <span className="text-slate-600">.</span>
              <span className="font-semibold text-sky-300">{condition.leftKey}</span>
            </span>
            <span className="text-slate-500">=</span>
            <span className="flex items-center">
              <span className="text-slate-500">{rightLabel}</span>
              <span className="text-slate-600">.</span>
              <span className="font-semibold text-sky-300">{condition.rightKey}</span>
            </span>
          </span>
        ) : (
          <span className="font-mono text-[11px] text-slate-500">ON condition</span>
        )}

        <span className="ml-auto rounded-full border border-slate-700/40 bg-slate-800/40 px-2 py-0.5 text-[10px] text-slate-600">
          {phase}
        </span>
      </div>

      {/* ── Key panels + SVG canvas ─────────────────────────────────────── */}
      {/*
       * Layout: [left-wrapper 160px] [flex-1 center spacer] [right-wrapper 160px]
       * Fixed-width wrappers guarantee both panels are always visible.
       * The SVG is absolutely overlaid across the full container.
       */}
      <div ref={containerRef} className="relative flex items-start gap-6 min-h-[60px]">

        {/* LEFT panel wrapper — ref used for x1 SVG measurement */}
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
              matchedIds={matchedLeftIds}
              joinKey={condition.leftKey}
              rowRefs={leftRowRefs}
              visible={tablesVisible}
            />
          )}
        </div>

        {/* Center spacer — arrows travel through this space */}
        <div className="flex-1 min-w-[60px]" />

        {/* RIGHT panel wrapper — ref used for x2 SVG measurement */}
        <div ref={(el) => { rightWrapperEl.current = el; }} className="w-40 shrink-0">
          {rightRows.length === 0 ? (
            <div className="rounded-lg border border-slate-700/30 bg-slate-800/20 px-3 py-4 text-center text-[11px] italic text-slate-600">
              right table data<br />not available
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
              matchedIds={matchedRightIds}
              joinKey={condition.rightKey}
              rowRefs={rightRowRefs}
              visible={tablesVisible}
            />
          )}
        </div>

        {/* SVG — arrows spanning the center gap */}
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

          {linesVisible && lines.map((line, i) =>
            isDone ? (
              <line
                key={line.key}
                x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
                stroke={line.isNull ? "#f59e0b" : "#10b981"}
                strokeWidth={1.5}
                strokeOpacity={line.isNull ? 0.45 : 0.72}
                strokeDasharray={line.isNull ? "4 3" : undefined}
                markerEnd={line.isNull ? "url(#pb-arr-n)" : "url(#pb-arr-m)"}
              />
            ) : (
              <line
                key={line.key}
                x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
                stroke={line.isNull ? "#f59e0b" : "#10b981"}
                strokeWidth={1.5}
                strokeOpacity={line.isNull ? 0.45 : 0.72}
                strokeDasharray={line.isNull ? "4 3" : `${line.length}`}
                strokeDashoffset={line.isNull ? undefined : `${line.length}`}
                markerEnd={line.isNull ? "url(#pb-arr-n)" : "url(#pb-arr-m)"}
                style={{
                  animation: "pb-line-draw 520ms cubic-bezier(0.22, 1, 0.36, 1) forwards",
                  animationDelay: `${i * matchDelay}ms`,
                  "--line-length": line.length,
                } as CSSProperties}
              />
            )
          )}
        </svg>
      </div>

      {/* ── Joined result table ──────────────────────────────────────────── */}
      {joinedRows.length > 0 && (
        <div
          style={{
            opacity:    resultVisible ? 1 : 0,
            transform:  resultVisible ? "translateY(0)" : "translateY(12px)",
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
                  {Object.keys(joinedRows[0])
                    .filter((k) => k !== "_rowId")
                    .map((col) => {
                      const isKey = col === condition.leftKey || col === condition.rightKey;
                      return (
                        <th key={col} className={cn(
                          "border-b px-3 py-2 text-left font-semibold whitespace-nowrap",
                          isKey
                            ? "border-b-sky-500/40 bg-sky-500/8 text-sky-300"
                            : "border-b-slate-700/60 text-slate-300",
                        )}>
                          {col}
                        </th>
                      );
                    })}
                </tr>
              </thead>
              <tbody>
                {joinedRows.map((row) => {
                  const cols      = Object.keys(row).filter((k) => k !== "_rowId");
                  const rightCols = rightRows.length > 0
                    ? Object.keys(rightRows[0]).filter((k) => k !== "_rowId")
                    : [];
                  const isNullRow = rightCols.length > 0 && rightCols.every((c) => row[c] === null);
                  return (
                    <tr key={row._rowId} className={cn("border-b border-slate-800/40", isNullRow && "bg-amber-500/5")}>
                      {cols.map((col) => {
                        const isKey = col === condition.leftKey || col === condition.rightKey;
                        return (
                          <td key={col} className={cn(
                            "px-3 py-1.5 font-mono whitespace-nowrap",
                            isKey ? "font-semibold text-sky-300" : "text-slate-300",
                            row[col] === null && "italic text-amber-400",
                          )}>
                            {row[col] === null ? "NULL" : String(row[col])}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-5 text-[10px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <svg width="22" height="8" className="overflow-visible" aria-hidden>
            <defs>
              <marker id="pb-leg-m" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
                <path d="M0,0 L0,5 L5,2.5 z" fill="#10b981" fillOpacity="0.75" />
              </marker>
            </defs>
            <line x1="0" y1="4" x2="17" y2="4" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.72" markerEnd="url(#pb-leg-m)" />
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
              <line x1="0" y1="4" x2="17" y2="4" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.45" strokeDasharray="4 3" markerEnd="url(#pb-leg-n)" />
            </svg>
            unmatched → NULL row
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <span className="rounded border border-sky-500/30 bg-sky-500/10 px-1.5 py-px font-mono text-[9px] text-sky-300">key</span>
          join key column
        </span>
      </div>
    </div>
  );
}
