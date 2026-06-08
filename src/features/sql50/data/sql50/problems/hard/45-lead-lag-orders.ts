import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 45,
  slug: "lead-lag-orders",
  title: "Day-over-Day Change",
  difficulty: "hard",
  topics: ["Window Functions"],
  description: "Show each day's revenue and previous day's revenue using LAG.",
  schemaSql: `
CREATE TABLE daily_revenue (day DATE PRIMARY KEY, revenue NUMERIC(10,2));
  `,
  seedSql: `
INSERT INTO daily_revenue VALUES ('2024-01-01', 100), ('2024-01-02', 150), ('2024-01-03', 120);
  `,
  expectedOutputSql: `SELECT day, revenue, LAG(revenue) OVER (ORDER BY day) AS prev_revenue FROM daily_revenue ORDER BY day;`,
  hints: [
    `LAG(column) gets previous row value.`,
    `ORDER BY day in OVER clause.`,
    `First row has NULL prev_revenue.`,
  ],
  explanation: "LAG accesses prior row in window.",
  officialSolution: `SELECT day, revenue, LAG(revenue) OVER (ORDER BY day) AS prev_revenue FROM daily_revenue;`,
};
