import { describe, expect, it } from "vitest";

import type { Edge } from "@xyflow/react";

import type { SchemaTable } from "../../db/schema";
import { buildErdGraph } from "../buildErdGraph";
import { nodeHeight } from "../buildErdGraph";

type RoutedEdge = Edge & { pathOptions?: { offset?: number } };

function makeTable(
  name: string,
  fks: { column: string; refTable: string; refColumn: string }[] = [],
  extraColumns: { name: string; type?: string }[] = []
): SchemaTable {
  const columnNames = new Set(["id", ...extraColumns.map((c) => c.name), ...fks.map((fk) => fk.column)]);
  const columns = [...columnNames].map((columnName) => ({
    table_name: name,
    column_name: columnName,
    data_type: "integer",
    is_nullable: "NO",
    column_default: null,
  }));

  return {
    table_name: name,
    columns,
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

function pathOffset(edge: Edge): number {
  return (edge as RoutedEdge).pathOptions?.offset ?? 0;
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

  it("offsets edges that share the same target face but different columns", () => {
    const tables = [
      makeTable("hub"),
      makeTable("leaf_a", [{ column: "hub_id", refTable: "hub", refColumn: "id" }], [
        { name: "note", type: "text" },
      ]),
      makeTable("leaf_b", [{ column: "hub_ref", refTable: "hub", refColumn: "id" }]),
    ];

    const { edges } = buildErdGraph(tables);
    const toHub = edges.filter((e) => e.target === "hub");

    expect(toHub.length).toBeGreaterThanOrEqual(2);
    const offsets = toHub.map(pathOffset);
    expect(new Set(offsets).size).toBeGreaterThan(1);
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
    const parallel = edges.filter((e) => e.source === "b" && e.target === "a");

    expect(parallel).toHaveLength(2);
    expect(parallel[0].sourceHandle).not.toBe(parallel[1].sourceHandle);
    expect(pathOffset(parallel[0])).not.toBe(pathOffset(parallel[1]));
  });

  it("assigns column-aligned handles for vertical parent-child links", () => {
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
    expect(edge.sourceHandle).toBe("source-top-col-parent_id");
    expect(edge.targetHandle).toBe("target-bottom-col-id");
    expect(nodeHeight(1)).toBeGreaterThan(0);
  });

  it("separates edges from multiple children into the same parent", () => {
    const tables = [
      makeTable("hub"),
      makeTable("leaf_a", [{ column: "hub_id", refTable: "hub", refColumn: "id" }]),
      makeTable("leaf_b", [{ column: "hub_id", refTable: "hub", refColumn: "id" }]),
      makeTable("leaf_c", [{ column: "hub_id", refTable: "hub", refColumn: "id" }]),
    ];

    const { edges } = buildErdGraph(tables);
    const toHub = edges.filter((e) => e.target === "hub");

    expect(toHub).toHaveLength(3);
    expect(toHub.every((e) => e.sourceHandle?.includes("-col-hub_id"))).toBe(true);
    expect(toHub.every((e) => e.targetHandle?.includes("-col-id"))).toBe(true);

    const routes = new Set(
      toHub.map((e) => `${e.sourceHandle}|${e.targetHandle}|${pathOffset(e)}`)
    );
    expect(routes.size).toBe(3);
  });

  it("lays out a 20-table star schema with distinct routes for every FK edge", () => {
    const hub = makeTable("organizations");
    const leaves = Array.from({ length: 19 }, (_, i) =>
      makeTable(`entity_${i + 1}`, [
        { column: "org_id", refTable: "organizations", refColumn: "id" },
      ])
    );

    const { nodes, edges } = buildErdGraph([hub, ...leaves]);

    expect(nodes).toHaveLength(20);
    expect(edges).toHaveLength(19);

    const hubEdges = edges.filter((e) => e.target === "organizations");
    expect(hubEdges.every((e) => e.sourceHandle?.includes("-col-org_id"))).toBe(true);
    expect(hubEdges.every((e) => e.targetHandle?.includes("-col-id"))).toBe(true);

    const routes = new Set(
      hubEdges.map((e) => `${e.sourceHandle}|${e.targetHandle}|${pathOffset(e)}`)
    );
    expect(routes.size).toBe(19);
  });
});
