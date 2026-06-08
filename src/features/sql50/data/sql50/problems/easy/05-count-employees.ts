import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 5,
  slug: "count-employees",
  title: "Count Employees",
  difficulty: "easy",
  topics: ["Aggregates"],
  description: "Return the total number of employees as employee_count.",
  schemaSql: `
CREATE TABLE employees (id SERIAL PRIMARY KEY, name VARCHAR(100));
  `,
  seedSql: `
INSERT INTO employees (name) VALUES ('Alice'), ('Bob'), ('Carla'), ('David');
  `,
  expectedOutputSql: `SELECT COUNT(*) AS employee_count FROM employees;`,
  hints: [
    `COUNT(*) counts all rows.`,
    `Use AS to alias the result column.`,
    `No GROUP BY needed for a single total.`,
  ],
  explanation: "COUNT(*) aggregates all rows into one value.",
  officialSolution: `SELECT COUNT(*) AS employee_count FROM employees;`,
};
