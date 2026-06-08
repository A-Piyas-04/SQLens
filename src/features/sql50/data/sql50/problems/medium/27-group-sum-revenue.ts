import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 27,
  slug: "group-sum-revenue",
  title: "Revenue by Customer",
  difficulty: "medium",
  topics: ["GROUP BY", "JOIN", "Aggregates"],
  description: "Total order amount per customer name.",
  schemaSql: `
CREATE TABLE customers (id SERIAL PRIMARY KEY, name VARCHAR(100)); CREATE TABLE orders (id SERIAL PRIMARY KEY, customer_id INT REFERENCES customers(id), amount NUMERIC(10,2));
  `,
  seedSql: `
INSERT INTO customers (name) VALUES ('Alice'), ('Bob'); INSERT INTO orders (customer_id, amount) VALUES (1,100), (1,50), (2,200);
  `,
  expectedOutputSql: `SELECT c.name, SUM(o.amount) AS total FROM orders o JOIN customers c ON o.customer_id = c.id GROUP BY c.name ORDER BY c.name;`,
  hints: [
    `JOIN orders to customers first.`,
    `GROUP BY customer name.`,
    `SUM the amount column.`,
  ],
  explanation: "JOIN then GROUP BY aggregates per entity.",
  officialSolution: `SELECT c.name, SUM(o.amount) AS total FROM orders o JOIN customers c ON o.customer_id = c.id GROUP BY c.name;`,
};
