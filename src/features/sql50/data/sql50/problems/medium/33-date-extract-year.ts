import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 33,
  slug: "date-extract-year",
  title: "Orders by Year",
  difficulty: "medium",
  topics: ["Date Functions", "GROUP BY"],
  description: "Count orders placed in each year.",
  schemaSql: `
CREATE TABLE orders (id SERIAL PRIMARY KEY, order_date DATE);
  `,
  seedSql: `
INSERT INTO orders (order_date) VALUES ('2023-01-15'), ('2023-06-20'), ('2024-03-10');
  `,
  expectedOutputSql: `SELECT EXTRACT(YEAR FROM order_date) AS yr, COUNT(*) AS cnt FROM orders GROUP BY EXTRACT(YEAR FROM order_date) ORDER BY yr;`,
  hints: [
    `EXTRACT(YEAR FROM ...) gets year from date.`,
    `GROUP BY the year expression.`,
    `COUNT orders per year.`,
  ],
  explanation: "EXTRACT pulls date parts for grouping.",
  officialSolution: `SELECT EXTRACT(YEAR FROM order_date) AS yr, COUNT(*) AS cnt FROM orders GROUP BY EXTRACT(YEAR FROM order_date);`,
};
