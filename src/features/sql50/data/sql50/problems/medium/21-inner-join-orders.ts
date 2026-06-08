import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 21,
  slug: "inner-join-orders",
  title: "Orders with Customers",
  difficulty: "medium",
  topics: ["JOIN"],
  description: "Return order id, customer name, and amount by joining orders to customers.",
  schemaSql: `
CREATE TABLE customers (id SERIAL PRIMARY KEY, name VARCHAR(100)); CREATE TABLE orders (id SERIAL PRIMARY KEY, customer_id INT REFERENCES customers(id), amount NUMERIC(10,2));
  `,
  seedSql: `
INSERT INTO customers (name) VALUES ('Alice'), ('Bob'); INSERT INTO orders (customer_id, amount) VALUES (1, 100), (1, 50), (2, 200);
  `,
  expectedOutputSql: `SELECT o.id, c.name, o.amount FROM orders o JOIN customers c ON o.customer_id = c.id ORDER BY o.id;`,
  hints: [
    `JOIN links orders.customer_id to customers.id.`,
    `Use table aliases o and c.`,
    `INNER JOIN keeps only matching rows.`,
  ],
  explanation: "JOIN combines related rows from two tables.",
  officialSolution: `SELECT o.id, c.name, o.amount FROM orders o JOIN customers c ON o.customer_id = c.id;`,
};
