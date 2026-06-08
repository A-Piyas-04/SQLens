import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  Position,
  useReactFlow,
  type EdgeProps,
  type Node,
} from "@xyflow/react";

import type { ErdEdgeData, ErdTableNodeData } from "../../lib/erd/buildErdGraph";
import {
  computeEdgeLabelPosition,
  getErdNodeBounds,
} from "../../lib/erd/edgeLabelPosition";
import ErdCardinalityMarker from "./ErdCardinalityMarker";

/** Push line ends outward from the node so markers sit on the wire, not on handles. */
const MARKER_INSET = 12;

function outwardOffset(
  position: Position,
  distance: number
): { x: number; y: number } {
  switch (position) {
    case Position.Right:
      return { x: distance, y: 0 };
    case Position.Left:
      return { x: -distance, y: 0 };
    case Position.Top:
      return { x: 0, y: -distance };
    case Position.Bottom:
      return { x: 0, y: distance };
    default:
      return { x: 0, y: 0 };
  }
}

type ErdCardinalityEdgeData = ErdEdgeData & {
  sourceCardinality?: "one" | "many";
  targetCardinality?: "one" | "many";
};

export default function ErdCardinalityEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  labelStyle,
  labelBgStyle,
  labelBgPadding,
  labelBgBorderRadius,
  style,
  pathOptions,
  data,
}: EdgeProps) {
  const { getNode } = useReactFlow();
  const edgeData = data as ErdCardinalityEdgeData | undefined;
  const sourceOffset = outwardOffset(sourcePosition, MARKER_INSET);
  const targetOffset = outwardOffset(targetPosition, MARKER_INSET);
  const pathSourceX = sourceX + sourceOffset.x;
  const pathSourceY = sourceY + sourceOffset.y;
  const pathTargetX = targetX + targetOffset.x;
  const pathTargetY = targetY + targetOffset.y;

  const [edgePath, fallbackLabelX, fallbackLabelY] = getSmoothStepPath({
    sourceX: pathSourceX,
    sourceY: pathSourceY,
    sourcePosition,
    targetX: pathTargetX,
    targetY: pathTargetY,
    targetPosition,
    borderRadius: pathOptions?.borderRadius ?? 12,
    offset: pathOptions?.offset ?? 0,
  });

  const nodeBounds = [source, target]
    .map((nodeId) => getNode(nodeId))
    .filter((node): node is Node<ErdTableNodeData, "erdTable"> => !!node)
    .map((node) => getErdNodeBounds(node));

  const { x: labelX, y: labelY } = computeEdgeLabelPosition({
    pathSourceX,
    pathSourceY,
    pathTargetX,
    pathTargetY,
    fallbackX: fallbackLabelX,
    fallbackY: fallbackLabelY,
    nodeBounds,
  });

  const sourceCardinality = edgeData?.sourceCardinality ?? "many";
  const targetCardinality = edgeData?.targetCardinality ?? "one";
  const detailLabel =
    typeof edgeData?.detailLabel === "string"
      ? edgeData.detailLabel
      : typeof label === "string"
        ? label
        : undefined;

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} />
      <ErdCardinalityMarker
        x={pathSourceX}
        y={pathSourceY}
        position={sourcePosition}
        cardinality={sourceCardinality}
      />
      <ErdCardinalityMarker
        x={pathTargetX}
        y={pathTargetY}
        position={targetPosition}
        cardinality={targetCardinality}
      />
      {label ? (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan pointer-events-none z-10 max-w-[9.5rem] truncate rounded-sm border border-line/60 px-1.5 py-0.5 text-[10px] font-medium shadow-sm"
            title={detailLabel}
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              color: labelStyle?.fill ?? "#5c574f",
              background: labelBgStyle?.fill ?? "#f6f4ef",
              opacity: labelBgStyle?.fillOpacity ?? 1,
              padding: labelBgPadding
                ? `${labelBgPadding[1]}px ${labelBgPadding[0]}px`
                : undefined,
              borderRadius: labelBgBorderRadius ?? 3,
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}
