import {
  useLayoutEffect,
  useMemo,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { cn } from "../../../../lib/utils/cn";

export type StageAnchor = { x: number; y: number };

export type PersistentArrow = {
  key: string;
  leftId: string;
  rightId: string | null;
  isNull: boolean;
  drawing: boolean;
};

type ResolvedArrow = {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  length: number;
  isNull: boolean;
  drawing: boolean;
};

type Props = {
  stageRef: RefObject<HTMLDivElement | null>;
  arrows: PersistentArrow[];
  leftAnchors: Map<string, StageAnchor>;
  rightAnchors: Map<string, StageAnchor>;
  overlayUid: string;
};

export default function JoinArrowOverlay({
  stageRef,
  arrows,
  leftAnchors,
  rightAnchors,
  overlayUid,
}: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [resolved, setResolved] = useState<ResolvedArrow[]>([]);

  const anchorKey = useMemo(
    () => arrows.map((a) => `${a.key}:${a.drawing}`).join("|"),
    [arrows]
  );

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || arrows.length === 0) {
      setResolved([]);
      return;
    }

    const sr = stage.getBoundingClientRect();
    const next: ResolvedArrow[] = [];

    for (const arrow of arrows) {
      const left = leftAnchors.get(arrow.leftId);
      if (!left) continue;

      const right =
        !arrow.isNull && arrow.rightId ? rightAnchors.get(arrow.rightId) : null;

      if (!arrow.isNull && !right) continue;

      const x1 = left.x;
      const y1 = left.y;
      const x2 = right?.x ?? left.x + 64;
      const y2 = right?.y ?? left.y;

      next.push({
        key: arrow.key,
        x1,
        y1,
        x2,
        y2,
        length: Math.max(1, Math.hypot(x2 - x1, y2 - y1)),
        isNull: arrow.isNull,
        drawing: arrow.drawing,
      });
    }

    setSize({ w: sr.width, h: sr.height });
    setResolved(next);
  }, [stageRef, arrows, leftAnchors, rightAnchors, anchorKey]);

  if (resolved.length === 0 || size.w <= 0) return null;

  const markerId = `${overlayUid}-a`;
  const nullMarkerId = `${overlayUid}-an`;

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-20 overflow-visible"
      width={size.w}
      height={size.h}
      aria-hidden
    >
      <defs>
        <marker
          id={markerId}
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L6,3 z" fill="#34d399" fillOpacity="0.85" />
        </marker>
        <marker
          id={nullMarkerId}
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L6,3 z" fill="#fbbf24" fillOpacity="0.7" />
        </marker>
      </defs>

      {resolved.map((arrow) => (
        <line
          key={arrow.key}
          x1={arrow.x1}
          y1={arrow.y1}
          x2={arrow.x2}
          y2={arrow.y2}
          stroke={arrow.isNull ? "#fbbf24" : "#34d399"}
          strokeWidth={1.25}
          strokeOpacity={arrow.drawing ? 0.9 : 0.58}
          strokeLinecap="round"
          strokeDasharray={arrow.isNull ? "4 3" : `${arrow.length} ${arrow.length}`}
          strokeDashoffset={
            arrow.isNull ? undefined : arrow.drawing ? arrow.length : 0
          }
          markerEnd={
            arrow.isNull ? `url(#${nullMarkerId})` : `url(#${markerId})`
          }
          className={cn(
            !arrow.isNull && arrow.drawing && "pb-join-arrow-draw",
            arrow.isNull && arrow.drawing && "pb-join-arrow-null-draw"
          )}
          style={
            !arrow.isNull && arrow.drawing
              ? ({ "--arrow-length": `${arrow.length}px` } as CSSProperties)
              : undefined
          }
        />
      ))}
    </svg>
  );
}
