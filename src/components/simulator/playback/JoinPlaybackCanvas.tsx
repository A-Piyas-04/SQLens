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

type Phase =
  | "idle"
  | "revealing-left"  // left-table rows fade in with stagger
  | "scanning"        // scan cursor sweeps down the left column
  | "matching"        // SVG match lines draw one by one
  | "result";         // joined result rows fade in

type MatchInfo = {
  leftId:   string;
  rightId:  string | null;
  isNullRow: boolean;
};

function buildMatchMap(
  leftRows:   TrackedRow[],
  rightRows:  TrackedRow[],
  joinedRows: TrackedRow[]
): MatchInfo[] {
  const rightCols = rightRows.length > 0
    ? Object.keys(rightRows[0]).filter((k) => k !== "_rowId")
    : [];

  return joinedRows.map((joined) => {
    const isNullRow =
      rightCols.length > 0 && rightCols.every((c) => joined[c] === null);

    const leftCols = leftRows.length > 0
      ? Object.keys(leftRows[0]).filter((k) => k !== "_rowId")
      : [];

    const leftRow  = leftRows.find((l) =>
      leftCols.every((c) => c in joined && String(l[c]) === String(joined[c]))
    );
    const rightRow = isNullRow
      ? null
      : rightRows.find((r) =>
          rightCols.every((c) => c in joined && String(r[c]) === String(joined[c]))
        );

    return {
      leftId:   leftRow?._rowId  ?? joined._rowId,
      rightId:  rightRow?._rowId ?? null,
      isNullRow,
    };
  });
}

function rowLabel(row: TrackedRow): string {
  return Object.entries(row)
    .filter(([k]) => k !== "_rowId")
    .slice(0, 2)
    .map(([, v]) => (v === null ? "NULL" : String(v)))
    .join(", ");
}

// ── Sub-components ────────────────────────────────────────────────────────────

type RowPillProps = {
  label:     string;
  matched:   boolean;
  isNull?:   boolean;
  animate?:  boolean;
  rowIndex?: number;
  innerRef?: (el: HTMLDivElement | null) => void;
};

