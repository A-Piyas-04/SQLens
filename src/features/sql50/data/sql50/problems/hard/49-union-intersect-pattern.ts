import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 49,
  slug: "union-intersect-pattern",
  title: "Common Customers",
  difficulty: "hard",
  topics: ["Subqueries", "JOIN"],
  description: "Find customers who ordered both product A and product B.",
  schemaSql: `
CREATE TABLE customers (id SERIAL PRIMARY KEY, name VARCHAR(100)); CREATE TABLE products (id SERIAL PRIMARY KEY, name VARCHAR(100)); CREATE TABLE orders (customer_id INT REFERENCES customers(id), product_id INT REFERENCES products(id));
  `,
  seedSql: `
INSERT INTO customers (name) VALUES ('Alice'), ('Bob'), ('Carla'); INSERT INTO products (name) VALUES ('A'), ('B'); INSERT INTO orders VALUES (1,1), (1,2), (2,1);
  `,
  expectedOutputSql: `SELECT c.name FROM customers c WHERE EXISTS (SELECT 1 FROM orders o JOIN products p ON o.product_id = p.id WHERE o.customer_id = c.id AND p.name = 'A') AND EXISTS (SELECT 1 FROM orders o JOIN products p ON o.product_id = p.id WHERE o.customer_id = c.id AND p.name = 'B') ORDER BY c.name;`,
  hints: [
    `Two EXISTS conditions with AND.`,
    `Each checks one product.`,
    `Join orders to products for name filter.`,
  ],
  explanation: "Multiple EXISTS enforces multiple conditions.",
  officialSolution: `SELECT c.name FROM customers c WHERE EXISTS (SELECT 1 FROM orders o JOIN products p ON o.product_id = p.id WHERE o.customer_id = c.id AND p.name = 'A') AND EXISTS (SELECT 1 FROM orders o JOIN products p ON o.product_id = p.id WHERE o.customer_id = c.id AND p.name = 'B');`,
};
