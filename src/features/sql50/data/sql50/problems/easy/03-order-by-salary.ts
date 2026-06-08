import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 3,
  slug: "order-by-salary",
  title: "Order by Salary",
  difficulty: "easy",
  topics: ["SELECT", "ORDER BY"],
  description: "List employee names sorted by salary from highest to lowest.",
  schemaSql: `
CREATE TABLE employees (id SERIAL PRIMARY KEY, name VARCHAR(100), salary NUMERIC(10,2));
  `,
  seedSql: `
INSERT INTO employees (name, salary) VALUES ('Alice', 95000), ('Bob', 72000), ('Carla', 88000);
  `,
  expectedOutputSql: `SELECT name, salary FROM employees ORDER BY salary DESC;`,
  hints: [
    `ORDER BY controls sort order.`,
    `Use DESC for descending (highest first).`,
    `Include name and salary in SELECT.`,
  ],
  explanation: "ORDER BY salary DESC sorts rows from highest salary to lowest.",
  officialSolution: `SELECT name, salary FROM employees ORDER BY salary DESC;`,
};
