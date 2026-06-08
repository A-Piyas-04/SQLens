import { MarkerType, type Edge, type Node } from "@xyflow/react";

import type { SchemaTable } from "../db/schema";
import { layoutErdGraph } from "./layoutErdGraph";

export type ErdTableNodeData = {
  table: SchemaTable;
  [key: string]: unknown;
};

export type ErdEdgeData = {
  sourceColumn: string;
  targetColumn: string;
  [key: string]: unknown;
};

type ErdNode = Node<ErdTableNodeData, "erdTable">;

export const NODE_WIDTH = 248;
export const HEADER_H = 44;
export const ROW_H = 30;
export const PADDING_V = 8;

export function nodeHeight(columnCount: number): number {
  return HEADER_H + columnCount * ROW_H + PADDING_V;
}

/** Vertical center of a column row inside a table node (px from top). */
export function columnRowCenter(columnIndex: number): number {
  return HEADER_H + columnIndex * ROW_H + ROW_H / 2;
}

export function buildErdGraph(tables: SchemaTable[]): {
  nodes: ErdNode[];
  edges: Edge[];
} {
  if (tables.length === 0) return { nodes: [], edges: [] };

  const nodes: ErdNode[] = tables.map((table) => ({
    id: table.table_name,
    type: "erdTable",
    position: { x: 0, y: 0 },
    data: { table },
  }));

  const edges: Edge[] = [];
  const seen = new Set<string>();

  tables.forEach((table) => {
    table.foreignKeys.forEach((fk) => {
      const id = `${fk.table_name}.${fk.column_name}->${fk.foreign_table_name}.${fk.foreign_column_name}`;
      if (seen.has(id)) return;
      seen.add(id);

      edges.push({
        id,
        source: fk.table_name,
        target: fk.foreign_table_name,
        type: "smoothstep",
        animated: false,
        data: {
          sourceColumn: fk.column_name,
          targetColumn: fk.foreign_column_name,
        },
        label: `${fk.column_name} → ${fk.foreign_column_name}`,
        labelStyle: { fill: "#5c574f", fontSize: 10, fontWeight: 500 },
        labelBgStyle: { fill: "#f6f4ef", fillOpacity: 1 },
        labelBgPadding: [4, 2] as [number, number],
        labelBgBorderRadius: 3,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#0d6b63",
          width: 14,
          height: 14,
        },
        style: { stroke: "#0d6b63", strokeWidth: 1.5 },
      });
    });
  });

  return layoutErdGraph(nodes, edges);
}
