import { NODE_WIDTH, nodeHeight } from "./buildErdGraph";
import type { ErdTableNodeData } from "./buildErdGraph";
import type { Node } from "@xyflow/react";

type Bounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export type LabelBox = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export function getErdNodeBounds(node: Node<ErdTableNodeData>): Bounds {
  const height = nodeHeight(node.data.table.columns.length);
  const x = node.position.x;
  const y = node.position.y;

  return {
    left: x,
    top: y,
    right: x + NODE_WIDTH,
    bottom: y + height,
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

function boxesOverlap(a: LabelBox, b: Bounds, margin: number): boolean {
  return !(
    a.right + margin < b.left ||
    a.left - margin > b.right ||
    a.bottom + margin < b.top ||
    a.top - margin > b.bottom
  );
}

function estimateLabelBox(
  x: number,
  y: number,
  labelText: string
): LabelBox {
  const charWidth = 6.2;
  const width = Math.min(152, Math.max(56, labelText.length * charWidth + 20));
  const height = 22;

  return {
    left: x - width / 2,
    right: x + width / 2,
    top: y - height / 2,
    bottom: y + height / 2,
  };
}

function collidesWithNodes(
  x: number,
  y: number,
  boundsList: Bounds[],
  margin: number,
  labelText: string
): boolean {
  const labelBox = estimateLabelBox(x, y, labelText);
  return boundsList.some(
    (bounds) =>
      pointInsideBounds(x, y, bounds, margin) ||
      boxesOverlap(labelBox, bounds, margin)
  );
}

/**
 * Picks a label point on the open span between tables, offset perpendicular
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
  labelText: string;
}): { x: number; y: number } {
  const {
    pathSourceX,
    pathSourceY,
    pathTargetX,
    pathTargetY,
    fallbackX,
    fallbackY,
    nodeBounds,
    labelText,
  } = args;

  const dx = pathTargetX - pathSourceX;
  const dy = pathTargetY - pathSourceY;
  const len = Math.hypot(dx, dy);
  const perpX = len > 0 ? -dy / len : 0;
  const perpY = len > 0 ? dx / len : 1;

  const candidates: { x: number; y: number }[] = [];

  for (const t of [0.5, 0.42, 0.58, 0.35, 0.65, 0.28, 0.72, 0.45, 0.55]) {
    const baseX = pathSourceX + dx * t;
    const baseY = pathSourceY + dy * t;

    for (const sign of [1, -1] as const) {
      for (const offset of [18, 28, 38, 50, 64, 80]) {
        candidates.push({
          x: baseX + perpX * offset * sign,
          y: baseY + perpY * offset * sign,
        });
      }
    }
  }

  candidates.push({ x: fallbackX, y: fallbackY });
  candidates.push({
    x: (pathSourceX + pathTargetX) / 2 + perpX * 56,
    y: (pathSourceY + pathTargetY) / 2 + perpY * 56,
  });
  candidates.push({
    x: (pathSourceX + pathTargetX) / 2 - perpX * 56,
    y: (pathSourceY + pathTargetY) / 2 - perpY * 56,
  });

  for (const candidate of candidates) {
    if (!collidesWithNodes(candidate.x, candidate.y, nodeBounds, 10, labelText)) {
      return candidate;
    }
  }

  return {
    x: (pathSourceX + pathTargetX) / 2 + perpX * 88,
    y: (pathSourceY + pathTargetY) / 2 + perpY * 88,
  };
}
