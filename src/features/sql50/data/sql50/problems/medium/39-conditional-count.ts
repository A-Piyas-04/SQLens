import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 39,
  slug: "conditional-count",
  title: "Active vs Inactive",
  difficulty: "medium",
  topics: ["Aggregates", "CASE"],
  description: "Count active and inactive users in one row as active_count and inactive_count.",
  schemaSql: `
CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(100), is_active BOOLEAN);
  `,
  seedSql: `
INSERT INTO users (name, is_active) VALUES ('A', true), ('B', false), ('C', true);
  `,
  expectedOutputSql: `SELECT SUM(CASE WHEN is_active THEN 1 ELSE 0 END) AS active_count, SUM(CASE WHEN NOT is_active THEN 1 ELSE 0 END) AS inactive_count FROM users;`,
  hints: [
    `CASE inside SUM counts conditionally.`,
    `Boolean is_active drives branches.`,
    `Two SUM columns in one query.`,
  ],
  explanation: "Conditional aggregation counts categories.",
  officialSolution: `SELECT SUM(CASE WHEN is_active THEN 1 ELSE 0 END) AS active_count, SUM(CASE WHEN NOT is_active THEN 1 ELSE 0 END) AS inactive_count FROM users;`,
};
