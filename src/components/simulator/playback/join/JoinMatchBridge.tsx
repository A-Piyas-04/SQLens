import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "../../../../lib/utils/cn";
import { buildBridgePath, type ActiveBridgeLink } from "./joinPlaybackModel";

type RowAnchor = { y: number; xEdge: number };

type Props = {
  link: ActiveBridgeLink | null;
  leftAnchors: Map<string, RowAnchor>;
  rightAnchors: Map<string, RowAnchor>;
  animating: boolean;
  bridgeUid: string;
};

export default function JoinMatchBridge({
  link,
  leftAnchors,
  rightAnchors,
  animating,
  bridgeUid,
}: Props) {
  const bridgeRef = useRef<HTMLDivElement>(null);
  const [geom, setGeom] = useState<{ w: number; h: number; path: string } | null>(null);

  useLayoutEffect(() => {
    const bridge = bridgeRef.current;
    if (!bridge || !link) {
      setGeom(null);
      return;
    }

    const br = bridge.getBoundingClientRect();
    const left = leftAnchors.get(link.leftId);
    const right = link.isNull ? null : link.rightId ? rightAnchors.get(link.rightId) : null;

    if (!left) {
      setGeom(null);
      return;
    }

    const yLeft = left.y - br.top;
    const yRight = right ? right.y - br.top : yLeft;
    const w = br.width;

    setGeom({
      w,
      h: Math.max(br.height, yLeft, yRight) + 8,
      path: buildBridgePath(w, yLeft, yRight, link.isNull),
    });
  }, [link, leftAnchors, rightAnchors]);

  const gradId = `${bridgeUid}-flow`;
  const glowId = `${bridgeUid}-glow`;
  const markerId = `${bridgeUid}-arrow`;

  return (
    <div
      ref={bridgeRef}
      className="relative mx-auto w-full min-w-[88px] max-w-[160px] self-stretch"
      aria-hidden
    >
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-slate-600/30 to-transparent" />

      {geom && link && (
        <svg
          className="absolute inset-0 overflow-visible"
          width="100%"
          height={geom.h}
          viewBox={`0 0 ${geom.w} ${geom.h}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6ee7b7" />
              <stop offset="55%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#2dd4bf" />
            </linearGradient>
            <linearGradient id={`${gradId}-null`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fcd34d" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
            <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <marker
              id={markerId}
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L0,8 L8,4 z" fill="#34d399" />
            </marker>
            <marker
              id={`${markerId}-null`}
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L0,8 L8,4 z" fill="#fbbf24" />
            </marker>
          </defs>

          <path
            d={geom.path}
            fill="none"
            stroke={link.isNull ? `url(#${gradId}-null)` : `url(#${gradId})`}
            strokeWidth={link.isNull ? 2 : 3}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            strokeDasharray={link.isNull ? "6 4" : "1"}
            pathLength={link.isNull ? undefined : 1}
            strokeDashoffset={link.isNull ? undefined : animating ? 1 : 0}
            markerEnd={
              link.isNull ? `url(#${markerId}-null)` : `url(#${markerId})`
            }
            filter={link.isNull ? undefined : `url(#${glowId})`}
            className={cn(
              !link.isNull && animating && "pb-join-flow-draw",
              link.isNull && animating && "pb-join-flow-null"
            )}
          />

        </svg>
      )}

      {link && link.pairCount > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[9px] font-medium text-emerald-300">
          {link.pairIndex + 1} / {link.pairCount}
        </div>
      )}
    </div>
  );
}
