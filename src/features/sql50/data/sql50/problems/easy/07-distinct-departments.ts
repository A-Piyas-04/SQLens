import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 7,
  slug: "distinct-departments",
  title: "Distinct Departments",
  difficulty: "easy",
  topics: ["SELECT", "DISTINCT"],
  description: "List each unique department name exactly once.",
  schemaSql: `
CREATE TABLE employees (id SERIAL PRIMARY KEY, name VARCHAR(100), department VARCHAR(50));
  `,
  seedSql: `
INSERT INTO employees (name, department) VALUES ('Alice', 'Engineering'), ('Bob', 'Sales'), ('Carla', 'Engineering'), ('David', 'Sales');
  `,
  expectedOutputSql: `SELECT DISTINCT department FROM employees ORDER BY department;`,
  hints: [
    `DISTINCT removes duplicate values.`,
    `Select only the department column.`,
    `No aggregation function needed.`,
  ],
  explanation: "DISTINCT returns unique values from a column.",
  officialSolution: `SELECT DISTINCT department FROM employees;`,
};
