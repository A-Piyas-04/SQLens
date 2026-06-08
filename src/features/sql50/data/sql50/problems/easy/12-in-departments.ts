import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 12,
  slug: "in-departments",
  title: "Multiple Departments",
  difficulty: "easy",
  topics: ["WHERE"],
  description: "Find employees in Engineering or Sales departments.",
  schemaSql: `
CREATE TABLE employees (id SERIAL PRIMARY KEY, name VARCHAR(100), department VARCHAR(50));
  `,
  seedSql: `
INSERT INTO employees (name, department) VALUES ('Alice', 'Engineering'), ('Bob', 'HR'), ('Carla', 'Sales');
  `,
  expectedOutputSql: `SELECT name, department FROM employees WHERE department IN ('Engineering', 'Sales') ORDER BY name;`,
  hints: [
    `IN checks membership in a list.`,
    `List both department names in parentheses.`,
    `Alternative: use OR.`,
  ],
  explanation: "IN ('Engineering', 'Sales') matches either department.",
  officialSolution: `SELECT name, department FROM employees WHERE department IN ('Engineering', 'Sales');`,
};
