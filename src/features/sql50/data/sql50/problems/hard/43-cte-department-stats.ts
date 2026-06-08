import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 43,
  slug: "cte-department-stats",
  title: "Department Stats CTE",
  difficulty: "hard",
  topics: ["CTEs", "GROUP BY"],
  description: "Use a CTE to find departments with average salary above 75000.",
  schemaSql: `
CREATE TABLE employees (id SERIAL PRIMARY KEY, name VARCHAR(100), department VARCHAR(50), salary NUMERIC(10,2));
  `,
  seedSql: `
INSERT INTO employees (name, department, salary) VALUES ('A','Eng',90000), ('B','Eng',85000), ('C','Sales',60000);
  `,
  expectedOutputSql: `WITH dept_avg AS (SELECT department, AVG(salary) AS avg_sal FROM employees GROUP BY department) SELECT department, avg_sal FROM dept_avg WHERE avg_sal > 75000 ORDER BY department;`,
  hints: [
    `WITH ... AS defines a CTE.`,
    `Aggregate in CTE, filter in outer query.`,
    `Threshold 75000 in WHERE.`,
  ],
  explanation: "CTEs name intermediate result sets.",
  officialSolution: `WITH dept_avg AS (SELECT department, AVG(salary) AS avg_sal FROM employees GROUP BY department) SELECT department, avg_sal FROM dept_avg WHERE avg_sal > 75000;`,
};
