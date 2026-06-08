import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 9,
  slug: "null-email",
  title: "Missing Emails",
  difficulty: "easy",
  topics: ["NULL", "WHERE"],
  description: "Find customers who have no email address (email IS NULL).",
  schemaSql: `
CREATE TABLE customers (id SERIAL PRIMARY KEY, name VARCHAR(100), email VARCHAR(120));
  `,
  seedSql: `
INSERT INTO customers (name, email) VALUES ('Alice', 'a@x.com'), ('Bob', NULL), ('Carla', NULL);
  `,
  expectedOutputSql: `SELECT name FROM customers WHERE email IS NULL ORDER BY name;`,
  hints: [
    `NULL comparisons require IS NULL, not = NULL.`,
    `Filter where email IS NULL.`,
    `Return customer names.`,
  ],
  explanation: "IS NULL identifies missing values.",
  officialSolution: `SELECT name FROM customers WHERE email IS NULL;`,
};
