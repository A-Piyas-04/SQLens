import { Position } from "@xyflow/react";

import type { CardinalityEnd } from "../../lib/erd/inferCardinality";

const STROKE = "#0d6b63";
const STROKE_WIDTH = 1.5;
const CROW_SPAN = 5;
const CROW_DEPTH = 6;
const ONE_TICK = 5;

type Props = {
  x: number;
  y: number;
  position: Position;
  cardinality: CardinalityEnd;
};

function openingDirection(position: Position): "left" | "right" | "up" | "down" {
  switch (position) {
    case Position.Right:
      return "left";
    case Position.Left:
      return "right";
    case Position.Top:
      return "down";
    case Position.Bottom:
      return "up";
    default:
      return "left";
  }
}

function crowFootLines(opening: "left" | "right" | "up" | "down"): string[] {
  switch (opening) {
    case "left":
      return [
        `M ${-CROW_DEPTH} ${-CROW_SPAN} L 0 0`,
        `M ${-CROW_DEPTH} 0 L 0 0`,
        `M ${-CROW_DEPTH} ${CROW_SPAN} L 0 0`,
      ];
    case "right":
      return [
        `M ${CROW_DEPTH} ${-CROW_SPAN} L 0 0`,
        `M ${CROW_DEPTH} 0 L 0 0`,
        `M ${CROW_DEPTH} ${CROW_SPAN} L 0 0`,
      ];
    case "up":
      return [
        `M ${-CROW_SPAN} ${-CROW_DEPTH} L 0 0`,
        `M 0 ${-CROW_DEPTH} L 0 0`,
        `M ${CROW_SPAN} ${-CROW_DEPTH} L 0 0`,
      ];
    case "down":
      return [
        `M ${-CROW_SPAN} ${CROW_DEPTH} L 0 0`,
        `M 0 ${CROW_DEPTH} L 0 0`,
        `M ${CROW_SPAN} ${CROW_DEPTH} L 0 0`,
      ];
  }
}

function oneTickLine(opening: "left" | "right" | "up" | "down"): string {
  switch (opening) {
    case "left":
    case "right":
      return `M 0 ${-ONE_TICK} L 0 ${ONE_TICK}`;
    case "up":
    case "down":
      return `M ${-ONE_TICK} 0 L ${ONE_TICK} 0`;
  }
}

export default function ErdCardinalityMarker({
  x,
  y,
  position,
  cardinality,
}: Props) {
  const opening = openingDirection(position);
  const paths =
    cardinality === "many" ? crowFootLines(opening) : [oneTickLine(opening)];

  return (
    <g transform={`translate(${x}, ${y})`} pointerEvents="none">
      {paths.map((path) => (
        <path
          key={path}
          d={path}
          fill="none"
          stroke={STROKE}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </g>
  );
}
