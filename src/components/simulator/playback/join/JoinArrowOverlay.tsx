import type { JoinArrowStatus } from "../animation/stageAnimationTypes";

export type ArrowGeometry = {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isNull: boolean;
  status: JoinArrowStatus;
};

type Props = {
  width: number;
  height: number;
  arrows: ArrowGeometry[];
  overlayUid: string;
};

/** Cubic Bézier from a left anchor to a right anchor; NULL arrows are short dashed stubs. */
export function arrowPath(a: Pick<ArrowGeometry, "x1" | "y1" | "x2" | "y2" | "isNull">): string {
  if (a.isNull) return `M ${a.x1} ${a.y1} L ${a.x2} ${a.y2}`;
  const mx = a.x1 + (a.x2 - a.x1) / 2;
  return `M ${a.x1} ${a.y1} C ${mx} ${a.y1}, ${mx} ${a.y2}, ${a.x2} ${a.y2}`;
}

const STATUS_OPACITY: Record<JoinArrowStatus, number> = {
  drawing: 1,
  active: 0.95,
  done: 0.2,
};

/**
 * SVG connectors for the JOIN canvas. Drawing paths start hidden; the JOIN
 * animator draws them on via the controller (so pause/speed apply). Completed
 * paths recede to low opacity.
 */
export default function JoinArrowOverlay({ width, height, arrows, overlayUid }: Props) {
  if (arrows.length === 0 || width <= 0) return null;
  const markerId = `${overlayUid}-a`;
  const nullMarkerId = `${overlayUid}-an`;

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-20 overflow-visible"
      width={width}
      height={height}
      aria-hidden
      data-join-arrows
    >
      <defs>
        <marker id={markerId} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="var(--color-join-matched)" />
        </marker>
        <marker id={nullMarkerId} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="var(--color-join-null)" />
        </marker>
      </defs>
      {arrows.map((a) => (
        <path
          key={a.key}
          data-arrow-key={a.key}
          data-status={a.status}
          d={arrowPath(a)}
          fill="none"
          stroke={a.isNull ? "var(--color-join-null)" : "var(--color-join-matched)"}
          strokeWidth={a.status === "done" ? 1.25 : 1.75}
          strokeLinecap="round"
          strokeDasharray={a.isNull ? "4 3" : undefined}
          markerEnd={`url(#${a.isNull ? nullMarkerId : markerId})`}
          className="pb-path"
          style={{ opacity: a.status === "drawing" ? 0 : STATUS_OPACITY[a.status] }}
        />
      ))}
    </svg>
  );
}