function RowPill({ label, matched, isNull = false, animate = false, rowIndex = 0, innerRef }: RowPillProps) {
  return (
    <div
      ref={innerRef}
      className={cn(
        "pb-join-left-row flex min-w-[110px] max-w-[180px] items-center rounded-md border px-2.5 py-1.5 text-[11px] font-mono leading-none",
        !animate && "opacity-100",
        isNull
          ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
          : matched
            ? "border-emerald-500/30 bg-emerald-500/8 text-emerald-300"
            : "border-slate-700/50 bg-slate-800/50 text-slate-400"
      )}
      style={animate ? { "--pb-row-index": rowIndex } as CSSProperties : undefined}
    >
      <span className="truncate">{label}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type Props = {
  leftRows:   TrackedRow[];
  rightRows:  TrackedRow[];
  joinedRows: TrackedRow[];
  joinType:   string;
  animationKey: number;
  speed:      PlaybackSpeed;
};

export default function JoinPlaybackCanvas({
  leftRows,
  rightRows,
  joinedRows,
  joinType,
  animationKey,
  speed,
}: Props) {
  const matches    = buildMatchMap(leftRows, rightRows, joinedRows);
  const isLeftJoin = joinType.toUpperCase().includes("LEFT");

  const matchedLeftIds  = new Set(matches.map((m) => m.leftId));
  const matchedRightIds = new Set(matches.filter((m) => m.rightId).map((m) => m.rightId!));

  // ── Phase state machine ───────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>("idle");

  useEffect(() => {
    setPhase("idle");

    // Stagger per row scales with speed — slower at 0.5x, faster at 4x
    const staggerPerRow = Math.max(60, Math.round(120 / speed));
    // Scan cursor duration: time to sweep all left rows plus a visual pause
    const scanDuration  = leftRows.length * staggerPerRow + 700;
    // Gap between each match line drawing
    const matchDelay    = Math.round(200 / speed);

    const t1 = setTimeout(() => setPhase("revealing-left"), 80);
    const t2 = setTimeout(() => setPhase("scanning"), leftRows.length * staggerPerRow + 160);
    const t3 = setTimeout(() => setPhase("matching"), leftRows.length * staggerPerRow + scanDuration);
    const t4 = setTimeout(
      () => setPhase("result"),
      leftRows.length * staggerPerRow + scanDuration + matches.length * matchDelay + 350
    );

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animationKey]);

  // ── SVG line positions ─────────────────────────────────────────────────────
  const leftRefs  = useRef<Map<string, HTMLDivElement>>(new Map());
  const rightRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  type LineCoords = { x1: number; y1: number; x2: number; y2: number; isNull: boolean; length: number; key: string };
  const [lines, setLines] = useState<LineCoords[]>([]);

  useLayoutEffect(() => {
    if (phase !== "matching" && phase !== "result") return;
    const container = containerRef.current;
    if (!container) return;

    const cr = container.getBoundingClientRect();
    const computed: LineCoords[] = [];

    matches.forEach((m, i) => {
      const lEl = leftRefs.current.get(m.leftId);
      if (!lEl) return;
      const lRect = lEl.getBoundingClientRect();
      const y1 = lRect.top + lRect.height / 2 - cr.top;
      const x1 = lRect.right - cr.left;

      if (m.rightId === null) {
        // NULL row — short dashed stub
        computed.push({ x1, y1, x2: x1 + 28, y2: y1, isNull: true, length: 28, key: `null-${i}` });
        return;
      }

      const rEl = rightRefs.current.get(m.rightId);
      if (!rEl) return;
      const rRect = rEl.getBoundingClientRect();
      const y2 = rRect.top + rRect.height / 2 - cr.top;
      const x2 = rRect.left - cr.left;
      const length = Math.hypot(x2 - x1, y2 - y1);
      computed.push({ x1, y1, x2, y2, isNull: false, length, key: `match-${i}` });
    });

    setLines(computed);
  }, [phase, matches]);

  const matchDelay = 120 / speed;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {joinType} row matching
        </span>
        {isLeftJoin && (
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400">
            unmatched rows produce NULLs
          </span>
        )}
        <span className="ml-auto rounded-full border border-slate-700/40 bg-slate-800/40 px-2 py-0.5 text-[10px] text-slate-500">
          Phase: {phase}
        </span>
      </div>

      {/* Matching canvas */}
      <div ref={containerRef} className="relative flex items-start justify-between gap-0 min-h-[120px]">
        {/* Left table */}
        <div className="flex flex-col gap-1.5 z-10">
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
            left table
          </p>
          {phase === "idle" ? (
            <div className="h-8 w-28 animate-pulse rounded bg-slate-800/50" />
          ) : (
            leftRows.map((row, i) => (
              <RowPill
                key={row._rowId}
                label={rowLabel(row)}
                matched={matchedLeftIds.has(row._rowId)}
                animate={phase === "revealing-left"}
                rowIndex={i}
                innerRef={(el) => {
                  if (el) leftRefs.current.set(row._rowId, el);
                  else    leftRefs.current.delete(row._rowId);
                }}
              />
            ))
          )}

          {/* Scan cursor */}
          {phase === "scanning" && (
            <div
              className="pointer-events-none absolute left-0 h-px w-28 bg-sky-400/60 shadow-[0_0_6px_1px_rgb(56_189_248/0.4)]"
              style={{ animation: `pb-scan-cursor ${leftRows.length * 80 + 200}ms linear forwards` }}
            />
          )}
        </div>

        {/* SVG overlay for match lines */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          aria-hidden
        >
          {(phase === "matching" || phase === "result") &&
            lines.map((line, i) => (
              <line
                key={line.key}
                x1={line.x1} y1={line.y1}
                x2={line.x2} y2={line.y2}
                stroke={line.isNull ? "#f59e0b" : "#10b981"}
                strokeWidth={1.5}
                strokeOpacity={line.isNull ? 0.5 : 0.75}
                strokeDasharray={line.isNull ? "4 3" : `${line.length}`}
                strokeDashoffset={line.isNull ? undefined : `${line.length}`}
                  style={{
                    animation: `pb-line-draw 520ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
                    animationDelay: `${i * matchDelay}ms`,
                  "--line-length": line.length,
                } as CSSProperties}
              />
            ))}
        </svg>

        {/* Right table */}
        <div className="flex flex-col gap-1.5 z-10">
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
            right table
          </p>
          {(phase === "matching" || phase === "result") &&
            rightRows.map((row) => (
              <RowPill
                key={row._rowId}
                label={rowLabel(row)}
                matched={matchedRightIds.has(row._rowId)}
                innerRef={(el) => {
                  if (el) rightRefs.current.set(row._rowId, el);
                  else    rightRefs.current.delete(row._rowId);
                }}
              />
            ))}
        </div>
      </div>

      {/* Result table */}
      {phase === "result" && joinedRows.length > 0 && (
        <div className="mt-2">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-slate-500">
            joined result ({joinedRows.length} row{joinedRows.length !== 1 ? "s" : ""})
          </p>
          <div className="rounded-lg border border-slate-700/50 overflow-auto max-h-[280px]">
            <table className="w-full border-collapse text-xs">
              <thead className="sticky top-0 bg-slate-800/95 backdrop-blur-sm">
                <tr>
                  {Object.keys(joinedRows[0])
                    .filter((k) => k !== "_rowId")
                    .map((col) => (
                      <th key={col} className="border-b border-slate-700/60 px-3 py-2 text-left font-semibold text-slate-300 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {joinedRows.map((row, i) => {
                  const cols = Object.keys(row).filter((k) => k !== "_rowId");
                  const isNullRow = cols.every((c) => row[c] === null) ||
                    (rightRows.length > 0 &&
                      Object.keys(rightRows[0])
                        .filter((k) => k !== "_rowId")
                        .every((c) => row[c] === null));
                  return (
                    <tr
                      key={row._rowId}
                      className={cn(
                        "pb-join-result-row border-b border-slate-800/40",
                        isNullRow ? "bg-amber-500/5" : "bg-transparent"
                      )}
                      style={{ "--pb-row-index": i } as CSSProperties}
                    >
                      {cols.map((col) => (
                        <td key={col} className="px-3 py-2 font-mono whitespace-nowrap text-slate-300">
                          {row[col] === null ? (
                            <span className="italic text-amber-400">NULL</span>
                          ) : (
                            String(row[col])
                          )}
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

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-slate-500 mt-1">
        <span className="flex items-center gap-1.5">
          <svg width="18" height="4" className="overflow-visible" aria-hidden>
            <line x1="0" y1="2" x2="18" y2="2" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.75" />
          </svg>
          matched
        </span>
        {isLeftJoin && (
          <span className="flex items-center gap-1.5">
            <svg width="18" height="4" className="overflow-visible" aria-hidden>
              <line x1="0" y1="2" x2="18" y2="2" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.5" strokeDasharray="4 3" />
            </svg>
            no match (NULL)
          </span>
        )}
      </div>
    </div>
  );
}
