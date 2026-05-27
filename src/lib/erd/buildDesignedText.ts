import type { ForeignKeyRelation, SchemaTable } from "../db/schema";

const BOX_PAD = 2;

function dedupeForeignKeys(tables: SchemaTable[]): ForeignKeyRelation[] {
  const seen = new Set<string>();
  const result: ForeignKeyRelation[] = [];

  for (const table of tables) {
    for (const fk of table.foreignKeys) {
      const id = `${fk.table_name}.${fk.column_name}->${fk.foreign_table_name}.${fk.foreign_column_name}`;
      if (seen.has(id)) continue;
      seen.add(id);
      result.push(fk);
    }
  }

  return result;
}

function formatColumnLine(
  table: SchemaTable,
  col: SchemaTable["columns"][number]
): string {
  const isPk = table.primaryKeys.includes(col.column_name);
  const fk = table.foreignKeys.find((f) => f.column_name === col.column_name);

  const badges: string[] = [];
  if (isPk) badges.push("[PK]");
  if (fk) badges.push(`[FK → ${fk.foreign_table_name}.${fk.foreign_column_name}]`);

  const nullability = col.is_nullable === "NO" ? "NOT NULL" : "NULL";
  const defaultPart = col.column_default ? ` DEFAULT ${col.column_default}` : "";

  const prefix = isPk ? "* " : "  ";
  const namePart = col.column_name.padEnd(14);
  const typePart = col.data_type.padEnd(12);
  const badgePart = badges.length > 0 ? ` ${badges.join(" ")}` : "";

  return `${prefix}${namePart}${typePart}${nullability}${defaultPart}${badgePart}`;
}

function buildEntityBox(table: SchemaTable): string[] {
  const lines = table.columns.map((col) => formatColumnLine(table, col));
  const innerWidth = Math.max(
    table.table_name.length + 4,
    ...lines.map((l) => l.length)
  );
  const title = `─ ${table.table_name} `;
  const top =
    "┌" + title + "─".repeat(Math.max(0, innerWidth - title.length + BOX_PAD)) + "┐";
  const bottom = "└" + "─".repeat(innerWidth + BOX_PAD) + "┘";
  const body = lines.map((line) => {
    const padded = line.padEnd(innerWidth + BOX_PAD);
    return `│${padded}│`;
  });

  return [top, ...body, bottom];
}

export function buildDesignedText(tables: SchemaTable[]): string {
  if (tables.length === 0) {
    return "SQLens ERD — Designed Text\n\nNo tables in schema.";
  }

  const timestamp = new Date().toISOString();
  const header = [
    "SQLens ERD — Designed Text",
    `Tables: ${tables.length} | Generated: ${timestamp}`,
    "",
  ];

  const entityBlocks = tables.flatMap((table) => [...buildEntityBox(table), ""]);

  const relationships = dedupeForeignKeys(tables);
  const relationshipSection =
    relationships.length > 0
      ? [
          "── Relationships ──",
          ...relationships.map(
            (fk) =>
              `${fk.table_name}.${fk.column_name} ──FK──> ${fk.foreign_table_name}.${fk.foreign_column_name}`
          ),
          "",
        ]
      : ["── Relationships ──", "(none)", ""];

  const constraintsSection = [
    "── Constraints ──",
    ...tables.map((table) => {
      const pkList =
        table.primaryKeys.length > 0
          ? table.primaryKeys.join(", ")
          : "(none detected)";
      return `${table.table_name}: PRIMARY KEY (${pkList})`;
    }),
    "",
    "Note: UNIQUE and CHECK constraints are not introspected in this view.",
  ];

  return [...header, ...entityBlocks, ...relationshipSection, ...constraintsSection].join(
    "\n"
  );
}
