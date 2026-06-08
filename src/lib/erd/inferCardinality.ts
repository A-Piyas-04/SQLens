import type { SchemaTable } from "../db/schema";
import { getColumnUniqueConstraints } from "../db/schema";

export type CardinalityEnd = "one" | "many";

export type RelationshipKind =
  | "one-to-one"
  | "many-to-one"
  | "one-to-many"
  | "many-to-many";

export type FkCardinality = {
  source: CardinalityEnd;
  target: CardinalityEnd;
  kind: RelationshipKind;
};

export type JunctionRelationship = {
  junctionTable: string;
  entityA: string;
  entityB: string;
};

export function relationshipNotation(kind: RelationshipKind): string {
  switch (kind) {
    case "one-to-one":
      return "1:1";
    case "many-to-one":
      return "N:1";
    case "one-to-many":
      return "1:N";
    case "many-to-many":
      return "N:M";
  }
}

export function isFkColumnUnique(
  table: SchemaTable,
  columnName: string
): boolean {
  return getColumnUniqueConstraints(table, columnName).some(
    (unique) =>
      unique.column_names.length === 1 && unique.column_names[0] === columnName
  );
}

export function inferFkCardinality(
  sourceTable: SchemaTable,
  sourceColumn: string
): FkCardinality {
  if (isFkColumnUnique(sourceTable, sourceColumn)) {
    return { source: "one", target: "one", kind: "one-to-one" };
  }

  return { source: "many", target: "one", kind: "many-to-one" };
}

export function detectJunctionRelationships(
  tables: SchemaTable[]
): JunctionRelationship[] {
  const results: JunctionRelationship[] = [];
  const seen = new Set<string>();

  for (const table of tables) {
    if (table.foreignKeys.length !== 2) continue;

    const referencedTables = [
      ...new Set(table.foreignKeys.map((fk) => fk.foreign_table_name)),
    ];
    if (referencedTables.length !== 2) continue;

    const fkColumns = new Set(
      table.foreignKeys.map((fk) => fk.column_name)
    );
    const pkColumns = table.primaryKeys;

    const isJunctionPk =
      pkColumns.length > 0 &&
      pkColumns.length === table.foreignKeys.length &&
      pkColumns.every((column) => fkColumns.has(column));

    if (!isJunctionPk) continue;

    const [entityA, entityB] = referencedTables.sort();
    const pairKey = `${entityA}|${entityB}|${table.table_name}`;
    if (seen.has(pairKey)) continue;
    seen.add(pairKey);

    results.push({
      junctionTable: table.table_name,
      entityA,
      entityB,
    });
  }

  return results;
}

export function manyToManyCardinality(): FkCardinality {
  return { source: "many", target: "many", kind: "many-to-many" };
}
