import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 31,
  slug: "coalesce-default",
  title: "Default Discount",
  difficulty: "medium",
  topics: ["NULL", "CASE"],
  description: "Return product names with discount_pct, using 0 when NULL.",
  schemaSql: `
CREATE TABLE products (id SERIAL PRIMARY KEY, name VARCHAR(100), discount_pct NUMERIC(5,2));
  `,
  seedSql: `
INSERT INTO products (name, discount_pct) VALUES ('A', 10), ('B', NULL), ('C', 5);
  `,
  expectedOutputSql: `SELECT name, COALESCE(discount_pct, 0) AS discount_pct FROM products ORDER BY name;`,
  hints: [
    `COALESCE returns first non-NULL value.`,
    `Replace NULL with 0.`,
    `Keep column alias discount_pct.`,
  ],
  explanation: "COALESCE handles NULL defaults.",
  officialSolution: `SELECT name, COALESCE(discount_pct, 0) AS discount_pct FROM products;`,
};
