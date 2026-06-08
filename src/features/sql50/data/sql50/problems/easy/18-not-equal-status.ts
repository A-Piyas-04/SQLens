import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 18,
  slug: "not-equal-status",
  title: "Non-Cancelled Orders",
  difficulty: "easy",
  topics: ["WHERE"],
  description: "Find orders that are not cancelled.",
  schemaSql: `
CREATE TABLE orders (id SERIAL PRIMARY KEY, status VARCHAR(20));
  `,
  seedSql: `
INSERT INTO orders (status) VALUES ('pending'), ('shipped'), ('cancelled'), ('delivered');
  `,
  expectedOutputSql: `SELECT id, status FROM orders WHERE status <> 'cancelled' ORDER BY id;`,
  hints: [
    `Use != or <> for not equal.`,
    `Exclude status 'cancelled'.`,
    `Return id and status.`,
  ],
  explanation: "!= or <> filters out cancelled orders.",
  officialSolution: `SELECT id, status FROM orders WHERE status != 'cancelled';`,
};
