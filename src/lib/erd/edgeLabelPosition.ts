import { NODE_WIDTH, nodeHeight } from "./buildErdGraph";
import type { ErdTableNodeData } from "./buildErdGraph";
import type { Node } from "@xyflow/react";

type Bounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export function getErdNodeBounds(node: Node<ErdTableNodeData>): Bounds {
  const height = nodeHeight(node.data.table.columns.length);
  return {
    left: node.position.x,
    top: node.position.y,
    right: node.position.x + NODE_WIDTH,
    bottom: node.position.y + height,
  };
}

function pointInsideBounds(
  x: number,
  y: number,
  bounds: Bounds,
  margin: number
): boolean {
  return (
    x >= bounds.left - margin &&
    x <= bounds.right + margin &&
    y >= bounds.top - margin &&
    y <= bounds.bottom + margin
  );
}

function collidesWithNodes(
  x: number,
  y: number,
  boundsList: Bounds[],
  margin: number
): boolean {
  return boundsList.some((bounds) => pointInsideBounds(x, y, bounds, margin));
}

/**
 * Picks a label point on the open span between two tables, offset perpendicular
 * to the connector so text does not sit on top of node boxes.
 */
export function computeEdgeLabelPosition(args: {
  pathSourceX: number;
  pathSourceY: number;
  pathTargetX: number;
  pathTargetY: number;
  fallbackX: number;
  fallbackY: number;
  nodeBounds: Bounds[];
}): { x: number; y: number } {
  const {
    pathSourceX,
    pathSourceY,
    pathTargetX,
    pathTargetY,
    fallbackX,
    fallbackY,
    nodeBounds,
  } = args;

  const dx = pathTargetX - pathSourceX;
  const dy = pathTargetY - pathSourceY;
  const len = Math.hypot(dx, dy);
  const perpX = len > 0 ? -dy / len : 0;
  const perpY = len > 0 ? dx / len : 1;

  const candidates: { x: number; y: number }[] = [];

  for (const t of [0.5, 0.42, 0.58, 0.35, 0.65, 0.45, 0.55]) {
    const baseX = pathSourceX + dx * t;
    const baseY = pathSourceY + dy * t;

    for (const sign of [1, -1] as const) {
      for (const offset of [14, 22, 30, 40, 52]) {
        candidates.push({
          x: baseX + perpX * offset * sign,
          y: baseY + perpY * offset * sign,
        });
      }
    }
  }

  candidates.push({ x: fallbackX, y: fallbackY });
  candidates.push({
    x: (pathSourceX + pathTargetX) / 2 + perpX * 36,
    y: (pathSourceY + pathTargetY) / 2 + perpY * 36,
  });
  candidates.push({
    x: (pathSourceX + pathTargetX) / 2 - perpX * 36,
    y: (pathSourceY + pathTargetY) / 2 - perpY * 36,
  });

  for (const candidate of candidates) {
    if (!collidesWithNodes(candidate.x, candidate.y, nodeBounds, 12)) {
      return candidate;
    }
  }

  return {
    x: (pathSourceX + pathTargetX) / 2 + perpX * 48,
    y: (pathSourceY + pathTargetY) / 2 + perpY * 48,
  };
}
