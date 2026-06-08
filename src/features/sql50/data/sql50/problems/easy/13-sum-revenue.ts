import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 13,
  slug: "sum-revenue",
  title: "Total Revenue",
  difficulty: "easy",
  topics: ["Aggregates"],
  description: "Calculate total revenue from all orders as total_revenue.",
  schemaSql: `
CREATE TABLE orders (id SERIAL PRIMARY KEY, amount NUMERIC(10,2));
  `,
  seedSql: `
INSERT INTO orders (amount) VALUES (100), (250), (75), (400);
  `,
  expectedOutputSql: `SELECT SUM(amount) AS total_revenue FROM orders;`,
  hints: [
    `SUM adds up numeric values.`,
    `Alias as total_revenue.`,
    `One row result, no GROUP BY.`,
  ],
  explanation: "SUM(amount) totals all order amounts.",
  officialSolution: `SELECT SUM(amount) AS total_revenue FROM orders;`,
};
