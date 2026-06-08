import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 24,
  slug: "left-join-no-orders",
  title: "Customers Without Orders",
  difficulty: "medium",
  topics: ["LEFT JOIN"],
  description: "List customers who have never placed an order.",
  schemaSql: `
CREATE TABLE customers (id SERIAL PRIMARY KEY, name VARCHAR(100)); CREATE TABLE orders (id SERIAL PRIMARY KEY, customer_id INT REFERENCES customers(id));
  `,
  seedSql: `
INSERT INTO customers (name) VALUES ('Alice'), ('Bob'), ('Carla'); INSERT INTO orders (customer_id) VALUES (1);
  `,
  expectedOutputSql: `SELECT c.name FROM customers c LEFT JOIN orders o ON c.id = o.customer_id WHERE o.id IS NULL ORDER BY c.name;`,
  hints: [
    `LEFT JOIN keeps all customers.`,
    `WHERE o.id IS NULL finds no matching order.`,
    `Unmatched join side is NULL.`,
  ],
  explanation: "LEFT JOIN + IS NULL finds rows without matches.",
  officialSolution: `SELECT c.name FROM customers c LEFT JOIN orders o ON c.id = o.customer_id WHERE o.id IS NULL;`,
};
