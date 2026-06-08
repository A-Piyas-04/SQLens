import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 6,
  slug: "average-salary",
  title: "Average Salary",
  difficulty: "easy",
  topics: ["Aggregates"],
  description: "Calculate the average salary across all employees as avg_salary.",
  schemaSql: `
CREATE TABLE employees (id SERIAL PRIMARY KEY, name VARCHAR(100), salary NUMERIC(10,2));
  `,
  seedSql: `
INSERT INTO employees (name, salary) VALUES ('Alice', 90000), ('Bob', 70000), ('Carla', 80000);
  `,
  expectedOutputSql: `SELECT ROUND(AVG(salary)::numeric, 2) AS avg_salary FROM employees;`,
  hints: [
    `AVG() computes the mean of a numeric column.`,
    `Alias the result as avg_salary.`,
    `Aggregate functions collapse rows into one.`,
  ],
  explanation: "AVG(salary) returns the mean salary.",
  officialSolution: `SELECT AVG(salary) AS avg_salary FROM employees;`,
};
