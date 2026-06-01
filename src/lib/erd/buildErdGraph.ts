import { MarkerType, type Edge, type Node } from "@xyflow/react";

import type { SchemaTable } from "../db/schema";

export type ErdTableNodeData = {
  table: SchemaTable;
  [key: string]: unknown;
};

type ErdNode = Node<ErdTableNodeData, "erdTable">;

const NODE_WIDTH = 248;
const HEADER_H = 44;
const ROW_H = 30;
const PADDING_V = 8;
const H_GAP = 90;
const V_GAP = 56;
const COLS_PER_ROW = 3;

function nodeHeight(columnCount: number): number {
  return HEADER_H + columnCount * ROW_H + PADDING_V;
}

export function buildErdGraph(tables: SchemaTable[]): {
  nodes: ErdNode[];
  edges: Edge[];
} {
  if (tables.length === 0) return { nodes: [], edges: [] };

  const rowCount = Math.ceil(tables.length / COLS_PER_ROW);
  const rowHeights: number[] = Array.from({ length: rowCount }, () => 0);

  tables.forEach((table, i) => {
    const row = Math.floor(i / COLS_PER_ROW);
    rowHeights[row] = Math.max(rowHeights[row], nodeHeight(table.columns.length));
  });

  const rowOffsets: number[] = [0];
  for (let r = 1; r < rowCount; r++) {
    rowOffsets[r] = rowOffsets[r - 1] + rowHeights[r - 1] + V_GAP;
  }

  const nodes: ErdNode[] = tables.map((table, i) => {
    const row = Math.floor(i / COLS_PER_ROW);
    const col = i % COLS_PER_ROW;
    return {
      id: table.table_name,
      type: "erdTable",
      position: {
        x: col * (NODE_WIDTH + H_GAP),
        y: rowOffsets[row],
      },
      data: { table },
    };
  });

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

  return { nodes, edges };
}
