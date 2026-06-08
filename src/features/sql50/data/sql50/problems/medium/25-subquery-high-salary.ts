import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 25,
  slug: "subquery-high-salary",
  title: "Above Average Salary",
  difficulty: "medium",
  topics: ["Subqueries"],
  description: "Find employees earning more than the company average.",
  schemaSql: `
CREATE TABLE employees (id SERIAL PRIMARY KEY, name VARCHAR(100), salary NUMERIC(10,2));
  `,
  seedSql: `
INSERT INTO employees (name, salary) VALUES ('Alice', 100000), ('Bob', 60000), ('Carla', 80000);
  `,
  expectedOutputSql: `SELECT name, salary FROM employees WHERE salary > (SELECT AVG(salary) FROM employees) ORDER BY salary DESC;`,
  hints: [
    `Subquery in parentheses computes average.`,
    `Compare salary to subquery result.`,
    `Scalar subquery returns one value.`,
  ],
  explanation: "Subquery provides dynamic threshold.",
  officialSolution: `SELECT name, salary FROM employees WHERE salary > (SELECT AVG(salary) FROM employees);`,
};
