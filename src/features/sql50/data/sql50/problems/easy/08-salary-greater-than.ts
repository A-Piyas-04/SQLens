import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 8,
  slug: "salary-greater-than",
  title: "High Earners",
  difficulty: "easy",
  topics: ["WHERE"],
  description: "Find names of employees earning more than 80000.",
  schemaSql: `
CREATE TABLE employees (id SERIAL PRIMARY KEY, name VARCHAR(100), salary NUMERIC(10,2));
  `,
  seedSql: `
INSERT INTO employees (name, salary) VALUES ('Alice', 95000), ('Bob', 72000), ('Carla', 88000);
  `,
  expectedOutputSql: `SELECT name FROM employees WHERE salary > 80000 ORDER BY name;`,
  hints: [
    `Use > for numeric comparison.`,
    `Filter with WHERE before selecting.`,
    `Return the name column.`,
  ],
  explanation: "WHERE salary > 80000 filters high earners.",
  officialSolution: `SELECT name FROM employees WHERE salary > 80000;`,
};
