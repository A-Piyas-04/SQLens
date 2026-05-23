import { db } from "./pglite";

export type SchemaTable = {
  table_name: string;
};

export async function getTables(): Promise<SchemaTable[]> {
  const result = await db.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);

  return result.rows as SchemaTable[];
}
