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

export type UniqueConstraint = {
  table_name: string;
  constraint_name: string;
  column_names: string[];
};

export type CheckConstraint = {
  table_name: string;
  constraint_name: string;
  check_clause: string;
};

export type SchemaTable = {
  table_name: string;
  columns: SchemaColumn[];
  foreignKeys: ForeignKeyRelation[];
  primaryKeys: string[];
  uniqueConstraints: UniqueConstraint[];
  checkConstraints: CheckConstraint[];
};

type UniqueConstraintRow = {
  table_name: string;
  constraint_name: string;
  column_name: string;
  ordinal_position: number;
};

type CheckConstraintRow = {
  table_name: string;
  constraint_name: string;
  check_clause: string;
};

/** Postgres emits NOT NULL as check constraints; skip — shown on columns already. */
export function isSystemNotNullCheck(checkClause: string): boolean {
  const normalized = checkClause.replace(/\s+/g, " ").trim();
  return /^\(*\s*[a-zA-Z_][\w$]*\s+IS\s+NOT\s+NULL\s*\)*$/i.test(normalized);
}

export function isPkRedundantUnique(
  table: Pick<SchemaTable, "primaryKeys">,
  unique: UniqueConstraint
): boolean {
  if (unique.column_names.length !== table.primaryKeys.length) return false;
  const pkSet = new Set(table.primaryKeys);
  return unique.column_names.every((col) => pkSet.has(col));
}

export function getColumnUniqueConstraints(
  table: SchemaTable,
  columnName: string
): UniqueConstraint[] {
  return table.uniqueConstraints.filter(
    (unique) =>
      unique.column_names.includes(columnName) &&
      !isPkRedundantUnique(table, unique)
  );
}

function groupUniqueRows(rows: UniqueConstraintRow[]): UniqueConstraint[] {
  const byKey = new Map<
    string,
    { table_name: string; constraint_name: string; cols: { pos: number; name: string }[] }
  >();

  for (const row of rows) {
    const key = `${row.table_name}:${row.constraint_name}`;
    if (!byKey.has(key)) {
      byKey.set(key, {
        table_name: row.table_name,
        constraint_name: row.constraint_name,
        cols: [],
      });
    }
    byKey.get(key)!.cols.push({
      pos: row.ordinal_position,
      name: row.column_name,
    });
  }

  return [...byKey.values()].map(({ table_name, constraint_name, cols }) => ({
    table_name,
    constraint_name,
    column_names: cols.sort((a, b) => a.pos - b.pos).map((c) => c.name),
  }));
}

function filterUserCheckConstraints(rows: CheckConstraintRow[]): CheckConstraint[] {
  return rows.filter((row) => !isSystemNotNullCheck(row.check_clause));
}

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
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.constraint_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public';
  `);

  const pkResult = await db.query(`
    SELECT
      tc.table_name,
      kcu.column_name,
      kcu.ordinal_position
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.ordinal_position;
  `);

  const uniqueResult = await db.query(`
    SELECT
      tc.table_name,
      tc.constraint_name,
      kcu.column_name,
      kcu.ordinal_position
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'UNIQUE'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name, tc.constraint_name, kcu.ordinal_position;
  `);

  const checkResult = await db.query(`
    SELECT
      tc.table_name,
      tc.constraint_name,
      cc.check_clause
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.check_constraints AS cc
      ON tc.constraint_name = cc.constraint_name
      AND tc.constraint_schema = cc.constraint_schema
    WHERE tc.constraint_type = 'CHECK'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name, tc.constraint_name;
  `);

  const columns = columnsResult.rows as SchemaColumn[];
  const foreignKeys = fkResult.rows as ForeignKeyRelation[];
  const primaryKeyRows = pkResult.rows as {
    table_name: string;
    column_name: string;
    ordinal_position: number;
  }[];
  const uniqueRows = uniqueResult.rows as UniqueConstraintRow[];
  const checkRows = checkResult.rows as CheckConstraintRow[];

  const allUnique = groupUniqueRows(uniqueRows);
  const allChecks = filterUserCheckConstraints(checkRows);

  const tableNames = [...new Set(columns.map((col) => col.table_name))];

  return tableNames.map((tableName) => {
    const primaryKeys = primaryKeyRows
      .filter((pk) => pk.table_name === tableName)
      .sort((a, b) => a.ordinal_position - b.ordinal_position)
      .map((pk) => pk.column_name);

    const tableUnique = allUnique.filter((u) => u.table_name === tableName);
    const tableChecks = allChecks.filter((c) => c.table_name === tableName);

    return {
      table_name: tableName,
      columns: columns.filter((col) => col.table_name === tableName),
      foreignKeys: foreignKeys.filter((fk) => fk.table_name === tableName),
      primaryKeys,
      uniqueConstraints: tableUnique.filter(
        (unique) => !isPkRedundantUnique({ primaryKeys }, unique)
      ),
      checkConstraints: tableChecks,
    };
  });
}
