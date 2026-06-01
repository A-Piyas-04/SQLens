import type { SchemaTable } from "../db/schema";

const MAX_SCHEMA_CHARS = 4_000;

export function formatSchemaForAi(tables: SchemaTable[]): string {
  if (tables.length === 0) return "";

  const lines: string[] = [];

  for (const table of tables) {
    const columnList = table.columns
      .map((col) => {
        const pk = table.primaryKeys.includes(col.column_name) ? " PK" : "";
        return `${col.column_name} (${col.data_type})${pk}`;
      })
      .join(", ");

    lines.push(`- ${table.table_name}: ${columnList}`);

    for (const fk of table.foreignKeys) {
      lines.push(
        `  FK: ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`
      );
    }

    const block = lines.join("\n");
    if (block.length >= MAX_SCHEMA_CHARS) {
      return `${block.slice(0, MAX_SCHEMA_CHARS)}\n…`;
    }
  }

  return lines.join("\n").slice(0, MAX_SCHEMA_CHARS);
}
