export type SqlSnippet = {
  id: string;
  label: string;
  sql: string;
};

export const SQL_SNIPPETS: SqlSnippet[] = [
  { id: "inner-join", label: "INNER JOIN", sql: "INNER JOIN table_b ON table_b.id = table_a.b_id" },
  { id: "left-join", label: "LEFT JOIN", sql: "LEFT JOIN table_b ON table_b.id = table_a.b_id" },
  { id: "right-join", label: "RIGHT JOIN", sql: "RIGHT JOIN table_b ON table_b.id = table_a.b_id" },
  { id: "group-by", label: "GROUP BY", sql: "GROUP BY column_name" },
  { id: "having", label: "HAVING", sql: "HAVING COUNT(*) > 1" },
  { id: "order-by", label: "ORDER BY", sql: "ORDER BY column_name ASC" },
  { id: "limit", label: "LIMIT", sql: "LIMIT 10" },
  { id: "count", label: "COUNT", sql: "COUNT(*)" },
  { id: "avg", label: "AVG", sql: "AVG(column_name)" },
  { id: "sum", label: "SUM", sql: "SUM(column_name)" },
  { id: "distinct", label: "DISTINCT", sql: "SELECT DISTINCT column_name" },
  { id: "where-null", label: "IS NULL", sql: "WHERE column_name IS NULL" },
  { id: "coalesce", label: "COALESCE", sql: "COALESCE(column_name, 'default')" },
];
