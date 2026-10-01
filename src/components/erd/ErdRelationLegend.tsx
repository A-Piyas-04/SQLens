import { Panel } from "@xyflow/react";
import { Info } from "lucide-react";
import { useState } from "react";

import { relationshipNotation } from "../../lib/erd/inferCardinality";
import { cn } from "../../lib/utils/cn";

function MarkerSample({
  cardinality,
  orientation,
}: {
  cardinality: "one" | "many";
  orientation: "horizontal" | "vertical";
}) {
  const stroke = "var(--color-accent)";
  const w = 28;
  const h = 16;
  const midX = w / 2;
  const midY = h / 2;

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden
      className="shrink-0"
    >
      {orientation === "horizontal" ? (
        <>
          <line
            x1={4}
            y1={midY}
            x2={w - 4}
            y2={midY}
            stroke={stroke}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
          {cardinality === "one" ? (
            <line
              x1={midX}
              y1={midY - 5}
              x2={midX}
              y2={midY + 5}
              stroke={stroke}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          ) : (
            <>
              <line x1={midX} y1={midY} x2={midX + 6} y2={midY} stroke={stroke} strokeWidth={1.5} />
              <line x1={midX + 6} y1={midY - 4} x2={midX} y2={midY} stroke={stroke} strokeWidth={1.5} />
              <line x1={midX + 6} y1={midY} x2={midX} y2={midY} stroke={stroke} strokeWidth={1.5} />
              <line x1={midX + 6} y1={midY + 4} x2={midX} y2={midY} stroke={stroke} strokeWidth={1.5} />
            </>
          )}
        </>
      ) : (
        <>
          <line
            x1={midX}
            y1={4}
            x2={midX}
            y2={h - 4}
            stroke={stroke}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
          {cardinality === "one" ? (
            <line
              x1={midX - 5}
              y1={midY}
              x2={midX + 5}
              y2={midY}
              stroke={stroke}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          ) : (
            <>
              <line x1={midX} y1={midY} x2={midX} y2={midY + 6} stroke={stroke} strokeWidth={1.5} />
              <line x1={midX - 4} y1={midY + 6} x2={midX} y2={midY} stroke={stroke} strokeWidth={1.5} />
              <line x1={midX} y1={midY + 6} x2={midX} y2={midY} stroke={stroke} strokeWidth={1.5} />
              <line x1={midX + 4} y1={midY + 6} x2={midX} y2={midY} stroke={stroke} strokeWidth={1.5} />
            </>
          )}
        </>
      )}
    </svg>
  );
}

const RELATION_ROWS = [
  {
    notation: relationshipNotation("one-to-one"),
    title: "One-to-one",
    detail: "UNIQUE foreign key — each row links to at most one parent row.",
    sample: "profiles.user_id → users.id",
  },
  {
    notation: relationshipNotation("many-to-one"),
    title: "Many-to-one",
    detail: "Default FK — many child rows can reference the same parent row.",
    sample: "orders.user_id → users.id",
  },
  {
    notation: relationshipNotation("one-to-many"),
    title: "One-to-many",
    detail: "Parent view of many-to-one — one parent, many children.",
    sample: "users.id ← orders.user_id",
  },
  {
    notation: relationshipNotation("many-to-many"),
    title: "Many-to-many",
    detail: "Composite-key junction table — dashed line between entities.",
    sample: "students ↔ courses via enrollments",
  },
] as const;

export default function ErdRelationLegend() {
  const [open, setOpen] = useState(true);

  return (
    <Panel position="bottom-left" className="!m-3 !mb-28 max-w-[min(100%,18rem)]">
      <div className="overflow-hidden rounded-sm border border-line bg-surface-elevated shadow-sm">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-center gap-2 border-b border-line px-3 py-2 text-left text-xs font-semibold text-ink hover:bg-surface-muted"
          aria-expanded={open}
        >
          <Info className="size-3.5 shrink-0 text-accent" aria-hidden />
          <span>Relationship notation</span>
        </button>

        {open ? (
          <div className="space-y-3 px-3 py-2.5 text-[10px] leading-snug text-ink-muted">
            <div className="space-y-1.5">
              <p className="font-semibold uppercase tracking-wide text-ink">Line endings</p>
              <div className="flex items-center gap-2">
                <MarkerSample cardinality="one" orientation="horizontal" />
                <span>
                  <strong className="text-ink">One (│)</strong> — exactly one related row
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MarkerSample cardinality="many" orientation="horizontal" />
                <span>
                  <strong className="text-ink">Many (crow&apos;s foot)</strong> — zero or more
                  related rows
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-semibold uppercase tracking-wide text-ink">Relationship types</p>
              {RELATION_ROWS.map((row) => (
                <div key={row.notation} className="space-y-0.5">
                  <p className="font-medium text-ink">
                    <span
                      className={cn(
                        "mr-1.5 inline-flex min-w-[2rem] justify-center rounded-sm bg-accent-soft px-1 py-px font-mono text-[9px] text-accent-ink",
                        row.notation === "N:M" && "border border-dashed border-accent/50"
                      )}
                    >
                      {row.notation}
                    </span>
                    {row.title}
                  </p>
                  <p>{row.detail}</p>
                  <p className="font-mono text-[9px] text-ink-muted/90">{row.sample}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}
