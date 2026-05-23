import type { PGlite } from "@electric-sql/pglite";

export type SchemaColumn = {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
};

export type ForeignKeyRelation = {
  table_name: string;
  column_name: string;
  foreign_table_name: string;
  foreign_column_name: string;
};

export type SchemaTable = {
  table_name: string;
  columns: SchemaColumn[];
  foreignKeys: ForeignKeyRelation[];
  primaryKeys: string[];
};

export async function getSchema(db: PGlite): Promise<SchemaTable[]> {
  const columnsResult = await db.query(`
    SELECT table_name, column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position;
  `);

  const fkResult = await db.query(`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public';
  `);

  const pkResult = await db.query(`
    SELECT
      tc.table_name,
      kcu.column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
      AND tc.table_schema = 'public';
  `);

  const columns = columnsResult.rows as SchemaColumn[];
  const foreignKeys = fkResult.rows as ForeignKeyRelation[];
  const primaryKeyRows = pkResult.rows as { table_name: string; column_name: string }[];

  const tableNames = [...new Set(columns.map((col) => col.table_name))];

  return tableNames.map((tableName) => ({
    table_name: tableName,
    columns: columns.filter((col) => col.table_name === tableName),
    foreignKeys: foreignKeys.filter((fk) => fk.table_name === tableName),
    primaryKeys: primaryKeyRows
      .filter((pk) => pk.table_name === tableName)
      .map((pk) => pk.column_name),
  }));
}
