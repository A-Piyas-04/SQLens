import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 22,
  slug: "group-by-department",
  title: "Employees per Department",
  difficulty: "medium",
  topics: ["GROUP BY", "Aggregates"],
  description: "Count employees in each department.",
  schemaSql: `
CREATE TABLE employees (id SERIAL PRIMARY KEY, name VARCHAR(100), department VARCHAR(50));
  `,
  seedSql: `
INSERT INTO employees (name, department) VALUES ('A','Eng'), ('B','Eng'), ('C','Sales'), ('D','HR');
  `,
  expectedOutputSql: `SELECT department, COUNT(*) AS emp_count FROM employees GROUP BY department ORDER BY department;`,
  hints: [
    `GROUP BY department creates one row per department.`,
    `COUNT(*) counts rows in each group.`,
    `Include department in SELECT.`,
  ],
  explanation: "GROUP BY splits rows into groups for aggregation.",
  officialSolution: `SELECT department, COUNT(*) AS emp_count FROM employees GROUP BY department;`,
};
