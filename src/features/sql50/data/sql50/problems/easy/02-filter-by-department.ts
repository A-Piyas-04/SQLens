import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 2,
  slug: "filter-by-department",
  title: "Filter by Department",
  difficulty: "easy",
  topics: ["SELECT", "WHERE"],
  description: "Find all employees in the Engineering department.",
  schemaSql: `
CREATE TABLE employees (id SERIAL PRIMARY KEY, name VARCHAR(100), department VARCHAR(50));
  `,
  seedSql: `
INSERT INTO employees (name, department) VALUES ('Alice', 'Engineering'), ('Bob', 'Sales'), ('Carla', 'Engineering');
  `,
  expectedOutputSql: `SELECT name FROM employees WHERE department = 'Engineering' ORDER BY name;`,
  hints: [
    `Use WHERE to filter rows.`,
    `Compare the department column to 'Engineering'.`,
    `SELECT name to return only employee names.`,
  ],
  explanation: "WHERE filters rows before they are returned.",
  officialSolution: `SELECT name FROM employees WHERE department = 'Engineering';`,
};
