import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 50,
  slug: "full-analytics-query",
  title: "Monthly Sales Report",
  difficulty: "hard",
  topics: ["CTEs", "JOIN", "GROUP BY", "Window Functions"],
  description: "Per month: total sales and percent of grand total as pct_of_total.",
  schemaSql: `
CREATE TABLE sales (id SERIAL PRIMARY KEY, sale_date DATE, amount NUMERIC(10,2));
  `,
  seedSql: `
INSERT INTO sales (sale_date, amount) VALUES ('2024-01-05', 100), ('2024-01-20', 200), ('2024-02-10', 150);
  `,
  expectedOutputSql: `WITH monthly AS (SELECT TO_CHAR(sale_date, 'YYYY-MM') AS month, SUM(amount) AS total FROM sales GROUP BY TO_CHAR(sale_date, 'YYYY-MM')), grand AS (SELECT SUM(total) AS g FROM monthly) SELECT m.month, m.total, ROUND((m.total / g.g * 100)::numeric, 2) AS pct_of_total FROM monthly m CROSS JOIN grand g ORDER BY m.month;`,
  hints: [
    `CTE for monthly totals.`,
    `Second CTE for grand total.`,
    `CROSS JOIN to compute percentage.`,
  ],
  explanation: "Multi-CTE analytics with percentage of total.",
  officialSolution: `WITH monthly AS (SELECT TO_CHAR(sale_date, 'YYYY-MM') AS month, SUM(amount) AS total FROM sales GROUP BY TO_CHAR(sale_date, 'YYYY-MM')), grand AS (SELECT SUM(total) AS g FROM monthly) SELECT m.month, m.total, ROUND((m.total / g.g * 100)::numeric, 2) AS pct_of_total FROM monthly m CROSS JOIN grand g ORDER BY m.month;`,
};
