import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 17,
  slug: "select-specific-columns",
  title: "Name and Email",
  difficulty: "easy",
  topics: ["SELECT"],
  description: "Return only name and email columns from customers.",
  schemaSql: `
CREATE TABLE customers (id SERIAL PRIMARY KEY, name VARCHAR(100), email VARCHAR(120), city VARCHAR(80));
  `,
  seedSql: `
INSERT INTO customers (name, email, city) VALUES ('Alice', 'a@x.com', 'NYC'), ('Bob', 'b@x.com', 'LA');
  `,
  expectedOutputSql: `SELECT name, email FROM customers ORDER BY name;`,
  hints: [
    `List column names after SELECT.`,
    `Do not use *.`,
    `Only name and email are needed.`,
  ],
  explanation: "Explicit column lists control output.",
  officialSolution: `SELECT name, email FROM customers;`,
};
