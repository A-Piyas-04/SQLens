import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 41,
  slug: "running-total",
  title: "Running Order Total",
  difficulty: "hard",
  topics: ["Window Functions"],
  description: "Show each order amount with running total as running_sum ordered by id.",
  schemaSql: `
CREATE TABLE orders (id SERIAL PRIMARY KEY, amount NUMERIC(10,2));
  `,
  seedSql: `
INSERT INTO orders (amount) VALUES (100), (50), (75), (200);
  `,
  expectedOutputSql: `SELECT id, amount, SUM(amount) OVER (ORDER BY id) AS running_sum FROM orders ORDER BY id;`,
  hints: [
    `SUM(...) OVER (ORDER BY id) creates running total.`,
    `Window frame accumulates rows.`,
    `Include id and amount.`,
  ],
  explanation: "Running sum uses ordered window frame.",
  officialSolution: `SELECT id, amount, SUM(amount) OVER (ORDER BY id) AS running_sum FROM orders;`,
};
