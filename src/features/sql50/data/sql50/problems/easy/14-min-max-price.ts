import type { PracticeProblem } from "../../../../../../lib/practice/types";

export const problem: PracticeProblem = {
  id: 14,
  slug: "min-max-price",
  title: "Min and Max Price",
  difficulty: "easy",
  topics: ["Aggregates"],
  description: "Return the minimum and maximum product prices as min_price and max_price.",
  schemaSql: `
CREATE TABLE products (id SERIAL PRIMARY KEY, name VARCHAR(100), price NUMERIC(10,2));
  `,
  seedSql: `
INSERT INTO products (name, price) VALUES ('A', 10), ('B', 50), ('C', 30);
  `,
  expectedOutputSql: `SELECT MIN(price) AS min_price, MAX(price) AS max_price FROM products;`,
  hints: [
    `MIN and MAX are aggregate functions.`,
    `Select both in one query.`,
    `Use aliases for column names.`,
  ],
  explanation: "MIN and MAX return extreme values.",
  officialSolution: `SELECT MIN(price) AS min_price, MAX(price) AS max_price FROM products;`,
};
