import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 36,
  slug: "not-exists",
  title: "Products Never Ordered",
  difficulty: "medium",
  topics: ["NOT EXISTS", "Subqueries"],
  description: "Find products that appear in no order lines.",
  schemaSql: `
CREATE TABLE products (id SERIAL PRIMARY KEY, name VARCHAR(100)); CREATE TABLE order_items (order_id INT, product_id INT REFERENCES products(id));
  `,
  seedSql: `
INSERT INTO products (name) VALUES ('A'), ('B'), ('C'); INSERT INTO order_items VALUES (1,1), (1,1);
  `,
  expectedOutputSql: `SELECT name FROM products p WHERE NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.product_id = p.id) ORDER BY name;`,
  hints: [
    `NOT EXISTS is true when subquery empty.`,
    `Correlate product_id to p.id.`,
    `Opposite of EXISTS pattern.`,
  ],
  explanation: "NOT EXISTS finds rows with no matches.",
  officialSolution: `SELECT name FROM products p WHERE NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.product_id = p.id);`,
};
