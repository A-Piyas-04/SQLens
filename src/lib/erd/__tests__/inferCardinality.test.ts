import { describe, expect, it } from "vitest";

import type { SchemaTable } from "../../db/schema";
import {
  detectJunctionRelationships,
  inferFkCardinality,
  relationshipNotation,
} from "../inferCardinality";

function makeTable(
  name: string,
  options: {
    fks?: { column: string; refTable: string; refColumn: string }[];
    primaryKeys?: string[];
    uniqueOn?: string[];
  } = {}
): SchemaTable {
  const fkCols = options.fks?.map((fk) => fk.column) ?? [];
  const uniqueCols = options.uniqueOn ?? [];
  const columnNames = [
    ...new Set(["id", ...fkCols, ...uniqueCols]),
  ];

  return {
    table_name: name,
    columns: columnNames.map((columnName) => ({
      table_name: name,
      column_name: columnName,
      data_type: "integer",
      is_nullable: "NO",
      column_default: null,
    })),
    primaryKeys: options.primaryKeys ?? ["id"],
    foreignKeys:
      options.fks?.map((fk) => ({
        table_name: name,
        column_name: fk.column,
        foreign_table_name: fk.refTable,
        foreign_column_name: fk.refColumn,
      })) ?? [],
    uniqueConstraints:
      options.uniqueOn?.map((column) => ({
        table_name: name,
        constraint_name: `${name}_${column}_key`,
        column_names: [column],
      })) ?? [],
    checkConstraints: [],
  };
}

describe("inferFkCardinality", () => {
  it("returns many-to-one for a standard foreign key", () => {
    const child = makeTable("orders", {
      fks: [{ column: "user_id", refTable: "users", refColumn: "id" }],
    });

    expect(inferFkCardinality(child, "user_id")).toEqual({
      source: "many",
      target: "one",
      kind: "many-to-one",
    });
    expect(relationshipNotation("many-to-one")).toBe("N:1");
  });

  it("returns one-to-one when the foreign key column is unique", () => {
    const profile = makeTable("profiles", {
      fks: [{ column: "user_id", refTable: "users", refColumn: "id" }],
      uniqueOn: ["user_id"],
    });

    expect(inferFkCardinality(profile, "user_id")).toEqual({
      source: "one",
      target: "one",
      kind: "one-to-one",
    });
  });
});

describe("detectJunctionRelationships", () => {
  it("detects a composite-key junction table as many-to-many", () => {
    const tables = [
      makeTable("students"),
      makeTable("courses"),
      makeTable("enrollments", {
        primaryKeys: ["student_id", "course_id"],
        fks: [
          { column: "student_id", refTable: "students", refColumn: "id" },
          { column: "course_id", refTable: "courses", refColumn: "id" },
        ],
      }),
    ];

    expect(detectJunctionRelationships(tables)).toEqual([
      {
        junctionTable: "enrollments",
        entityA: "courses",
        entityB: "students",
      },
    ]);
  });
});
