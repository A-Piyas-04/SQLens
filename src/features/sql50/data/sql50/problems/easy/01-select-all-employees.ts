import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 1,
  slug: "select-all-employees",
  title: "Select All Employees",
  difficulty: "easy",
  topics: ["SELECT"],
  description: "Return all columns and all rows from the employees table.",
  schemaSql: `
CREATE TABLE employees (id SERIAL PRIMARY KEY, name VARCHAR(100), department VARCHAR(50), salary NUMERIC(10,2));
  `,
  seedSql: `
INSERT INTO employees (name, department, salary) VALUES ('Alice', 'Engineering', 95000), ('Bob', 'Sales', 72000), ('Carla', 'Engineering', 88000);
  `,
  expectedOutputSql: `SELECT * FROM employees ORDER BY id;`,
  hints: [
    `Use SELECT with * to retrieve all columns.`,
    `The employees table holds the data you need.`,
    `No filtering is required — return every row.`,
  ],
  explanation: "A basic SELECT * retrieves all columns from a table.",
  officialSolution: `SELECT * FROM employees;`,
};
