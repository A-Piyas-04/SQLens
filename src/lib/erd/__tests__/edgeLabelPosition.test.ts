import { describe, expect, it } from "vitest";

import type { SchemaTable } from "../../db/schema";
import { computeEdgeLabelPosition, getErdNodeBounds } from "../edgeLabelPosition";
import type { ErdTableNodeData } from "../buildErdGraph";
import type { Node } from "@xyflow/react";

function makeNode(
  id: string,
  x: number,
  y: number,
  columnCount = 3
): Node<ErdTableNodeData, "erdTable"> {
  const columns = Array.from({ length: columnCount }, (_, index) => ({
    table_name: id,
    column_name: `col_${index}`,
    data_type: "integer",
    is_nullable: "NO",
    column_default: null,
  }));

  const table: SchemaTable = {
    table_name: id,
    columns,
    primaryKeys: ["col_0"],
    foreignKeys: [],
    uniqueConstraints: [],
    checkConstraints: [],
  };

  return {
    id,
    type: "erdTable",
    position: { x, y },
    data: { table },
  };
}

describe("computeEdgeLabelPosition", () => {
  it("offsets labels away from a node when the fallback point sits on the table", () => {
    const exams = getErdNodeBounds(makeNode("exams", 100, 100, 5));

    const position = computeEdgeLabelPosition({
      pathSourceX: 120,
      pathSourceY: 180,
      pathTargetX: 120,
      pathTargetY: 320,
      fallbackX: 120,
      fallbackY: 250,
      nodeBounds: [exams],
      labelText: "student_id → semester_id",
    });

    expect(position.x).not.toBe(120);
    expect(
      position.x < exams.left - 8 || position.x > exams.right + 8
    ).toBe(true);
  });
});
