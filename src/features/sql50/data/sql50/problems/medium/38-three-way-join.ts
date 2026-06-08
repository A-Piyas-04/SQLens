import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 38,
  slug: "three-way-join",
  title: "Order Details",
  difficulty: "medium",
  topics: ["JOIN"],
  description: "Show customer name, product name, and quantity for each order line.",
  schemaSql: `
CREATE TABLE customers (id SERIAL PRIMARY KEY, name VARCHAR(100)); CREATE TABLE products (id SERIAL PRIMARY KEY, name VARCHAR(100)); CREATE TABLE order_lines (id SERIAL PRIMARY KEY, customer_id INT REFERENCES customers(id), product_id INT REFERENCES products(id), qty INT);
  `,
  seedSql: `
INSERT INTO customers (name) VALUES ('Alice'); INSERT INTO products (name) VALUES ('Widget'); INSERT INTO order_lines (customer_id, product_id, qty) VALUES (1, 1, 3);
  `,
  expectedOutputSql: `SELECT c.name AS customer, p.name AS product, ol.qty FROM order_lines ol JOIN customers c ON ol.customer_id = c.id JOIN products p ON ol.product_id = p.id ORDER BY ol.id;`,
  hints: [
    `Join order_lines to customers and products.`,
    `Use meaningful aliases.`,
    `Return customer, product, qty.`,
  ],
  explanation: "Three-way join connects multiple entities.",
  officialSolution: `SELECT c.name, p.name, ol.qty FROM order_lines ol JOIN customers c ON ol.customer_id = c.id JOIN products p ON ol.product_id = p.id;`,
};
