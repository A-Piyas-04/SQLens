import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 40,
  slug: "rank-by-salary",
  title: "Salary Rank",
  difficulty: "medium",
  topics: ["Window Functions"],
  description: "List employee names and salaries with rank (1 = highest) as salary_rank.",
  schemaSql: `
CREATE TABLE employees (id SERIAL PRIMARY KEY, name VARCHAR(100), salary NUMERIC(10,2));
  `,
  seedSql: `
INSERT INTO employees (name, salary) VALUES ('Alice', 100000), ('Bob', 80000), ('Carla', 90000);
  `,
  expectedOutputSql: `SELECT name, salary, RANK() OVER (ORDER BY salary DESC) AS salary_rank FROM employees ORDER BY salary_rank, name;`,
  hints: [
    `RANK() OVER (ORDER BY ...) is a window function.`,
    `ORDER BY salary DESC for highest first.`,
    `No GROUP BY needed.`,
  ],
  explanation: "Window functions compute across rows without collapsing.",
  officialSolution: `SELECT name, salary, RANK() OVER (ORDER BY salary DESC) AS salary_rank FROM employees;`,
};
