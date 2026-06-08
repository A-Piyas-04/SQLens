import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 11,
  slug: "between-salary",
  title: "Salary Range",
  difficulty: "easy",
  topics: ["WHERE"],
  description: "List employees with salary between 70000 and 90000 inclusive.",
  schemaSql: `
CREATE TABLE employees (id SERIAL PRIMARY KEY, name VARCHAR(100), salary NUMERIC(10,2));
  `,
  seedSql: `
INSERT INTO employees (name, salary) VALUES ('Alice', 95000), ('Bob', 75000), ('Carla', 85000), ('David', 65000);
  `,
  expectedOutputSql: `SELECT name, salary FROM employees WHERE salary BETWEEN 70000 AND 90000 ORDER BY salary;`,
  hints: [
    `BETWEEN is inclusive of both endpoints.`,
    `Filter salary with BETWEEN 70000 AND 90000.`,
    `Return name and salary.`,
  ],
  explanation: "BETWEEN includes both boundary values.",
  officialSolution: `SELECT name, salary FROM employees WHERE salary BETWEEN 70000 AND 90000;`,
};
