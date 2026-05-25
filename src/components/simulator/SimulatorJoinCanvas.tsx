import { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils/cn";
import type { TrackedRow } from "../../lib/simulator/types/snapshotTypes";

type Props = {
  /** Rows from the left (base) table — the FROM snapshot. */
  leftRows: TrackedRow[];
  /** Rows from the right table — the `rightTableRows` on the JOIN snapshot. */
  rightRows: TrackedRow[];
  /** The joined output rows — the JOIN snapshot rows. */
  joinedRows: TrackedRow[];
  /** "INNER JOIN" | "LEFT JOIN" | etc. */
  joinType: string;
};

type MatchInfo = {
  /** _rowId of the left-table row */
  leftId: string;
  /** _rowId of the right-table row, or null if this is a NULL-row (LEFT JOIN) */
  rightId: string | null;
  /** Whether this pair introduces NULLs */
  isNullRow: boolean;
};

/**
 * Determines which left-table rows matched which right-table rows by examining
 * the joined output.  A joined row is a NULL row when all right-table columns
 * are NULL (LEFT JOIN unmatched case).
 */
function buildMatchMap(
  leftRows: TrackedRow[],
  rightRows: TrackedRow[],
  joinedRows: TrackedRow[]
): MatchInfo[] {
  const rightColNames = rightRows.length > 0
    ? Object.keys(rightRows[0]).filter((k) => k !== "_rowId")
    : [];

  const matches: MatchInfo[] = [];

  for (const joined of joinedRows) {
    // Determine if this is a NULL row (all right-table columns are NULL).
    const isNullRow =
      rightColNames.length > 0 &&
      rightColNames.every((col) => joined[col] === null);

    if (isNullRow) {
      // Find the left row this NULL-row came from by matching on common columns.
      const leftColNames = leftRows.length > 0
        ? Object.keys(leftRows[0]).filter((k) => k !== "_rowId")
        : [];
      const leftRow = leftRows.find((l) =>
        leftColNames.every((col) => col in joined && String(l[col]) === String(joined[col]))
      );
      matches.push({
        leftId: leftRow?._rowId ?? joined._rowId,
        rightId: null,
        isNullRow: true,
      });
    } else {
      // Find matching left row.
      const leftColNames = leftRows.length > 0
        ? Object.keys(leftRows[0]).filter((k) => k !== "_rowId")
        : [];
      const leftRow = leftRows.find((l) =>
        leftColNames.every((col) => col in joined && String(l[col]) === String(joined[col]))
      );
      // Find matching right row.
      const rightRow = rightRows.find((r) =>
        rightColNames.every((col) => col in joined && String(r[col]) === String(joined[col]))
      );
      matches.push({
        leftId: leftRow?._rowId ?? joined._rowId,
        rightId: rightRow?._rowId ?? null,
        isNullRow: false,
      });
    }
  }

  return matches;
}

/** Returns the display label for a row (first 2 non-ID column values). */
function rowLabel(row: TrackedRow): string {
  const entries = Object.entries(row).filter(([k]) => k !== "_rowId");
  return entries
    .slice(0, 2)
    .map(([, v]) => (v === null ? "NULL" : String(v)))
    .join(", ");
}

// ── Sub-components ────────────────────────────────────────────────────────────

type RowPillProps = {
  label: string;
  matched: boolean;
  isNullRow?: boolean;
  side: "left" | "right";
  innerRef?: (el: HTMLDivElement | null) => void;
};

function RowPill({ label, matched, isNullRow = false, side, innerRef }: RowPillProps) {
  return (
    <div
      ref={innerRef}
      className={cn(
        "flex min-w-[100px] max-w-[160px] items-center rounded-md border px-2.5 py-1.5 text-[11px] font-mono leading-none transition-colors duration-200",
        side === "left" ? "justify-end text-right" : "justify-start text-left",
        isNullRow
          ? "border-amber-500/30 bg-amber-500/8 text-amber-400"
          : matched
            ? "border-emerald-500/30 bg-emerald-500/8 text-emerald-300"
            : "border-slate-700/50 bg-slate-800/50 text-slate-400"
      )}
    >
      <span className="truncate">{label}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SimulatorJoinCanvas({
  leftRows,
  rightRows,
  joinedRows,
  joinType,
}: Props) {
  const matches = buildMatchMap(leftRows, rightRows, joinedRows);

  const matchedLeftIds = new Set(matches.map((m) => m.leftId));
  const matchedRightIds = new Set(
    matches.filter((m) => m.rightId !== null).map((m) => m.rightId as string)
  );

  // Refs to measure element positions for SVG lines.
  const leftRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const rightRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<
    { x1: number; y1: number; x2: number; y2: number; isNullRow: boolean; key: string }[]
  >([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();

    const computed = matches.map((match, i) => {
      const leftEl = leftRefs.current.get(match.leftId);
      const rightEl = match.rightId
        ? rightRefs.current.get(match.rightId)
        : null;

      if (!leftEl) return null;

      const leftRect = leftEl.getBoundingClientRect();
      const y1 = leftRect.top + leftRect.height / 2 - containerRect.top;
      const x1 = leftRect.right - containerRect.left;

      if (!rightEl) {
        // NULL row — draw a short dashed line going nowhere
        return {
          x1,
          y1,
          x2: x1 + 32,
          y2: y1,
          isNullRow: true,
          key: `null-${i}`,
        };
      }

      const rightRect = rightEl.getBoundingClientRect();
      const y2 = rightRect.top + rightRect.height / 2 - containerRect.top;
      const x2 = rightRect.left - containerRect.left;

      return { x1, y1, x2, y2, isNullRow: match.isNullRow, key: `match-${i}` };
    });

    setLines(computed.filter(Boolean) as typeof lines);
  }, [matches, leftRows, rightRows]);

  const isLeftJoin = joinType.toUpperCase().includes("LEFT");

  return (
    <div className="mt-4 rounded-lg border border-slate-700/40 bg-slate-900/30 p-4">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
          {joinType} row matching
        </span>
        {isLeftJoin && (
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400">
            unmatched rows produce NULLs
          </span>
        )}
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative flex items-start justify-between gap-0"
      >
        {/* Left table */}
        <div className="flex flex-col gap-1.5">
          <p className="mb-1 text-[10px] font-medium text-slate-500 uppercase tracking-wide">
            left table
          </p>
          {leftRows.map((row) => (
            <RowPill
              key={row._rowId}
              label={rowLabel(row)}
              matched={matchedLeftIds.has(row._rowId)}
              side="left"
              innerRef={(el) => {
                if (el) leftRefs.current.set(row._rowId, el);
                else leftRefs.current.delete(row._rowId);
              }}
            />
          ))}
        </div>

        {/* SVG connector lines */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          aria-hidden
        >
          {lines.map((line) => (
            <line
              key={line.key}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke={line.isNullRow ? "#f59e0b" : "#10b981"}
              strokeWidth={1.5}
              strokeOpacity={line.isNullRow ? 0.5 : 0.7}
              strokeDasharray={line.isNullRow ? "4 3" : undefined}
            />
          ))}
        </svg>

        {/* Right table */}
        <div className="flex flex-col gap-1.5">
          <p className="mb-1 text-[10px] font-medium text-slate-500 uppercase tracking-wide">
            right table
          </p>
          {rightRows.map((row) => (
            <RowPill
              key={row._rowId}
              label={rowLabel(row)}
              matched={matchedRightIds.has(row._rowId)}
              side="right"
              innerRef={(el) => {
                if (el) rightRefs.current.set(row._rowId, el);
                else rightRefs.current.delete(row._rowId);
              }}
            />
          ))}
          {isLeftJoin && rightRows.length === 0 && (
            <span className="text-[11px] italic text-slate-600">
              (no right rows)
            </span>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-4 text-[10px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <svg width="16" height="4" className="overflow-visible">
            <line x1="0" y1="2" x2="16" y2="2" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.7" />
          </svg>
          matched
        </span>
        {isLeftJoin && (
          <span className="flex items-center gap-1.5">
            <svg width="16" height="4" className="overflow-visible">
              <line x1="0" y1="2" x2="16" y2="2" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.5" strokeDasharray="4 3" />
            </svg>
            no match (NULL)
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full border border-slate-600 bg-slate-800" />
          unmatched
        </span>
      </div>
    </div>
  );
}
