export const SQL50_TOPICS = [
  "SELECT",
  "WHERE",
  "ORDER BY",
  "LIMIT",
  "Aggregates",
  "GROUP BY",
  "HAVING",
  "JOIN",
  "LEFT JOIN",
  "Subqueries",
  "NULL",
  "DISTINCT",
  "CASE",
  "String Functions",
  "Date Functions",
  "Window Functions",
  "UNION",
  "EXISTS",
  "Self Join",
  "CTEs",
] as const;

export type Sql50Topic = (typeof SQL50_TOPICS)[number];
