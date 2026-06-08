import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 30,
  slug: "self-join-managers",
  title: "Employees and Managers",
  difficulty: "medium",
  topics: ["Self Join"],
  description: "List employee names with their manager names.",
  schemaSql: `
CREATE TABLE employees (id SERIAL PRIMARY KEY, name VARCHAR(100), manager_id INT REFERENCES employees(id));
  `,
  seedSql: `
INSERT INTO employees (id, name, manager_id) VALUES (1, 'CEO', NULL), (2, 'Alice', 1), (3, 'Bob', 1), (4, 'Carla', 2);
  `,
  expectedOutputSql: `SELECT e.name AS employee, m.name AS manager FROM employees e LEFT JOIN employees m ON e.manager_id = m.id WHERE e.manager_id IS NOT NULL ORDER BY e.name;`,
  hints: [
    `Join employees to itself.`,
    `e is employee, m is manager.`,
    `Match e.manager_id = m.id.`,
  ],
  explanation: "Self join relates rows within same table.",
  officialSolution: `SELECT e.name AS employee, m.name AS manager FROM employees e JOIN employees m ON e.manager_id = m.id;`,
};
