import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 34,
  slug: "string-concat",
  title: "Full Names",
  difficulty: "medium",
  topics: ["String Functions"],
  description: "Return full_name by combining first and last names with a space.",
  schemaSql: `
CREATE TABLE people (id SERIAL PRIMARY KEY, first_name VARCHAR(50), last_name VARCHAR(50));
  `,
  seedSql: `
INSERT INTO people (first_name, last_name) VALUES ('John', 'Doe'), ('Jane', 'Smith');
  `,
  expectedOutputSql: `SELECT first_name || ' ' || last_name AS full_name FROM people ORDER BY id;`,
  hints: [
    `|| concatenates strings in PostgreSQL.`,
    `Add a space between names.`,
    `Alias as full_name.`,
  ],
  explanation: "|| joins strings together.",
  officialSolution: `SELECT first_name || ' ' || last_name AS full_name FROM people;`,
};
