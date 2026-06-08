import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 44,
  slug: "correlated-subquery",
  title: "Above Department Average",
  difficulty: "hard",
  topics: ["Subqueries"],
  description: "Find employees earning more than their department average.",
  schemaSql: `
CREATE TABLE employees (id SERIAL PRIMARY KEY, name VARCHAR(100), department VARCHAR(50), salary NUMERIC(10,2));
  `,
  seedSql: `
INSERT INTO employees (name, department, salary) VALUES ('A','Eng',95000), ('B','Eng',70000), ('C','Sales',80000), ('D','Sales',60000);
  `,
  expectedOutputSql: `SELECT name, department, salary FROM employees e WHERE salary > (SELECT AVG(salary) FROM employees WHERE department = e.department) ORDER BY department, salary DESC;`,
  hints: [
    `Correlated subquery references e.department.`,
    `Compare salary to dept average.`,
    `Subquery runs per outer row.`,
  ],
  explanation: "Correlated subqueries reference outer row.",
  officialSolution: `SELECT name, department, salary FROM employees e WHERE salary > (SELECT AVG(salary) FROM employees WHERE department = e.department);`,
};
