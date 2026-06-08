import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 46,
  slug: "recursive-not-needed-cte",
  title: "Top N Per Group",
  difficulty: "hard",
  topics: ["Window Functions", "Subqueries"],
  description: "Find the highest-paid employee in each department.",
  schemaSql: `
CREATE TABLE employees (id SERIAL PRIMARY KEY, name VARCHAR(100), department VARCHAR(50), salary NUMERIC(10,2));
  `,
  seedSql: `
INSERT INTO employees (name, department, salary) VALUES ('A','Eng',95000), ('B','Eng',88000), ('C','Sales',72000), ('D','Sales',68000);
  `,
  expectedOutputSql: `SELECT name, department, salary FROM (SELECT name, department, salary, RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS rnk FROM employees) t WHERE rnk = 1 ORDER BY department;`,
  hints: [
    `PARTITION BY department resets rank per dept.`,
    `Subquery filters rnk = 1.`,
    `RANK or ROW_NUMBER both work for top 1.`,
  ],
  explanation: "PARTITION BY enables per-group ranking.",
  officialSolution: `SELECT name, department, salary FROM (SELECT name, department, salary, RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS rnk FROM employees) sub WHERE rnk = 1;`,
};
