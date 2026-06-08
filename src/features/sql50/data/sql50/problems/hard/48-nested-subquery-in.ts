import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 48,
  slug: "nested-subquery-in",
  title: "Second Highest Salary",
  difficulty: "hard",
  topics: ["Subqueries"],
  description: "Find the second highest distinct salary as second_highest.",
  schemaSql: `
CREATE TABLE employees (id SERIAL PRIMARY KEY, name VARCHAR(100), salary NUMERIC(10,2));
  `,
  seedSql: `
INSERT INTO employees (name, salary) VALUES ('A', 100000), ('B', 90000), ('C', 90000), ('D', 80000);
  `,
  expectedOutputSql: `SELECT MAX(salary) AS second_highest FROM employees WHERE salary < (SELECT MAX(salary) FROM employees);`,
  hints: [
    `Inner MAX finds highest.`,
    `Outer finds max below that.`,
    `Handles duplicate top salaries.`,
  ],
  explanation: "Nested aggregates find nth extreme value.",
  officialSolution: `SELECT MAX(salary) AS second_highest FROM employees WHERE salary < (SELECT MAX(salary) FROM employees);`,
};
