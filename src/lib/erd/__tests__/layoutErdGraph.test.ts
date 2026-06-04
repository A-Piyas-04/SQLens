import { describe, expect, it } from "vitest";

import type { SchemaTable } from "../../db/schema";
import { buildErdGraph } from "../buildErdGraph";
import { nodeHeight } from "../buildErdGraph";

function makeTable(
  name: string,
  fks: { column: string; refTable: string; refColumn: string }[] = []
): SchemaTable {
  return {
    table_name: name,
    columns: [
      {
        table_name: name,
        column_name: "id",
        data_type: "integer",
        is_nullable: "NO",
        column_default: null,
      },
    ],
    primaryKeys: ["id"],
    foreignKeys: fks.map((fk) => ({
      table_name: name,
      column_name: fk.column,
      foreign_table_name: fk.refTable,
      foreign_column_name: fk.refColumn,
      constraint_name: `${name}_${fk.column}_fkey`,
    })),
    uniqueConstraints: [],
    checkConstraints: [],
  };
}

describe("layoutErdGraph via buildErdGraph", () => {
  it("places referenced table above referencing table", () => {
    const tables = [
      makeTable("users"),
      makeTable("orders", [
        { column: "user_id", refTable: "users", refColumn: "id" },
      ]),
    ];

    const { nodes } = buildErdGraph(tables);
    const users = nodes.find((n) => n.id === "users")!;
    const orders = nodes.find((n) => n.id === "orders")!;

    expect(users.position.y).toBeLessThan(orders.position.y);
  });

  it("offsets parallel edges between the same table pair", () => {
    const tables = [
      makeTable("a"),
      makeTable("b", [
        { column: "a1", refTable: "a", refColumn: "id" },
        { column: "a2", refTable: "a", refColumn: "id" },
      ]),
    ];

    const { edges } = buildErdGraph(tables);
    const offsets = edges
      .filter((e) => e.source === "b" && e.target === "a")
      .map((e) => (e as { pathOptions?: { offset?: number } }).pathOptions?.offset ?? 0);

    expect(offsets).toHaveLength(2);
    expect(offsets[0]).not.toBe(offsets[1]);
  });

  it("assigns directional handles for vertical parent-child links", () => {
    const tables = [
      makeTable("parent"),
      makeTable("child", [
        { column: "parent_id", refTable: "parent", refColumn: "id" },
      ]),
    ];

    const { nodes, edges } = buildErdGraph(tables);
    const parent = nodes.find((n) => n.id === "parent")!;
    const child = nodes.find((n) => n.id === "child")!;
    const edge = edges.find((e) => e.source === "child")!;

    expect(child.position.y).toBeGreaterThan(parent.position.y);
    expect(edge.sourceHandle).toBe("source-top");
    expect(edge.targetHandle).toBe("target-bottom");
    expect(nodeHeight(1)).toBeGreaterThan(0);
  });
});
