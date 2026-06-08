import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 47,
  slug: "complex-join-aggregate",
  title: "Customer Lifetime Value",
  difficulty: "hard",
  topics: ["JOIN", "GROUP BY", "HAVING"],
  description: "Customers with total order value over 150, showing name and total.",
  schemaSql: `
CREATE TABLE customers (id SERIAL PRIMARY KEY, name VARCHAR(100)); CREATE TABLE orders (id SERIAL PRIMARY KEY, customer_id INT REFERENCES customers(id), amount NUMERIC(10,2));
  `,
  seedSql: `
INSERT INTO customers (name) VALUES ('Alice'), ('Bob'), ('Carla'); INSERT INTO orders (customer_id, amount) VALUES (1,100), (1,80), (2,50), (3,200);
  `,
  expectedOutputSql: `SELECT c.name, SUM(o.amount) AS total FROM customers c JOIN orders o ON c.id = o.customer_id GROUP BY c.name HAVING SUM(o.amount) > 150 ORDER BY total DESC;`,
  hints: [
    `JOIN, GROUP BY name, HAVING on SUM.`,
    `Filter groups over 150.`,
    `Order by total descending.`,
  ],
  explanation: "Combines join, aggregation, and HAVING.",
  officialSolution: `SELECT c.name, SUM(o.amount) AS total FROM customers c JOIN orders o ON c.id = o.customer_id GROUP BY c.name HAVING SUM(o.amount) > 150;`,
};
