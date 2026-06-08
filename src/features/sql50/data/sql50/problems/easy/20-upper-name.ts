import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 20,
  slug: "upper-name",
  title: "Uppercase Names",
  difficulty: "easy",
  topics: ["String Functions"],
  description: "Return employee names converted to uppercase as upper_name.",
  schemaSql: `
CREATE TABLE employees (id SERIAL PRIMARY KEY, name VARCHAR(100));
  `,
  seedSql: `
INSERT INTO employees (name) VALUES ('alice'), ('bob');
  `,
  expectedOutputSql: `SELECT UPPER(name) AS upper_name FROM employees ORDER BY id;`,
  hints: [
    `UPPER() converts text to uppercase.`,
    `Apply it to the name column.`,
    `Alias the result as upper_name.`,
  ],
  explanation: "UPPER() transforms string case.",
  officialSolution: `SELECT UPPER(name) AS upper_name FROM employees;`,
};
